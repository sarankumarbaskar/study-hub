# Phase 4 — I/O and NIO: The Complete Deep Dive

> This explains why Netty exists, why reactive frameworks exist, and why thread-per-request doesn't scale.

I/O (Input/Output) is the reason your Java application is slow. Not because your algorithms are wrong, not because the JVM is inefficient, but because every time your code talks to a database, calls a REST API, reads a file, or sends a message to Kafka, it crosses the boundary between CPU speed and the physical world — and that boundary represents a speed difference of millions of times. Understanding I/O at the OS level is what separates a developer who writes "working" code from an architect who designs systems that scale to millions of connections.

This phase covers three progressively more sophisticated I/O models: **blocking I/O** (the simplest — one thread per connection, easy to write but doesn't scale), **non-blocking I/O with selectors** (the foundation of Netty and every high-performance Java server — one thread handles thousands of connections), and **memory-mapped I/O** (the fastest possible file access — data flows directly between disk and your application without any copies). Each model exists because the previous one hit a fundamental limitation, and understanding the chain of reasoning explains why modern Java networking looks the way it does.

---

## 1. The Fundamental Problem — Why I/O Is the Bottleneck

The table below is the single most important table in systems programming. It shows the time cost of different operations relative to a single CPU cycle. Look at the numbers: a network round-trip is **1.7 million times** slower than a CPU register access. A disk seek is **33 million times** slower. When a thread calls `socket.read()` and no data has arrived yet, that thread is doing absolutely nothing — burning 1MB of stack memory, consuming an OS thread slot, but producing zero useful work — for the equivalent of millions of CPU cycles. This is the fundamental problem that all of I/O engineering is designed to solve: **how do you keep the CPU busy when the world outside is millions of times slower?**

```
Operation                  Time           Relative to 1 CPU cycle (0.3ns)
─────────────────────────────────────────────────────────────────────────
CPU register access        0.3 ns         1x
L1 cache                   1 ns           3x
L2 cache                   4 ns           13x
L3 cache                   12 ns          40x
Main memory                100 ns         330x
SSD random read            16,000 ns      53,000x        (16 μs)
Network round-trip         500,000 ns     1,700,000x     (0.5 ms)
Disk seek (HDD)            10,000,000 ns  33,000,000x    (10 ms)

I/O is 10,000x to 33,000,000x slower than computation.
A thread that blocks on I/O wastes its entire stack (~1MB) doing NOTHING.
```

---

## 2. Blocking I/O (java.io) — Thread-Per-Connection

Blocking I/O is the model most Java developers learn first, and for good reason: it's simple, intuitive, and perfectly adequate for many applications. Each connection gets its own thread, each thread reads and writes using `InputStream` and `OutputStream`, and the thread blocks (sleeps) whenever it's waiting for data. The operating system handles the sleeping and waking — your code just calls `read()` and gets data when it arrives.

The problem only appears at scale. When you have 10, 100, or even 1,000 concurrent connections, blocking I/O works fine. But when you need 10,000 or 100,000 concurrent connections (a chat server, a WebSocket service, an IoT gateway, a real-time bidding platform), blocking I/O falls apart. Each connection consumes a thread, each thread consumes ~1MB of stack memory, and the OS scheduler degrades as it tries to context-switch between thousands of threads. This is the **C10K problem** (serving 10,000 concurrent connections), first articulated in 1999, and it drove the creation of every non-blocking I/O framework that followed.

### How Traditional I/O Works

```java
// Server accepts connections — one thread per client:
ServerSocket serverSocket = new ServerSocket(8080);

while (true) {
    Socket clientSocket = serverSocket.accept();   // BLOCKS until connection
    new Thread(() -> handleClient(clientSocket)).start();
}

void handleClient(Socket socket) {
    InputStream in = socket.getInputStream();
    OutputStream out = socket.getOutputStream();

    byte[] buffer = new byte[1024];
    int bytesRead;
    while ((bytesRead = in.read(buffer)) != -1) {  // BLOCKS until data arrives
        // process data
        out.write(response);                        // BLOCKS until data sent
    }
}
```

```
What happens at the OS level:

Application                  Kernel                    Hardware
───────────                  ──────                    ────────
in.read(buffer)
    │
    ▼
  read() syscall ────────►  Check socket buffer
                             │
                             ├── Data available?
                             │   NO → put thread to SLEEP
                             │        (remove from run queue)
                             │        wait for interrupt...
                             │            ▲
                             │   NIC interrupt: data arrived!
                             │   Copy data: NIC → kernel buffer
                             │   Copy data: kernel buffer → user buffer
                             │   Wake thread (add back to run queue)
                             │            │
                             │   YES ─────┘
                             │
    ◄────────────────────────┘
  bytesRead = n
  (thread continues)
```

### Why Thread-Per-Connection Doesn't Scale

```
10,000 concurrent connections = 10,000 threads

Memory:     10,000 × 1MB stack = 10 GB just for stacks
CPU:        OS context-switching 10,000 threads = massive overhead
Scheduling: O(n) or O(log n) per scheduling decision
GC:         10,000 thread stacks = 10,000 GC roots to scan

Real-world limits:
  Linux: ~30,000 threads per process (ulimit, vm.max_map_count)
  But performance degrades badly after ~1,000-5,000 threads
  Context switch cost: ~1-10 μs per switch

C10K problem: serving 10,000 concurrent connections was a challenge
C10M problem: modern systems need millions of connections (IoT, WebSocket)
```

---

## 3. Java NIO — Non-Blocking I/O

Java NIO (New I/O), introduced in Java 1.4, is Java's answer to the C10K problem. Instead of one thread per connection, NIO lets a single thread monitor thousands of connections simultaneously using a **Selector** (which delegates to the OS kernel's `epoll` on Linux, `kqueue` on macOS). When any of those connections has data ready to read, data ready to write, or a new connection to accept, the Selector wakes up and tells you which ones — and your single thread handles only the ready connections.

NIO is built on three core abstractions that work together: **Channels** (bidirectional data pipes to files, sockets, or pipes — unlike the unidirectional `InputStream`/`OutputStream`), **Buffers** (fixed-size containers that hold data between your code and a channel — all NIO reads/writes go through buffers), and **Selectors** (the multiplexing engine that monitors multiple channels for readiness events). Understanding the Buffer lifecycle (allocate → write → flip → read → compact/clear) is the most common stumbling block for developers learning NIO, because the same buffer object switches between "writing mode" and "reading mode" by manipulating its position/limit pointers.

### The Three Core Abstractions

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   CHANNEL                 BUFFER                SELECTOR     │
│   (data pipe)             (data container)      (multiplexer)│
│                                                              │
│   ┌──────────┐           ┌──────────┐          ┌──────────┐ │
│   │ Socket   │◄─────────►│ ByteBuffer│          │ Selector │ │
│   │ Channel  │  read/    │          │          │ monitors │ │
│   │          │  write    │ position │          │ multiple │ │
│   │ File     │           │ limit    │          │ channels │ │
│   │ Channel  │           │ capacity │          │          │ │
│   └──────────┘           └──────────┘          └──────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Buffer — The Data Container

A Buffer is a fixed-size array with three pointers:

```
ByteBuffer buffer = ByteBuffer.allocate(10);

After allocate:
position=0  limit=10  capacity=10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│   │   │   │   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
 ↑                                       ↑
pos                                    lim/cap


After put("Hello".getBytes()):
position=5  limit=10  capacity=10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                     ↑                   ↑
                    pos               lim/cap


After flip() — prepare for READING:
position=0  limit=5  capacity=10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
 ↑                   ↑                   ↑
pos                 lim                 cap

flip() sets: limit = position, position = 0
Now you can read from 0 to limit (the data you wrote)


After reading 3 bytes:
position=3  limit=5  capacity=10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
             ↑       ↑                   ↑
            pos     lim                 cap


After compact() — shift unread data to beginning, prepare for WRITING:
position=2  limit=10  capacity=10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ l │ o │   │   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
         ↑                               ↑
        pos                           lim/cap

compact() copies remaining data to start, sets position after it


After clear() — discard everything, full reset:
position=0  limit=10  capacity=10
(data still in array but logically empty)
```

### Heap Buffer vs Direct Buffer

This distinction matters enormously for I/O performance. When you do I/O with a **heap buffer** (the default `ByteBuffer.allocate()`), the JVM must copy the data to a temporary native buffer before passing it to the OS kernel, because the garbage collector can move heap objects at any time, and the kernel needs a stable memory address for DMA (Direct Memory Access). A **direct buffer** (`ByteBuffer.allocateDirect()`) lives in native memory outside the Java heap — the kernel can read from and write to it directly, eliminating one copy. For high-throughput network applications (like Netty-based servers), this single eliminated copy translates to measurable throughput gains.

The trade-off: direct buffers are expensive to allocate (~1μs vs ~10ns for heap buffers) and are not managed by the GC (they're freed via a `Cleaner` when the `DirectByteBuffer` object is garbage collected, which can be unpredictable). The rule of thumb is: allocate direct buffers once and reuse them (pool them), never allocate them in hot paths.

```java
// HEAP buffer — backed by Java byte[]
ByteBuffer heapBuf = ByteBuffer.allocate(1024);
// Lives on Java heap, subject to GC
// For I/O: JVM copies to native buffer → kernel buffer (two copies)

// DIRECT buffer — backed by native memory (off-heap)
ByteBuffer directBuf = ByteBuffer.allocateDirect(1024);
// Lives in native memory, NOT on Java heap
// For I/O: data goes directly to kernel buffer (one copy)
// Allocation is expensive, reuse them!
// Not subject to Java GC (freed when DirectByteBuffer is GC'd via Cleaner)
```

```
I/O data path:

Heap buffer:
  Java byte[] → (copy) → native buffer → (copy) → kernel buffer → NIC
  Two copies!

Direct buffer:
  native buffer → (copy) → kernel buffer → NIC
  One copy! (or zero-copy with transferTo)

Why the extra copy for heap buffers:
  GC can MOVE objects during compaction
  The OS needs a STABLE memory address for DMA
  JVM must copy to a pinned native buffer before syscall
```

### Channel — Bidirectional Data Pipe

```java
// Channels are like streams, but:
// 1. Bidirectional (can read AND write)
// 2. Can be non-blocking
// 3. Always read/write through Buffers
// 4. Can do scatter/gather (multiple buffers in one operation)

// File Channel (always blocking, but supports memory mapping):
FileChannel fc = FileChannel.open(path, StandardOpenOption.READ);
ByteBuffer buf = ByteBuffer.allocate(1024);
int bytesRead = fc.read(buf);  // reads into buffer

// Socket Channel (can be non-blocking):
SocketChannel sc = SocketChannel.open();
sc.configureBlocking(false);    // NON-BLOCKING mode
sc.connect(new InetSocketAddress("example.com", 80));

ByteBuffer buf = ByteBuffer.allocate(1024);
int bytesRead = sc.read(buf);   // returns immediately!
// bytesRead = 0 if no data available (instead of blocking)
// bytesRead = -1 if connection closed
```

### Selector — Multiplexing (The Key to Scalability)

The Selector is the heart of NIO and the reason a single thread can handle 100,000+ concurrent connections. The concept is simple: instead of dedicating one thread per connection (and having that thread sleep when there's no data), you register all your connections with a single Selector and call `select()`. The Selector asks the OS kernel: "which of these 100,000 sockets have data ready?" The kernel (using `epoll` on Linux) maintains an internal data structure that tracks socket readiness, and returns only the ready sockets — in O(1) per ready event, not O(n) per registered socket. Your thread then processes only the ready connections, ignoring the 99,900 that are idle.

This is the event-loop pattern: `select() → process ready events → select() → process ready events → ...`. Netty, Node.js, nginx, Redis, and virtually every high-performance network server uses this pattern. The critical rule: **never block the event-loop thread**. If you do a blocking database call or a `Thread.sleep()` inside the event loop, you freeze ALL 100,000 connections until the blocking call returns.

```java
Selector selector = Selector.open();

// Register channels with the selector:
ServerSocketChannel serverChannel = ServerSocketChannel.open();
serverChannel.bind(new InetSocketAddress(8080));
serverChannel.configureBlocking(false);
serverChannel.register(selector, SelectionKey.OP_ACCEPT);

// The event loop — ONE thread handles MANY connections:
while (true) {
    int readyChannels = selector.select();  // blocks until at least one channel is ready
    if (readyChannels == 0) continue;

    Set<SelectionKey> selectedKeys = selector.selectedKeys();
    Iterator<SelectionKey> it = selectedKeys.iterator();

    while (it.hasNext()) {
        SelectionKey key = it.next();
        it.remove();

        if (key.isAcceptable()) {
            // New connection
            SocketChannel client = serverChannel.accept();
            client.configureBlocking(false);
            client.register(selector, SelectionKey.OP_READ);
        }
        else if (key.isReadable()) {
            // Data available to read
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buf = ByteBuffer.allocate(1024);
            int bytesRead = client.read(buf);
            if (bytesRead == -1) {
                key.cancel();
                client.close();
            } else {
                buf.flip();
                // process data...
                key.interestOps(SelectionKey.OP_WRITE);
            }
        }
        else if (key.isWritable()) {
            // Ready to write
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer response = (ByteBuffer) key.attachment();
            client.write(response);
            if (!response.hasRemaining()) {
                key.interestOps(SelectionKey.OP_READ);
            }
        }
    }
}
```

### How Selector Works at the OS Level

```
Selector delegates to OS-level I/O multiplexing:

Linux:   epoll
macOS:   kqueue
Windows: IOCP (I/O Completion Ports)
Solaris: /dev/poll

epoll (Linux) — the most common:

1. epoll_create()              → create epoll instance
2. epoll_ctl(ADD, fd, events)  → register file descriptor with interest
3. epoll_wait(timeout)         → BLOCK until one or more fds are ready

                              ┌───────────────┐
  SocketChannel A ──fd=5────►│               │
  SocketChannel B ──fd=7────►│  epoll wait   │──► "fd 5 is readable"
  SocketChannel C ──fd=9────►│               │──► "fd 9 is writable"
  SocketChannel D ──fd=11───►│ (blocks here) │
                              └───────────────┘

KEY: epoll is O(1) per ready event, not O(n) per registered fd
     (unlike old poll/select which scan ALL fds every time)

This is why ONE thread can handle 100,000+ connections:
  - Thread blocks in epoll_wait (almost zero CPU)
  - OS wakes thread only when events occur
  - Thread processes only READY channels
  - No thread per connection needed
```

### Interest Operations

```
SelectionKey.OP_ACCEPT   (16)  — ServerSocketChannel: new connection available
SelectionKey.OP_CONNECT  (8)   — SocketChannel: connection established
SelectionKey.OP_READ     (1)   — Channel has data to read
SelectionKey.OP_WRITE    (4)   — Channel is ready for writing

Can combine: SelectionKey.OP_READ | SelectionKey.OP_WRITE

IMPORTANT: OP_WRITE is almost ALWAYS ready (socket send buffer usually has space)
  → only register for OP_WRITE when you have data to send and got EAGAIN
  → otherwise your event loop will spin consuming CPU
```

---

## 4. Thread-Per-Connection vs Event Loop — The Architecture Comparison

This is the most important architectural decision in network programming, and understanding the visual comparison below will shape how you think about every server-side system you build. The blocking model is simple and correct but wasteful — threads spend 90%+ of their time sleeping, waiting for I/O. The event-loop model is efficient but complex — you must never block, you must manage state machines manually, and debugging is harder because there's no per-connection thread with a meaningful stack trace.

### Blocking I/O (Thread-Per-Connection)

```
┌─────────────┐
│ Client A    │───► Thread 1: read() ██████████████ process █ write() ██████
│ Client B    │───► Thread 2: read() █████████ process ██ write() ████████
│ Client C    │───► Thread 3: read() ████████████████████ process █ write()
│ Client D    │───► Thread 4: read() ██ process █ write() ████████████████
│ ...10,000   │───► Thread 10,000: ... (OS scheduling overhead)
└─────────────┘

████ = blocked (doing nothing, wasting memory)
Threads: 10,000 (1MB stack each = 10GB)
Context switches: thousands per second
```

### NIO (Event Loop)

```
┌─────────────┐
│ Client A    │───┐
│ Client B    │───┤
│ Client C    │───┼───► Selector ───► Thread 1 (event loop)
│ Client D    │───┤     (epoll)       │
│ ...10,000   │───┘                   │ select() → process ready channels
└─────────────┘                       │ → read A → process A → write A
                                      │ → read C → process C → write C
                                      │ → select() → ...

Threads: 1 (or N = CPU cores for multi-reactor)
Memory: minimal (no per-connection stacks)
Context switches: near zero

TRADE-OFF: you must never block the event loop thread!
  If you block: ALL 10,000 connections freeze
```

### Netty's Multi-Reactor Architecture

```
┌──────────────────────────────────────────────────────┐
│  Boss Group (1 thread)                                │
│  ┌──────────┐                                        │
│  │ Selector  │──► accept connections                  │
│  └──────────┘    register with worker group           │
│                            │                          │
│  Worker Group (N threads = CPU cores)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Selector 1│  │Selector 2│  │Selector 3│           │
│  │  500 fds │  │  500 fds │  │  500 fds │           │
│  │ Thread 1 │  │ Thread 2 │  │ Thread 3 │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  Each worker thread runs an event loop:              │
│  while(true) {                                       │
│      select()        // wait for events              │
│      processIO()     // read/write ready channels    │
│      runTasks()      // run scheduled tasks          │
│  }                                                   │
└──────────────────────────────────────────────────────┘

This is how Netty handles millions of connections with ~16 threads.
Each channel is bound to ONE worker thread for its lifetime (no locking needed).
```

---

## 5. Memory-Mapped Files — Zero-Copy I/O

Memory-mapped files are the fastest way to read and write files in Java, and they work by eliminating the copy between kernel space and user space entirely. Instead of `read()` (which copies data from the kernel's page cache into your Java buffer), memory mapping creates a direct mapping between a region of your process's virtual address space and the file's pages in the kernel's page cache. When you access the mapped memory, the CPU's memory management unit (MMU) translates the virtual address directly to the physical page — no system call, no copy, no context switch.

This technique is used by databases (PostgreSQL's buffer manager, LevelDB, RocksDB), search engines (Lucene/Elasticsearch for reading index files), message brokers (Kafka for log segment files), and any system that needs high-performance random access to large files. In Java, `MappedByteBuffer` provides this capability, and `FileChannel.transferTo()` provides true zero-copy transfer between a file and a socket (using the `sendfile()` system call on Linux).

```java
// Map a file directly into memory (OS page cache)
FileChannel fc = FileChannel.open(Path.of("huge-file.dat"), StandardOpenOption.READ);
MappedByteBuffer mbb = fc.map(FileChannel.MapMode.READ_ONLY, 0, fc.size());

// Now 'mbb' is a ByteBuffer backed by the OS page cache
// Reading from mbb = reading from the file (OS handles page faults)
byte b = mbb.get(1000000);  // no read() syscall! Direct memory access.
```

```
Traditional file read:
  Disk → Kernel page cache → (copy) → User space buffer
  Two memory spaces, one copy (plus syscall overhead)

Memory-mapped file:
  Disk → Kernel page cache ← (direct access from user space via virtual memory)
  Application accesses the SAME pages as the kernel — zero copy

┌─────────────────────────────────────────┐
│  Process Virtual Memory                  │
│                                          │
│  ┌──────────┐    ┌──────────────────┐   │
│  │ Java Heap │    │ MappedByteBuffer │   │
│  │           │    │ (virtual pages)  │   │
│  └──────────┘    └────────┬─────────┘   │
│                           │ page table   │
│                           ▼ mapping      │
│              ┌────────────────────────┐  │
│              │   Kernel Page Cache    │  │
│              │   (shared with OS)     │  │
│              └────────────┬───────────┘  │
│                           │              │
│                           ▼              │
│                     Physical Disk        │
└─────────────────────────────────────────┘

Advantages:
  - No copy between kernel and user space
  - OS handles caching automatically (LRU page eviction)
  - Multiple processes can share the same mapped file
  - Random access is efficient (seek = pointer arithmetic)

Disadvantages:
  - File must fit in virtual address space (2GB limit on 32-bit)
  - Page faults can cause latency spikes
  - Hard to handle errors (SIGBUS for I/O errors)
  - MappedByteBuffer is not easily unmapped (relies on GC)
```

### FileChannel.transferTo — True Zero-Copy

```java
// Transfer directly from file to socket — no user-space copies:
FileChannel fileChannel = FileChannel.open(path);
SocketChannel socketChannel = SocketChannel.open(address);

fileChannel.transferTo(0, fileChannel.size(), socketChannel);
// Uses sendfile() syscall on Linux — data stays in kernel space!
```

```
Normal file → socket:
  Disk → kernel buffer → (copy) → user buffer → (copy) → kernel socket buffer → NIC
  4 context switches, 2 copies

transferTo (sendfile):
  Disk → kernel buffer → kernel socket buffer → NIC
  2 context switches, 0 user-space copies (or 1 DMA-assisted copy)
```

---

## 6. Scatter/Gather — Vectored I/O

Scatter/Gather I/O allows a single syscall to read into or write from **multiple buffers**. This maps directly to the POSIX `readv()`/`writev()` system calls, which reduce per-syscall overhead when your data has a natural multi-part structure (e.g., a fixed-size header followed by a variable-length body).

Without scatter/gather, you would either allocate one large buffer and manually slice it, or make multiple `read()`/`write()` calls — each of which requires a user→kernel context switch. With scatter/gather, the kernel fills or drains multiple buffers in one atomic operation, which is particularly valuable for network protocols (HTTP headers + body, database wire protocol packets) and file formats with fixed headers.

`ScatteringByteChannel` (for reads) and `GatheringByteChannel` (for writes) are the relevant NIO interfaces. Both `FileChannel` and `SocketChannel` implement them.

```java
// Scatter read: one syscall fills header first, then body
ByteBuffer header = ByteBuffer.allocate(128);
ByteBuffer body = ByteBuffer.allocate(4096);
channel.read(new ByteBuffer[] { header, body });

// Gather write: one syscall writes header then body
channel.write(new ByteBuffer[] { header, body });
```

**Key Points:**
- One syscall instead of two — reduces context-switch overhead.
- Buffers are filled/drained in array order.
- Particularly effective for protocols with fixed-size headers followed by variable payloads.
- The kernel handles the scatter/gather atomically; no partial reads/writes between buffers.

---

## 7. AsynchronousChannel (AIO / NIO.2 — Java 7+)

Asynchronous I/O (AIO), introduced in Java 7, represents a third model beyond blocking and non-blocking. In NIO with Selectors, your thread polls for readiness ("is this socket ready to read?") and then performs the read itself. In AIO, you initiate the read and provide a callback — the **kernel** performs the entire read operation and notifies you when it's complete. You never touch the data until it's fully available in your buffer.

In theory, AIO should be the most efficient model because the kernel can optimize the I/O path without any user-space involvement. In practice on Linux, AIO is implemented using an internal thread pool rather than true kernel-level async (Linux's `io_uring` is the modern kernel-level solution, but Java doesn't use it yet). This means AIO on Linux offers no advantage over NIO with `epoll`, which is why Netty chose NIO as its primary transport. On Windows, IOCP (I/O Completion Ports) provides true kernel-level async, so AIO can be beneficial there.

```java
// True asynchronous I/O — kernel notifies on completion
AsynchronousSocketChannel channel = AsynchronousSocketChannel.open();

// Callback style:
ByteBuffer buffer = ByteBuffer.allocate(1024);
channel.read(buffer, null, new CompletionHandler<Integer, Void>() {
    @Override
    public void completed(Integer bytesRead, Void attachment) {
        buffer.flip();
        // process data — called from I/O thread pool
    }

    @Override
    public void failed(Throwable exc, Void attachment) {
        // handle error
    }
});

// Future style:
Future<Integer> future = channel.read(buffer);
int bytesRead = future.get();  // blocks until complete
```

```
Three I/O models comparison:

Blocking I/O (java.io):
  Thread: read() ──────block──────── return data
  Simple, but thread is wasted during block

NIO (Selector):
  Thread: select() ──wait── ready! → read() → immediate return
  One thread, many channels, but application polls for readiness

AIO (AsynchronousChannel):
  Thread: read(callback) → returns immediately → callback invoked later
  Kernel does the I/O and notifies when COMPLETE (not just ready)

On Linux: AIO often uses thread pool internally (io_submit is complex)
On Windows: IOCP provides true kernel-level async
In practice: Netty's NIO (epoll-based) is usually preferred over AIO on Linux
```

---

## 8. Practical I/O Performance Guidelines

Choosing the right I/O model depends on your concurrency level, data access pattern, and latency requirements. The table below summarizes the decision points — note that these are guidelines, not rules; always benchmark with your actual workload.

```
Scenario                              Best Approach
───────────────────────────────────────────────────────────────
< 1,000 concurrent connections        Blocking I/O (simple, fast enough)
1,000 - 100,000 connections           NIO with Selector (or Netty)
> 100,000 connections                 Netty (epoll native transport on Linux)
Large file transfer                   FileChannel.transferTo (zero-copy)
Random access large files             MappedByteBuffer
Small request/response                Direct ByteBuffers (reuse with pool)
High-throughput file reads            BufferedInputStream (8KB default)

BUFFER SIZING:
  Too small: too many syscalls (overhead per call)
  Too large: wasted memory, cache pollution
  Sweet spot: 4KB - 64KB for network I/O
              8KB - 256KB for file I/O

DIRECT BUFFER MANAGEMENT:
  Allocate once, reuse forever (pool them)
  Don't allocate in hot path (allocation is expensive: ~1μs)
  Monitor: -XX:MaxDirectMemorySize
  Leak detection: track allocation stack traces
```

---

## 9. Why Reactive Frameworks Exist

If NIO solves the scalability problem, why do we need reactive frameworks like Spring WebFlux, Project Reactor, RxJava, and Vert.x? The answer is **developer experience**. Writing raw NIO code with Selectors is extremely difficult: you must manually manage partial reads (data arrives in fragments), maintain per-connection state machines, handle backpressure, and deal with error recovery — all in a single-threaded event loop where a single bug freezes everything. Reactive frameworks provide a declarative, composable API on top of NIO that handles all of this plumbing for you.

Under the hood, frameworks like WebFlux use Netty (which uses NIO/epoll) for the actual I/O, and expose a `Flux`/`Mono` API that lets you express async data pipelines declaratively. The trade-off is complexity of a different kind: reactive code is harder to debug (no meaningful stack traces), harder to reason about (lazy evaluation, subscription chains), and requires a completely different mental model from imperative code. This is why Java 21's Virtual Threads are so significant — they promise the scalability of NIO with the simplicity of blocking code, potentially making reactive frameworks unnecessary for many use cases.

```
The problem with Selector-based NIO:
  - Complex state machine code (readability nightmare)
  - Error handling is manual and error-prone
  - No backpressure mechanism built in
  - Buffer management is your responsibility

Reactive frameworks (Reactor/RxJava/Vert.x) solve this:

InputStream approach (blocking):
  byte[] data = inputStream.readAllBytes();  // thread blocked

NIO approach (callback hell):
  channel.register(selector, OP_READ);
  // in event loop: check key, read partial data, reassemble, etc.

Reactive approach (declarative):
  Flux.from(httpRequest)
      .flatMap(req -> database.query(req))
      .map(result -> transform(result))
      .onErrorResume(ex -> fallback())
      .subscribe(response -> send(response));

Under the hood, reactive frameworks use:
  Netty (NIO event loop) for network I/O
  Schedulers (thread pools) for computation
  Backpressure signals to prevent overwhelming consumers
```

---

*After this phase: you can explain why Netty uses epoll, why direct buffers avoid copies, why memory-mapped files are fast, and why thread-per-connection breaks at scale. You can make the architectural decision between blocking I/O, NIO, and reactive — and justify it with OS-level reasoning.*
