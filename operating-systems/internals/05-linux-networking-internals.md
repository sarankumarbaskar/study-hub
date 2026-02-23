# Phase 5 — Linux Networking Internals: From NIC to Application

> This phase connects your System Design networking knowledge (TCP, DNS, HTTP) to the kernel layer — how packets actually travel through the Linux network stack, how epoll achieves massive concurrency, and how to tune the kernel for high-throughput networking.

When a packet arrives at your server's network interface card (NIC), it travels through a complex pipeline inside the kernel before your application's `read()` returns data. Understanding this pipeline explains: why Netty/NIO outperforms blocking I/O, why TCP tuning parameters matter, why kernel bypass (DPDK) exists for ultra-high-performance networking, and how to diagnose connection issues with `ss` and `tcpdump`.

---

## 1. The Packet's Journey — NIC to Application

```
INCOMING PACKET:

1. NETWORK INTERFACE CARD (NIC):
   Packet arrives from the wire → NIC writes it to a RING BUFFER in kernel memory (DMA)
   NIC raises a HARDWARE INTERRUPT to notify the CPU

2. INTERRUPT HANDLER (top half — fast, minimal work):
   CPU stops current work → runs NIC interrupt handler
   Handler: acknowledge interrupt, schedule SOFTIRQ for packet processing
   Returns quickly (microseconds) → CPU resumes previous work

3. SOFTIRQ / NAPI (bottom half — actual packet processing):
   Kernel processes packets in batches (NAPI = New API for network polling)
   For each packet in the ring buffer:
     a. Allocate sk_buff (kernel structure representing the packet)
     b. Parse Ethernet header → determine protocol (IPv4, IPv6, ARP)
     c. Pass up to IP layer

4. IP LAYER:
   Parse IP header → check destination (is it for us?)
   If yes: determine transport protocol (TCP=6, UDP=17)
   If no: forward (if routing is enabled)
   Pass to transport layer

5. TCP LAYER:
   Parse TCP header → find the matching SOCKET (by src/dst IP + port)
   Process TCP state machine (SYN → ESTABLISHED → FIN)
   Handle: sequence numbers, acknowledgments, window updates
   Copy payload data into the SOCKET RECEIVE BUFFER (sk_buff chain)

6. SOCKET RECEIVE BUFFER:
   Data sits here until the application reads it
   Buffer size: SO_RCVBUF (default ~128KB, tunable)
   If buffer full: TCP advertises window=0 → sender STOPS sending (flow control)

7. APPLICATION:
   read(fd, buf, size) → kernel copies data from socket buffer to user buffer
   → application processes the data

TOTAL LATENCY (within datacenter):
  NIC → interrupt → softirq → TCP → socket buffer → read(): ~5-50 μs
  This is the "kernel network overhead" per packet
  
  For 1 million packets/sec: 5-50 seconds of CPU time spent in the network stack
  This is why kernel bypass (DPDK, io_uring) exists for extreme performance needs
```

---

## 2. Socket System Calls — What Each One Does in the Kernel

```
SERVER SETUP:

socket(AF_INET, SOCK_STREAM, 0)
  Kernel: create a socket data structure (struct sock)
  Allocate file descriptor
  Initialize TCP state machine to CLOSED
  Return fd (e.g., fd=3)

bind(fd, {addr=0.0.0.0, port=8080}, ...)
  Kernel: associate the socket with IP address and port
  Check: is port already in use? If yes: EADDRINUSE
  Register in the kernel's port hash table

listen(fd, backlog=128)
  Kernel: change TCP state to LISTEN
  Create TWO queues:
    SYN queue (half-open): connections in SYN_RECV state (handshake in progress)
    Accept queue (complete): connections in ESTABLISHED state (ready to accept)
  backlog = max size of the accept queue
  net.core.somaxconn = system-wide max (overrides backlog if lower)

accept(fd)
  Kernel: BLOCK until a connection is in the accept queue
  Dequeue one ESTABLISHED connection
  Create a NEW socket for this connection (new fd, e.g., fd=4)
  Return the new fd → application reads/writes on fd=4
  The LISTEN socket (fd=3) continues accepting new connections

read(fd, buf, size)
  Kernel: check socket receive buffer
  If data available: copy to user buffer → return bytes_read
  If empty: BLOCK (put thread to sleep, wake when data arrives)
  If connection closed: return 0 (EOF)

write(fd, buf, size)
  Kernel: copy data from user buffer to socket send buffer
  TCP sends when: send buffer has enough data, or Nagle timer fires
  If send buffer full: BLOCK (TCP flow control — remote side is slow)
  Return bytes_written (may be less than size → partial write!)

close(fd)
  Kernel: initiate TCP connection teardown (FIN handshake)
  Socket enters TIME_WAIT state (held for 2×MSL ≈ 60 seconds)
  File descriptor released → can be reused
```

---

## 3. epoll — How One Thread Handles 100,000 Connections

### Why epoll Exists

The original `select()` and `poll()` syscalls check ALL registered file descriptors every time you call them — O(n) per call. With 100,000 connections, that's 100,000 checks per wakeup. `epoll` solves this with an event-driven approach: you register interest ONCE, and the kernel notifies you ONLY about file descriptors that are READY — O(1) per ready event.

```
HOW EPOLL WORKS INTERNALLY:

CREATION:
  epoll_fd = epoll_create1(0)
  Kernel creates: red-black tree (for registered fds) + ready list (for ready fds)

REGISTRATION:
  epoll_ctl(epoll_fd, EPOLL_CTL_ADD, socket_fd, {EPOLLIN})
  Kernel: insert socket_fd into the red-black tree
  Kernel: register a CALLBACK on the socket's wait queue
    When data arrives on socket_fd → callback fires → adds socket_fd to ready list

WAITING:
  epoll_wait(epoll_fd, events, max_events, timeout)
  Kernel: check ready list
    If ready list is non-empty: return immediately with ready fds
    If empty: put thread to SLEEP
    When a callback fires (data arrives on any registered fd):
      fd added to ready list → wake the sleeping thread
      epoll_wait returns with the list of READY fds

  ┌──────────────────────────────────────────────────┐
  │  epoll instance (kernel)                          │
  │                                                    │
  │  Red-Black Tree (all registered fds):             │
  │    fd=5 (EPOLLIN) → socket for client A            │
  │    fd=7 (EPOLLIN) → socket for client B            │
  │    fd=9 (EPOLLIN|EPOLLOUT) → socket for client C  │
  │    ... 100,000 more ...                            │
  │                                                    │
  │  Ready List:                                       │
  │    [fd=7, fd=9]  ← these two have data available  │
  │                                                    │
  └──────────────────────────────────────────────────┘

  epoll_wait() returns: [{fd=7, EPOLLIN}, {fd=9, EPOLLIN}]
  Application: reads from fd=7 and fd=9 only (ignores 99,998 idle connections)

WHY THIS IS O(1) PER EVENT:
  select/poll: iterate ALL 100,000 fds every time → O(n) per call
  epoll: callbacks add to ready list → epoll_wait just drains the list → O(k), k = ready count
  If 5 out of 100,000 are ready: select does 100,000 checks, epoll does 5

JAVA NIO MAPPING:
  Selector.open()      → epoll_create1()
  channel.register()   → epoll_ctl(ADD)
  selector.select()    → epoll_wait()
  
  Netty's EpollEventLoop: uses epoll directly (via JNI, not through NIO)
  → even faster than NIO Selector (avoids NIO's overhead layer)

EDGE-TRIGGERED vs LEVEL-TRIGGERED:
  Level-triggered (default): epoll_wait returns fd as long as there's data to read
    If you don't read all data: epoll_wait returns the same fd AGAIN next time
    Safe but slightly less efficient (may return same fd multiple times)
    
  Edge-triggered (EPOLLET): epoll_wait returns fd ONLY when NEW data arrives
    If you don't read all data: you won't be notified again (until more data comes)
    You MUST read until EAGAIN (empty the buffer completely)
    More efficient but harder to use correctly
    Netty uses edge-triggered for maximum performance
```

---

## 4. TCP Tuning Parameters — Production Network Optimization

```
PARAMETER                              DEFAULT    WHAT IT DOES                   WHEN TO TUNE
──────────────────────────────────────────────────────────────────────────────────────────────
net.core.somaxconn                     4096       Max accept queue size          High connection rate servers
net.ipv4.tcp_max_syn_backlog           1024       Max SYN queue size             DDoS protection, high conn rate
net.ipv4.tcp_tw_reuse                  0          Reuse TIME_WAIT sockets        Servers with many short connections
net.ipv4.tcp_fin_timeout               60         TIME_WAIT duration             Reduce if accumulating TIME_WAITs
net.core.rmem_max                      212992     Max receive buffer size         High-throughput data transfer
net.core.wmem_max                      212992     Max send buffer size            High-throughput data transfer
net.ipv4.tcp_rmem                      min def max  Auto-tuned receive buffer    Usually fine as default
net.ipv4.tcp_wmem                      min def max  Auto-tuned send buffer       Usually fine as default
net.ipv4.ip_local_port_range           32768-60999  Ephemeral port range         Clients making many connections
net.core.netdev_max_backlog            1000       NIC → kernel queue size        High packet rate (>100K pps)
net.ipv4.tcp_keepalive_time            7200       Seconds before keepalive probe  Detect dead connections faster
net.ipv4.tcp_keepalive_intvl           75         Seconds between probes         (reduce to 10-30s for services)
net.ipv4.tcp_keepalive_probes          9          Probes before declaring dead   (reduce to 3-5)

COMMON PRODUCTION TUNING:
  # High connection rate server:
  net.core.somaxconn = 65535
  net.ipv4.tcp_max_syn_backlog = 65535
  
  # Reduce TIME_WAIT accumulation:
  net.ipv4.tcp_tw_reuse = 1
  net.ipv4.tcp_fin_timeout = 15
  
  # Detect dead connections faster (for load balancers / service mesh):
  net.ipv4.tcp_keepalive_time = 60
  net.ipv4.tcp_keepalive_intvl = 10
  net.ipv4.tcp_keepalive_probes = 5
  
  # More ephemeral ports (for clients making many outbound connections):
  net.ipv4.ip_local_port_range = 1024 65535
```

---

## 5. Zero-Copy — Eliminating Unnecessary Data Copies

```
NORMAL FILE-TO-SOCKET TRANSFER:
  read(file_fd, buf, size)    → disk → kernel page cache → user buffer (copy 1)
  write(socket_fd, buf, size) → user buffer → kernel socket buffer (copy 2)
  
  4 mode switches (2 syscalls × 2 switches each)
  2 data copies through user space

SENDFILE (Zero-Copy):
  sendfile(socket_fd, file_fd, offset, count)
  → disk → kernel page cache → kernel socket buffer → NIC
  
  2 mode switches (1 syscall)
  0 copies through user space (data stays in kernel)
  On modern NICs with DMA scatter-gather: even the kernel-to-kernel copy is eliminated

  Kafka uses this: when a consumer reads from a log segment file,
  Kafka calls sendfile() → data goes directly from page cache to network socket
  This is a major reason Kafka can saturate 10Gbps network interfaces

SPLICE:
  splice(in_fd, out_fd, ...)
  Moves data between two file descriptors without copying through user space
  Used for proxying: data from one socket → directly to another socket (no user buffer)

IN JAVA:
  FileChannel.transferTo() → calls sendfile() on Linux
  Used by: Netty's DefaultFileRegion, Kafka's FileRecords
```

---

## 6. Connection State Diagnosis — Reading ss/netstat Output

```
$ ss -tna | head -20
State      Recv-Q  Send-Q   Local Address:Port    Peer Address:Port
LISTEN     0       128      0.0.0.0:8080          0.0.0.0:*            ← server listening
ESTAB      0       0        10.0.1.5:8080         10.0.1.100:52481     ← active connection
ESTAB      0       36864    10.0.1.5:8080         10.0.1.101:52482     ← sending data (Send-Q > 0)
TIME-WAIT  0       0        10.0.1.5:52500        10.0.2.10:5432       ← closed, waiting for timeout
CLOSE-WAIT 0       0        10.0.1.5:52501        10.0.2.10:5432       ← remote closed, we didn't

KEY STATES TO WATCH:
  LISTEN:     Normal — server waiting for connections
  ESTABLISHED: Normal — active connections
  TIME_WAIT:  Normal if moderate count. HIGH count (>10,000) → connection churn → tune tcp_tw_reuse
  CLOSE_WAIT: PROBLEM — remote side closed, but YOUR code didn't close its end
              → CONNECTION LEAK in your application → find and fix unclosed sockets
  SYN_RECV:   Normal during handshake. HIGH count → SYN flood attack or slow clients
  FIN_WAIT_2: Waiting for remote FIN after we sent ours → remote app is slow to close

QUICK DIAGNOSIS:
  $ ss -s                          # connection summary (total, timewait, etc.)
  $ ss -tnp state close-wait       # find close-wait connections with PID
  $ ss -tn state time-wait | wc -l # count time-wait connections
  $ ss -tlnp                       # what's listening on which port?
```

---

## 7. Networking Best Practices

```
APPLICATION LEVEL:
  ✓ Use connection pooling for everything (HTTP, DB, Redis, gRPC)
  ✓ Set connect timeout + read timeout on ALL network calls
  ✓ Use non-blocking I/O (NIO/Netty) for high-connection-count servers
  ✓ Enable TCP keep-alive to detect dead connections
  ✓ Use HTTP/2 or gRPC for multiplexing (fewer connections, better utilization)

KERNEL LEVEL:
  ✓ Increase somaxconn and tcp_max_syn_backlog for high-traffic servers
  ✓ Enable tcp_tw_reuse for servers with many short-lived connections
  ✓ Tune keepalive timers (reduce from 2hr default to 60s for service-to-service)
  ✓ Increase ephemeral port range for clients making many outbound connections
  ✓ Monitor with ss -s (connection states) and watch for CLOSE_WAIT accumulation

PERFORMANCE:
  ✓ Use sendfile/transferTo for serving files (zero-copy)
  ✓ For Netty: use epoll native transport on Linux (faster than NIO)
  ✓ Batch small writes (Nagle's algorithm OR application-level batching)
  ✓ For ultra-high performance (>1M pps): consider kernel bypass (DPDK, io_uring)
```

---

*After this phase: you understand how packets travel from the NIC through the kernel to your application. You can explain why epoll is O(1) and how it enables 100K+ connections per thread. You can tune TCP parameters for production workloads. You can diagnose connection issues with ss and understand every connection state.*
