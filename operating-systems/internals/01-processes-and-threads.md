# Phase 1 — Processes and Threads: How Your Code Actually Runs

> A process is an illusion — the OS makes every program think it has the entire machine to itself. Understanding how this illusion works is the key to understanding performance, concurrency, and resource management.

When you run `java -jar app.jar`, the OS creates a process — a running instance of a program with its own private memory space, file descriptors, and one or more threads of execution. Every thread you create in Java becomes a real OS thread, scheduled by the kernel's CPU scheduler, consuming a real stack of memory. When you have 200 threads in your Spring Boot app, the kernel is context-switching between them thousands of times per second, and the cost of those switches directly impacts your application's throughput.

---

## 1. What a Process IS — The Complete Picture

A process is not just "running code." It's a collection of resources managed by the kernel:

```
PROCESS = EVERYTHING THE KERNEL TRACKS FOR A RUNNING PROGRAM

┌──────────────────────────────────────────────────────────────┐
│ Process (PID 12345)                                           │
│                                                               │
│  ADDRESS SPACE (virtual memory):                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │ 0x000000000000  Text (code)   — read-only, shared  │      │
│  │ 0x000000600000  Data (globals) — read-write         │      │
│  │ 0x000000800000  Heap           — grows upward ↑     │      │
│  │   ...                                               │      │
│  │ 0x7fff00000000  Stack          — grows downward ↓   │      │
│  │ 0x7fff8a000000  Kernel space   — inaccessible       │      │
│  └────────────────────────────────────────────────────┘      │
│                                                               │
│  FILE DESCRIPTORS: [0]=stdin, [1]=stdout, [2]=stderr,        │
│    [3]=server_socket, [4]=db_connection, [5]=log_file         │
│                                                               │
│  THREADS: [main], [GC-thread-1], [http-nio-8080-exec-1], ... │
│                                                               │
│  METADATA: PID=12345, PPID=1, UID=1000, state=RUNNING,      │
│    CPU time used, memory usage, signal handlers, cwd, env    │
└──────────────────────────────────────────────────────────────┘
```

### Process States

```
State  Symbol  Meaning                         You'll see this when
──────────────────────────────────────────────────────────────────────
R      Running   Actually running on a CPU core   CPU-bound work, healthy active thread
S      Sleeping  Waiting for an event (interruptible)  Waiting for I/O, sleep(), lock
D      Disk      Uninterruptible sleep (I/O)      Waiting for disk I/O (can't be killed!)
Z      Zombie    Exited but parent hasn't wait()  Parent process bug (not collecting exit status)
T      Stopped   Stopped by signal (Ctrl+Z)       Job control, debugging (SIGSTOP)

THE DANGEROUS ONE: D (Uninterruptible Sleep)
  Process waiting for disk I/O — you CANNOT kill it (not even kill -9!)
  If many processes are in D state: disk is overwhelmed or NFS mount is hung.
  
  Check with: ps aux | awk '$8 ~ /D/'
  High D-state count → disk bottleneck → check iostat for I/O saturation
```

---

## 2. fork() and exec() — How Processes Are Created

### fork() — Clone Yourself

`fork()` creates a near-perfect copy of the calling process. The child has a new PID but the same code, same data, same open files. This is the **only** way to create a process in Unix/Linux (everything else — `System.exec()`, shell commands, Docker containers — uses fork internally).

```
PARENT (PID 100):                        CHILD (PID 101):
  code segment (shared, read-only)         same code segment (shared!)
  data segment (copy-on-write)             copy of data (COW — copied on modification)
  heap (copy-on-write)                     copy of heap (COW)
  stack (copy-on-write)                    copy of stack (COW)
  file descriptors: [0,1,2,3,4]           same file descriptors: [0,1,2,3,4]
  
COPY-ON-WRITE (COW):
  fork() does NOT immediately copy all memory (that would be ~GB for a JVM!)
  Instead: both parent and child share the SAME physical pages
  Pages are marked read-only
  When EITHER process writes to a page: CPU generates a page fault
  Kernel copies THAT page only → each process gets its own copy
  Result: fork() is fast (~0.5ms) regardless of process size

WHY COW MATTERS:
  Java's Runtime.exec("ls") does:
    1. fork() — creates copy of entire JVM process (fast with COW)
    2. exec("ls") — replaces the child's address space with the 'ls' binary
  
  Between fork() and exec(), the child shares the parent's memory pages.
  If the child allocated memory before exec(), COW would copy pages (wasteful).
  This is why posix_spawn() and ProcessBuilder are preferred — they avoid unnecessary COW copies.
```

### exec() — Replace Yourself

`exec()` replaces the current process's code, data, heap, and stack with a new program. The PID stays the same. Open file descriptors are inherited (unless marked close-on-exec).

```
PARENT: fork() → CHILD (copy of parent) → exec("ls") → CHILD is now 'ls'

The child's memory is completely replaced:
  BEFORE exec(): child has parent's JVM code, JVM heap, JVM threads
  AFTER exec():  child has ls binary code, ls's data, ls's stack
  PID: unchanged (still 101)
  File descriptors: inherited (stdin/stdout/stderr still connected)

EVERY COMMAND YOU RUN uses fork+exec:
  $ ls -la
  Shell: fork() → child shell process
         child: exec("ls", "-la") → child becomes 'ls'
         parent: wait() → waits for child to finish
         child exits → parent continues (shell prompt returns)
```

---

## 3. Threads vs Processes — The Critical Distinction

```
PROCESS:
  Own address space (isolated memory)
  Own file descriptors
  Communication between processes: IPC (pipes, sockets, shared memory) — expensive
  Creating a process: fork() → ~0.5ms (COW optimization)
  Crash isolation: one process crashes, others survive

THREAD:
  SHARED address space (same memory as other threads in the process)
  Shared file descriptors, shared heap, shared globals
  Communication between threads: shared memory (just read/write variables) — fast
  Creating a thread: clone() → ~0.01ms (no address space to copy)
  Crash isolation: NONE — one thread's bug can corrupt all threads' data

IN LINUX, threads are just "lightweight processes":
  clone(CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SIGHAND)
  CLONE_VM:    share address space (thread behavior)
  CLONE_FS:    share filesystem info (cwd, root)
  CLONE_FILES: share file descriptor table
  Without these flags: clone() creates a full process (like fork())

  There's no fundamental difference between "process" and "thread" in Linux.
  A thread is a process that shares its parent's resources.

JAVA THREAD CREATION:
  Thread.start()
    → JVM calls pthread_create()
      → which calls clone(CLONE_VM | CLONE_FS | CLONE_FILES | ...)
        → kernel creates new task_struct, allocates kernel stack
        → new thread shares parent's address space (same heap, same static fields)

  COST OF A JAVA THREAD:
    ~1MB default stack (-Xss1m)
    ~8KB kernel stack
    One OS thread slot (limited by /proc/sys/kernel/threads-max)
    Context switch cost: ~1-10μs when the scheduler switches to/from it
    
  This is why 10,000 Java threads = 10GB of stack memory + massive scheduling overhead
  And why Virtual Threads (Java 21) exist — they avoid 1:1 OS thread mapping
```

---

## 4. CPU Scheduling — How the Kernel Decides Who Runs

### The Completely Fair Scheduler (CFS) — Linux Default

CFS is based on a simple idea: give every runnable thread a fair share of CPU time. It tracks how much CPU time each thread has consumed (called **virtual runtime** or **vruntime**) and always runs the thread with the LOWEST vruntime — the thread that has received the least CPU so far.

```
HOW CFS WORKS:

Data structure: RED-BLACK TREE ordered by vruntime
  Left-most node = lowest vruntime = NEXT thread to run

  vruntime: 100 ─── 150 ─── 200 ─── 250 ─── 300
            Thread A  Thread B  Thread C  Thread D  Thread E
            ↑ runs next

  Thread A runs for its time slice (~1-10ms)
  A's vruntime increases: 100 → 110
  A is re-inserted into the tree at position 110
  Now Thread B (vruntime=150) has the lowest → B runs next

  Over time: all threads accumulate roughly equal vruntime → FAIR scheduling

TIME SLICE:
  Not fixed — calculated based on number of runnable threads
  More threads = smaller time slices (each gets less time)
  Target latency: 6ms (CFS tries to run each thread at least once per 6ms)
  Minimum granularity: 0.75ms (never less than this per scheduling)

  10 threads:  6ms / 10 = 0.6ms → rounded up to 0.75ms per thread
  100 threads: 6ms / 100 = 0.06ms → rounded up to 0.75ms per thread
  → with 100 threads, each gets 0.75ms × 100 = 75ms to cycle through all
  → scheduling overhead becomes significant at high thread counts

NICE VALUES (priority):
  nice -20 (highest priority) to nice +19 (lowest priority)
  Default: nice 0
  
  Higher priority → vruntime increases SLOWER → thread gets MORE CPU time
  nice -20: ~10x more CPU share than nice +19
  
  $ renice -n -5 -p 12345   # give process 12345 higher priority
  $ nice -n 10 ./batch-job  # run batch job with lower priority

CPU AFFINITY:
  Bind a process/thread to specific CPU cores:
  $ taskset -c 0,1 java -jar app.jar   # run on cores 0 and 1 only
  
  WHY: prevent cache pollution (thread's L1/L2 cache stays hot on the same core)
  Used by: real-time systems, NUMA-aware applications, performance-critical services
```

---

## 5. Context Switching — The Hidden Performance Cost

A context switch is when the kernel saves the state of the currently running thread and loads the state of the next thread. This happens thousands of times per second on a busy system.

```
WHAT HAPPENS DURING A CONTEXT SWITCH:

Thread A running ──interrupt──► Kernel ──schedule──► Thread B running

1. Save Thread A's state:
   - CPU registers (general purpose, floating point, SIMD)
   - Program counter (where A was executing)
   - Stack pointer
   - FPU/SSE/AVX state (~512-2048 bytes!)

2. Switch kernel stack (from A's kernel stack to B's kernel stack)

3. Switch page tables (if A and B are in different processes)
   - Write CR3 register (on x86) with B's page table address
   - TLB (Translation Lookaside Buffer) is FLUSHED
     (all cached virtual→physical translations are invalidated)
   - TLB refill: ~5-10ns per entry × hundreds of entries = significant cost

4. Load Thread B's state:
   - Restore registers, program counter, stack pointer, FPU state

5. Resume Thread B's execution

COST:
  Same-process switch (threads): ~1-3 μs (no page table switch, TLB stays valid)
  Cross-process switch:          ~3-10 μs (page table switch, TLB flush)
  
  Plus INDIRECT COSTS:
  - CPU cache pollution: Thread B's data isn't in L1/L2 cache → cold cache
  - TLB refill: hundreds of TLB misses as B accesses its memory
  - Branch prediction pollution: CPU's branch predictor was trained on A's patterns
  
  Indirect costs: ~10-50 μs of degraded performance after a switch

WHY THIS MATTERS:
  200 Java threads × 1000 switches/sec = 200,000 switches/sec
  At 5μs each = 1 second of CPU time per second spent JUST switching
  That's an entire CPU core wasted on context switching!
  
  This is why:
  - Thread pools have a FIXED size (not unlimited threads)
  - NIO uses few threads with many connections (reduce switching)
  - Virtual threads are cheap (user-space switch, ~200ns, no kernel involvement)
  - "More threads" ≠ "more performance" after a certain point
```

---

## 6. Zombie and Orphan Processes — The Process Lifecycle

```
NORMAL LIFECYCLE:
  fork() → child runs → child exits → parent calls wait() → kernel cleans up child

ZOMBIE PROCESS:
  Child exits but parent HASN'T called wait() yet
  Child's exit status is saved by the kernel (so parent can read it later)
  Process appears in `ps` with state 'Z' (zombie)
  
  Zombies don't consume CPU or memory (they're dead), but they hold a PID
  Many zombies → PID exhaustion → can't create new processes
  
  FIX: parent must call wait()/waitpid() to collect exit status
  FIX: if parent is buggy, kill the parent → zombies become orphans → adopted by init → cleaned up

ORPHAN PROCESS:
  Parent exits before child → child is "orphaned"
  Kernel re-parents the orphan to PID 1 (init/systemd)
  PID 1 automatically calls wait() → orphan is cleaned up when it exits
  Orphans are NOT a problem (init handles them)

IN DOCKER: PID 1 problem
  Your app is PID 1 inside the container
  If it doesn't handle SIGCHLD / call wait(): zombie processes accumulate
  FIX: use --init flag (docker run --init) or tini as PID 1 (reaps zombies)
```

---

## 7. Signals — How Processes Communicate

```
A signal is an ASYNCHRONOUS notification sent to a process.
Like a tap on the shoulder: "hey, this happened."

SIGNAL    NUMBER  DEFAULT ACTION   COMMON USE
────────────────────────────────────────────────────────────
SIGTERM   15      Terminate         Polite shutdown ("please exit")
SIGKILL   9       Kill (immediate)  Force kill (CANNOT be caught or ignored!)
SIGINT    2       Terminate         Ctrl+C in terminal
SIGHUP    1       Terminate         Terminal closed, config reload
SIGSTOP   19      Stop              Pause process (CANNOT be caught!)
SIGCONT   18      Continue          Resume stopped process
SIGSEGV   11      Core dump         Segmentation fault (invalid memory access)
SIGCHLD   17      Ignore            Child process exited

GRACEFUL SHUTDOWN PATTERN (Java):
  Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      // SIGTERM received → JVM runs shutdown hooks
      // Close connections, flush buffers, deregister from service registry
      server.stop();
      dataSource.close();
      log.info("Shutdown complete");
  }));
  
  Kubernetes sends SIGTERM → waits 30 seconds → sends SIGKILL
  Your app MUST handle SIGTERM and shut down within 30 seconds!
  If it doesn't: SIGKILL → instant death, no cleanup, no graceful drain

kill vs kill -9:
  kill 12345      → sends SIGTERM (default) → process can catch and clean up
  kill -9 12345   → sends SIGKILL → instant death, no handler, no cleanup
  
  ALWAYS try SIGTERM first. Use SIGKILL only as a last resort.
  In Docker: docker stop → SIGTERM → 10s grace → SIGKILL
             docker kill → SIGKILL (immediate, no grace period)
```

---

## 8. Process Best Practices and Use Cases

```
THREAD POOL SIZING:
  CPU-bound tasks: threads = num_cores (+ 1 for occasional page fault)
  I/O-bound tasks: threads = num_cores × (1 + wait_time / compute_time)
  
  Example: 8 cores, tasks spend 90ms waiting for DB, 10ms computing
  threads = 8 × (1 + 90/10) = 80 threads
  
  BUT: more threads = more context switches = diminishing returns
  Monitor context switches: vmstat 1 (look at 'cs' column)
  If cs > 50,000/sec on an 8-core machine: you likely have too many threads

PROCESS vs THREAD DECISION:
  Use threads when: shared memory needed, fast communication, same trust domain
  Use processes when: isolation needed (crash one, others survive), different languages
  Use containers when: deploy independently, resource limits, different OS dependencies

AVOIDING ZOMBIE PROCESSES:
  In Java: use ProcessBuilder, always call process.waitFor() or process.destroyForcibly()
  In Docker: use --init or tini as PID 1 (handles SIGCHLD and zombie reaping)
  In systemd: KillMode=control-group ensures all children are killed on service stop

SIGNAL HANDLING:
  Always register shutdown hooks for graceful cleanup
  Set terminationGracePeriodSeconds in Kubernetes (default 30s)
  Test graceful shutdown: kill -TERM <pid> and verify clean exit in logs
```

---

*After this phase: you understand what a process IS at the kernel level — not just "a running program" but an address space, file descriptors, threads, and metadata. You can explain fork+exec, why context switching is expensive, what zombies are, and how signals enable graceful shutdown. You know why 200 threads is often worse than 20, and why Virtual Threads change the game.*
