# Phase 2 — Concurrency: The Complete Deep Dive

> This is where 90% of Java developers fail. This is where production bugs live.

Concurrency is not just a feature of the Java language — it's the defining challenge of modern backend systems. Every web request you serve, every Kafka message you consume, every database connection you manage involves multiple threads competing for shared resources. The difference between a system that handles 10,000 requests per second and one that deadlocks at 500 is not better hardware — it's a deep understanding of how threads interact, how memory becomes visible across cores, and how the JVM's concurrency primitives actually work under the hood.

Most Java developers learn enough concurrency to be dangerous: they know `synchronized` exists, they've heard of thread pools, and they can make things work in unit tests. But production concurrency bugs don't appear in unit tests. They appear at 3 AM under load, when two threads hit the same code path in just the right order, and the system produces silently wrong results or hangs forever. Mastering concurrency means understanding the problem at every level: the CPU cache architecture that causes visibility bugs, the JVM lock implementation that determines your latency, the thread pool configuration that determines your throughput, and the data structures designed to avoid contention entirely.

---

## 1. Thread Fundamentals — What the OS Actually Does

### Thread Lifecycle

Understanding thread states is not academic — it's the key to reading thread dumps, which is the single most important skill for diagnosing production concurrency issues. When your application hangs, a thread dump (`jstack <pid>`) shows every thread's state and stack trace. If you see hundreds of threads in BLOCKED state, you have a lock contention problem. If you see threads in WAITING state, they're waiting for a signal that may never come. If you see threads in TIMED_WAITING on `Thread.sleep()`, something is polling when it should be blocking. The state diagram below is not a textbook exercise — it's a diagnostic tool you'll use weekly in production.

```
                    ┌──────────────────────────────────────┐
                    │                                      │
          start()   │    ┌─ scheduler ─► RUNNABLE ◄─┐     │
  NEW ──────────────┼──►│                            │     │
                    │   │   ┌───────────────────────┘     │
                    │   │   │                              │
                    │   │   ├── synchronized (can't get lock) ──► BLOCKED
                    │   │   │                                      │
                    │   │   │                              lock acquired
                    │   │   │                                      │
                    │   │   ├── wait() / join() / park() ──► WAITING
                    │   │   │                                   │
                    │   │   │                      notify() / unpark()
                    │   │   │                                   │
                    │   │   ├── sleep(ms) / wait(ms) ──► TIMED_WAITING
                    │   │   │                                   │
                    │   │   │                          timeout / notify()
                    │   │   │                                   │
                    │   │   └───────────────────────────────────┘
                    │   │
                    │   └── run() completes ──► TERMINATED
                    │
                    └──────────────────────────────────────┘
```

**BLOCKED vs WAITING — the critical difference:**
- **BLOCKED:** Thread is trying to enter a `synchronized` block, but another thread holds the monitor. The thread is in the monitor's *entry set*.
- **WAITING:** Thread voluntarily gave up the CPU via `wait()`, `join()`, or `park()`. It's in the monitor's *wait set* and must be explicitly woken.

### How Java Threads Map to OS Threads

This is the fundamental reality that governs everything else about Java concurrency. In traditional Java (before virtual threads), every `new Thread()` that you `start()` creates a real operating system kernel thread. This means the OS scheduler manages it, the kernel allocates a ~1MB native stack for it, and context-switching between threads involves saving and restoring CPU registers through a system call. This is NOT free — it costs 1-10 microseconds per context switch, and more importantly, the OS has a hard limit on how many threads it can efficiently schedule (typically 5,000-10,000 before performance degrades).

This 1:1 mapping between Java threads and OS threads is the reason why the thread-per-request model doesn't scale to millions of concurrent connections, why thread pools exist, and why Project Loom (virtual threads) was created.

```
Java Thread                    OS Layer
───────────                    ────────
new Thread()        →          (nothing — just a Java object)
thread.start()      →          pthread_create() (Linux)
                               Creates kernel thread
                               ~1MB native stack allocated
                               OS scheduler manages it

thread.sleep(100)   →          nanosleep() syscall
                               Thread removed from run queue
                               Timer interrupt wakes it

synchronized        →          pthread_mutex_lock() (when inflated to heavyweight)
                               Or CAS on mark word (lightweight)

wait()              →          pthread_cond_wait() (when inflated)
                               Releases mutex, sleeps on condition variable

notify()            →          pthread_cond_signal()
                               Wakes one waiter
```

Each Java thread = one OS thread = one kernel scheduling entity. Context switching between threads involves:
1. Save registers to kernel stack
2. Switch page tables (if crossing processes)
3. Load registers from new thread's kernel stack
4. **Cost: ~1-10 microseconds** (varies by OS, but NOT free)

### Virtual Threads (Java 21+)

Virtual threads represent the most significant change to Java's concurrency model since `java.util.concurrent` was introduced in Java 5. The problem they solve is fundamental: in a web server handling 100,000 concurrent requests, the thread-per-request model requires 100,000 OS threads. But OS threads are expensive — each one consumes ~1MB of stack memory, and the kernel scheduler degrades above ~10,000 threads. So the industry spent 15 years building reactive frameworks (WebFlux, Vert.x, RxJava) that multiplex many requests onto a small number of threads using callback chains and event loops. These frameworks work, but they force you to rewrite your entire programming model into non-blocking, callback-based code — sacrificing readability, debuggability, and stack traces.

Virtual threads offer a radically simpler solution: keep the thread-per-request model (which is easy to reason about, debug, and profile) but make threads cheap. A virtual thread has a ~1KB initial stack (growing as needed), is not backed by an OS thread when it's blocked, and can be created in the millions. When a virtual thread blocks on I/O, the JVM **unmounts** it from its carrier (OS) thread, and the carrier picks up another virtual thread. When the I/O completes, the virtual thread is re-mounted. This gives you the scalability of reactive programming with the simplicity of synchronous code.

```
Traditional:  1 Java Thread  =  1 OS Thread  (1:1)
Virtual:      N Java Threads  =  M OS Threads (M:N, M << N)

┌──────────────────────────────────┐
│  Virtual Thread 1 (mounted)  ────┼──► Carrier Thread (OS Thread 1)
│  Virtual Thread 2 (unmounted)    │
│  Virtual Thread 3 (mounted)  ────┼──► Carrier Thread (OS Thread 2)
│  Virtual Thread 4 (unmounted)    │
│  Virtual Thread 5 (unmounted)    │
│  ... 100,000 virtual threads ... │
└──────────────────────────────────┘

When a virtual thread blocks (I/O, sleep, etc.):
  1. JVM unmounts it from the carrier thread (saves continuation)
  2. Carrier thread picks up another virtual thread
  3. When blocking operation completes, virtual thread is re-mounted

Result: you can have millions of virtual threads with a handful of OS threads
```

```java
// Traditional — limited to ~thousands
ExecutorService pool = Executors.newFixedThreadPool(200);

// Virtual — limited by memory, not OS threads
ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor();

// Or directly:
Thread.startVirtualThread(() -> {
    // This thread is cheap — ~1KB stack (grows as needed)
    // Blocking here unmounts the virtual thread, frees the carrier
    var result = httpClient.send(request, bodyHandler);
});
```

**Pinning:** Virtual threads get *pinned* to carrier threads (can't unmount) during:
- `synchronized` blocks (use `ReentrantLock` instead)
- Native method calls

### ThreadLocal — Memory Leak Trap

`ThreadLocal` gives each thread its own isolated copy of a variable — no synchronization needed, no contention, perfect thread safety. It's used everywhere: logging MDC contexts, transaction managers, security contexts (`SecurityContextHolder` in Spring Security), JDBC connections in older frameworks, and date formatters (before `DateTimeFormatter` was thread-safe).

But `ThreadLocal` has a dark side: **memory leaks in thread pools**. In a thread pool, threads are reused across requests. When you set a `ThreadLocal` value on a pooled thread and forget to call `remove()`, that value stays attached to the thread forever — surviving across unrelated requests, consuming memory, and potentially leaking sensitive data (like user credentials) from one request to the next. This is the #1 cause of classloader leaks in servlet containers and one of the most common memory leak patterns in production Java applications.

The mechanism is subtle: the `ThreadLocalMap` inside each `Thread` object uses **weak references** for keys (the `ThreadLocal` instance itself) but **strong references** for values (the object you stored). When the `ThreadLocal` variable goes out of scope and is garbage-collected, the key becomes `null`, but the value is still strongly referenced. If you never access that thread-local slot again, the value leaks indefinitely.

```java
// ThreadLocal = per-thread HashMap entry
private static final ThreadLocal<UserContext> context = new ThreadLocal<>();

context.set(new UserContext("admin"));  // stored in Thread.threadLocals (ThreadLocalMap)
UserContext ctx = context.get();        // retrieved from current thread's map
context.remove();                      // CRITICAL: must call in thread pools!
```

```
Thread.threadLocals is a ThreadLocalMap (custom hash map)
Entry extends WeakReference<ThreadLocal<?>>

Key (ThreadLocal reference):   WEAK reference — can be GC'd
Value (the stored object):     STRONG reference — NOT GC'd automatically

THE LEAK:
  ThreadPool reuses threads → Thread object stays alive
  ThreadLocal variable goes out of scope → WeakReference key is GC'd → null
  But the VALUE is still strongly referenced from the entry!
  Entry: [null key → strong ref to big object]

  ThreadLocalMap does lazy cleanup of stale entries on get/set,
  but if you never access that slot again, the value leaks forever.

FIX: ALWAYS call remove() in a finally block, especially in thread pools.
```

```java
try {
    context.set(new UserContext("admin"));
    // ... do work ...
} finally {
    context.remove();  // prevents memory leak in thread pools
}
```

---

## 2. synchronized — From Bytecode to CPU Instructions

`synchronized` is Java's original concurrency primitive, and despite the introduction of `ReentrantLock` and other alternatives, it remains the most-used locking mechanism in production Java code. Spring framework internals, `Hashtable`, `Vector`, `StringBuffer`, and millions of lines of business code use `synchronized`. Understanding it at the bytecode level is not optional — it's essential for understanding thread dumps, lock contention profiling, and the performance characteristics of your application.

What most developers don't realize is that `synchronized` is not a single mechanism — it's three mechanisms with automatic escalation between them. The JVM starts with the cheapest possible locking strategy and progressively upgrades to more expensive ones only when contention demands it. This adaptive approach means that `synchronized` is nearly free when there's no contention (which is the common case) and only pays the heavy cost of OS-level locking when multiple threads are actively fighting for the same lock. Understanding this escalation path explains why `synchronized` performance varies wildly depending on your workload and why micro-benchmarks of locking are almost always misleading.

### Bytecode: monitorenter / monitorexit

```java
public class Counter {
    private int count = 0;

    public void increment() {
        synchronized (this) {
            count++;
        }
    }

    public synchronized void decrement() {
        count--;
    }
}
```

```
// javap -c Counter.class

// synchronized BLOCK uses monitorenter/monitorexit:
public void increment();
    Code:
       0: aload_0
       1: dup
       2: astore_1
       3: monitorenter          // acquire this.monitor
       4: aload_0
       5: dup
       6: getfield      #2     // count
       9: iconst_1
      10: iadd
      11: putfield      #2     // count = count + 1
      14: aload_1
      15: monitorexit           // release this.monitor (normal path)
      16: goto          24
      19: astore_2              // exception handler
      20: aload_1
      21: monitorexit           // release this.monitor (exception path!)
      22: aload_2
      23: athrow
      24: return

// synchronized METHOD uses ACC_SYNCHRONIZED flag (no monitorenter in bytecode):
public synchronized void decrement();
    flags: ACC_PUBLIC, ACC_SYNCHRONIZED    // JVM handles monitor enter/exit
    Code:
       0: aload_0
       1: dup
       2: getfield      #2
       5: iconst_1
       6: isub
       7: putfield      #2
      10: return
```

**Notice:** The compiler generates TWO `monitorexit` instructions — one for normal exit, one in the exception handler. This guarantees the lock is always released.

### Object Header and Lock States

Every Java object has a header (8-16 bytes on 64-bit JVM):

```
64-bit Object Header:
┌────────────────────────────────────────────────────────┬───────────────────┐
│                     Mark Word (64 bits)                 │  Klass Pointer    │
│                                                        │  (32/64 bits)     │
└────────────────────────────────────────────────────────┴───────────────────┘

Mark Word layout changes based on lock state:

UNLOCKED (Normal):
┌─────────────────────────┬────────┬───┬──────┬────┐
│  unused (25) │ hashCode (31)     │age│ bias │ 01 │  lock state bits
└─────────────────────────┴────────┴───┴──────┴────┘

BIASED (Thread ID in mark word):
┌────────────────────────────┬───────┬───┬──────┬────┐
│     Thread ID (54)         │ epoch │age│  1   │ 01 │
└────────────────────────────┴───────┴───┴──────┴────┘

THIN/LIGHTWEIGHT LOCK (Lock record pointer):
┌──────────────────────────────────────────────────┬────┐
│         Lock Record Pointer (62)                  │ 00 │
└──────────────────────────────────────────────────┴────┘

HEAVYWEIGHT LOCK (ObjectMonitor pointer):
┌──────────────────────────────────────────────────┬────┐
│         ObjectMonitor Pointer (62)                │ 10 │
└──────────────────────────────────────────────────┴────┘
```

### Lock Escalation — How the JVM Optimizes Locking

This is one of the JVM's most impressive runtime optimizations. The insight behind lock escalation is that most locks in real applications are **uncontested** — only one thread ever acquires them. For these locks, paying the cost of a CAS instruction (let alone an OS mutex) is pure waste. So the JVM starts with **biased locking**: it simply writes the acquiring thread's ID into the object header. On subsequent acquisitions by the same thread, it just checks the thread ID — no atomic operation needed. This makes recursive locking and single-threaded synchronized code essentially free.

When a second thread tries to acquire the lock, biased locking is revoked and the JVM upgrades to **lightweight locking**: a CAS operation that swaps the object's mark word with a pointer to a lock record on the thread's stack. This is still very fast (~20 nanoseconds) and avoids any OS involvement. Only when CAS spinning fails under sustained contention does the JVM **inflate** the lock to a **heavyweight monitor** backed by an OS mutex, where blocked threads are parked (removed from the CPU's run queue) and woken by the kernel. This is the 1-10 microsecond path that shows up in thread dumps as `BLOCKED` states.

```
Biased Lock → Lightweight Lock → Heavyweight Lock
  (free)       (CAS spin)          (OS mutex)

BIASED LOCKING (deprecated Java 15, removed Java 18):
  First thread: CAS thread ID into mark word
  Same thread re-enters: compare thread ID — match → zero-cost entry
  Different thread: revoke bias → upgrade to lightweight
  Cost: ZERO for uncontested single-threaded access

LIGHTWEIGHT LOCK:
  Thread creates a "Lock Record" on its stack
  CAS: replace mark word with pointer to Lock Record
  If CAS succeeds: locked (no OS involvement)
  If another thread also CASing: brief spin
  If spin fails: inflate to heavyweight
  Cost: one CAS instruction (~20 nanoseconds)

HEAVYWEIGHT LOCK:
  JVM allocates ObjectMonitor (C++ object in JVM heap)
  Uses OS mutex (pthread_mutex on Linux)
  Blocked threads are parked (removed from CPU run queue)
  Has entry queue (BLOCKED threads) and wait queue (WAITING threads)
  Cost: ~1-10 microseconds (syscall + context switch)
```

```
Lock escalation timeline:

Time ─────────────────────────────────────────────────►

Thread A enters sync block:
  [BIASED to A] → reenter: free → reenter: free

Thread B tries to enter:
  [REVOKE BIAS] → [LIGHTWEIGHT] → CAS spin → B wins CAS

Thread C also tries while A holds:
  [LIGHTWEIGHT] → spin fails → [INFLATE TO HEAVYWEIGHT]
  C parks (blocked in OS)
  When A exits: OS wakes one waiter
```

### wait() / notify() — How the Monitor Works

The `wait()`/`notify()` mechanism is Java's original condition variable implementation, and understanding it deeply is the key to understanding why it's so easy to misuse. The mental model is this: every Java object that's used with `synchronized` has two invisible queues attached to it. The **entry set** holds threads that tried to enter a `synchronized` block but found the lock already taken — they're BLOCKED, waiting for the lock to become available. The **wait set** holds threads that voluntarily released the lock by calling `wait()` — they're WAITING, and they won't even try to reacquire the lock until another thread calls `notify()` or `notifyAll()` to move them back to the entry set.

The subtlety that causes bugs: when `notify()` wakes a thread, that thread doesn't immediately run. It's moved from the wait set to the entry set, where it must **compete for the lock** against every other thread in the entry set and any new thread trying to acquire the lock. By the time the woken thread actually acquires the lock, the condition it was waiting for may have changed again. This is why `wait()` must ALWAYS be called in a `while` loop that re-checks the condition — never in an `if` statement.

```
ObjectMonitor structure (C++ in JVM):
┌──────────────────────────────┐
│  Owner: Thread A (holds lock)│
│                              │
│  Entry Set (BLOCKED):        │ ← threads waiting to ACQUIRE the lock
│    Thread C                  │    (tried synchronized, lock was taken)
│    Thread D                  │
│                              │
│  Wait Set (WAITING):         │ ← threads that called wait()
│    Thread B                  │    (released lock, sleeping until notify)
│    Thread E                  │
└──────────────────────────────┘

Flow:
  Thread A calls wait():
    1. Release monitor (Owner = null)
    2. Move Thread A to Wait Set
    3. Thread from Entry Set acquires monitor

  Thread X calls notify():
    1. Move ONE thread from Wait Set → Entry Set
    2. That thread must REACQUIRE the monitor before running
    (this is why wait() must be in a loop — the condition may have changed)

  Thread X calls notifyAll():
    1. Move ALL threads from Wait Set → Entry Set
    2. They all compete for the monitor (thundering herd)
```

```java
// The CORRECT wait pattern — always loop
synchronized (lock) {
    while (!condition) {     // LOOP, not if
        lock.wait();         // releases lock, enters wait set
    }
    // condition is true AND we hold the lock
    doWork();
}

// WHY a loop:
// 1. Spurious wakeups: OS can wake you without notify()
// 2. Stolen condition: another thread may have consumed the condition
//    between your notify() and your reacquisition of the lock
```

---

## 3. Java Memory Model (JMM) — The Rules That Govern Everything

The Java Memory Model is the most important and least understood concept in all of Java concurrency. It's not about heap and stack, not about garbage collection, and not about how much memory your application uses. The JMM is a formal specification that defines **when a write to a variable by one thread becomes visible to a read of that variable by another thread**. Without the JMM, concurrent programming in Java would be impossible, because modern CPUs and compilers aggressively optimize your code in ways that are invisible to a single thread but completely break multithreaded assumptions.

Here's the fundamental problem: your intuition about program execution is sequential — you assume that statement A executes before statement B, and that when thread 1 writes `x = 42`, thread 2 will immediately see `42` when it reads `x`. Neither of these assumptions is true on modern hardware. Compilers reorder instructions for optimization. CPUs execute instructions out of order for pipeline efficiency. Each CPU core has its own L1/L2 cache, and a write to a variable may sit in one core's store buffer for microseconds before becoming visible to another core. All of this is invisible in single-threaded code (the processor guarantees the illusion of sequential execution within one thread), but in multithreaded code, without explicit synchronization, another thread can see a stale, partial, or reordered view of your writes.

The JMM gives you a **happens-before** relationship — a set of rules that guarantee visibility and ordering. If action A happens-before action B, then everything done by A is visible to B. The entire discipline of Java concurrency programming reduces to one question: **is there a happens-before relationship between my write and the other thread's read?** If yes, the read sees the write. If no, the read may see anything — including values that were never written (this is not a bug; it's the JMM specification).

### Why the JMM Exists

```
Modern hardware reality:

CPU Core 0                    CPU Core 1
┌──────────┐                  ┌──────────┐
│ Register │                  │ Register │
├──────────┤                  ├──────────┤
│ Store    │                  │ Store    │
│ Buffer   │                  │ Buffer   │
├──────────┤                  ├──────────┤
│ L1 Cache │                  │ L1 Cache │
├──────────┤                  ├──────────┤
│ L2 Cache │                  │ L2 Cache │
└────┬─────┘                  └────┬─────┘
     │          L3 Cache           │
     └──────────┬──────────────────┘
                │
         Main Memory

Problem: Core 0 writes x=42, but Core 1 still sees x=0
Why: The write is sitting in Core 0's store buffer or L1 cache
     and hasn't been flushed to shared cache / main memory yet
```

Without the JMM, the compiler and CPU can reorder any operations that don't have data dependencies within a single thread. This is invisible in single-threaded code but DEVASTATING in multithreaded code.

### Happens-Before — THE Most Important Concept

This is the contract that governs all of concurrent Java. Everything else — `synchronized`, `volatile`, `Lock`, `AtomicInteger`, `ConcurrentHashMap` — is just a mechanism for establishing happens-before relationships. When Brian Goetz says "safe publication" in *Java Concurrency in Practice*, he means "there's a happens-before edge between the publisher and the reader." When Aleksey Shipilev explains visibility bugs in his JMM talks, he's showing the absence of happens-before edges.

There are exactly six rules, and every correct concurrent program relies on one or more of them. Memorize these — they're the fundamental axioms of Java concurrency.

"If action A **happens-before** action B, then A's effects are **guaranteed visible** to B."

```
The rules (memorize these):

1. PROGRAM ORDER:      Within a thread, every statement happens-before the next.

2. MONITOR LOCK:       An unlock on monitor M happens-before every
                       subsequent lock on M.
                       (= everything before unlock is visible after lock)

3. VOLATILE:           A write to volatile field F happens-before every
                       subsequent read of F.
                       (= write flushes everything, read invalidates cache)

4. THREAD START:       Thread.start() happens-before any action in the
                       started thread.
                       (= parent's writes visible to child)

5. THREAD JOIN:        All actions in a thread happen-before join() returns.
                       (= thread's writes visible to joiner)

6. TRANSITIVITY:       If A hb B and B hb C, then A hb C.
                       (= chain of happens-before guarantees)
```

```java
// Example: Monitor lock rule in action

// Thread A:
synchronized (lock) {
    x = 42;            // (1)
    y = "hello";       // (2)
}                       // (3) unlock

// Thread B:
synchronized (lock) {   // (4) lock — happens-before by rule #2 (3→4)
    // x is GUARANTEED to be 42
    // y is GUARANTEED to be "hello"
    // Because (1) hb (2) hb (3) hb (4) → transitivity
}
```

### Instruction Reordering — What Actually Happens

This is the concept that most developers refuse to believe until they see it break their code. Both the compiler (javac, then the JIT) and the CPU itself can and do execute instructions in a different order than you wrote them. The rule is: within a single thread, reordering is invisible — the program produces the same final result as if every instruction executed in source order. But across threads, reordering can expose intermediate states that should be impossible according to the source code. The classic example below shows how a flag can appear to be set before the data it was supposed to guard.

```java
// What you write:
int a = 1;      // (1)
int b = 2;      // (2)
flag = true;    // (3) — flag is NOT volatile

// What the CPU / compiler may execute:
flag = true;    // (3) — moved BEFORE (1) and (2)!
int b = 2;      // (2)
int a = 1;      // (1)

// This is LEGAL because within a single thread,
// there's no data dependency between these statements.
// The program produces the same final state.

// But another thread reading flag==true might see a==0, b==0
```

### volatile — What It Really Does

`volatile` is simultaneously the simplest and the most misunderstood concurrency keyword in Java. It does exactly two things: (1) it prevents the compiler and CPU from reordering reads/writes of the volatile variable with respect to other memory operations, and (2) it forces the write to be flushed to main memory (visible to all cores) and forces the read to bypass the cache and read from main memory. In JMM terms: a volatile write *happens-before* every subsequent volatile read of the same variable. Combined with the program order rule and transitivity, this means a volatile variable can serve as a **synchronization flag** that makes ALL prior writes visible to the reading thread — not just the volatile variable itself.

But volatile does NOT provide atomicity for compound operations. `volatile int count; count++;` is still broken because `count++` is three operations (read, add, write), and another thread can intervene between any two of them. For atomic compound operations, you need `AtomicInteger`, `synchronized`, or `VarHandle`.

```java
volatile boolean ready = false;
int data = 0;

// Thread A (writer):
data = 42;           // (1)
ready = true;        // (2) volatile write — acts as a STORE FENCE
                     //     flushes store buffer, all prior writes become visible

// Thread B (reader):
if (ready) {         // (3) volatile read — acts as a LOAD FENCE
                     //     invalidates cache, loads from main memory
    assert data == 42;  // (4) GUARANTEED by happens-before:
                        //     (2) volatile write hb (3) volatile read
                        //     (1) hb (2) by program order
                        //     (1) hb (3) by transitivity
                        //     therefore data==42 is visible
}
```

**volatile on x86:**

```
volatile write:
    MOV [address], value      // normal store
    MFENCE                    // or LOCK-prefixed instruction
    // MFENCE = full memory fence — drains store buffer

volatile read:
    MOV reg, [address]        // normal load (x86 loads already have acquire semantics)
    // On x86, loads are not reordered with loads — but volatile
    // still prevents COMPILER from reordering past it
```

### Why volatile int count++ Is Broken

```java
volatile int count = 0;

// Thread A:                    Thread B:
count++;                        count++;

// count++ is THREE operations:
// 1. Read count   (0)         // 1. Read count   (0)
// 2. Add 1        (1)         // 2. Add 1        (1)
// 3. Write count  (1)         // 3. Write count  (1)

// Both threads read 0, add 1, write 1. Final count = 1 (should be 2)
// volatile ensures visibility of EACH operation, but not atomicity
// of the COMPOUND read-modify-write
```

**Fix: Use AtomicInteger:**

```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
// Uses CAS loop: read → compute → compareAndSet → retry if changed
// This is truly atomic
```

### Double-Checked Locking — The Classic Bug

Double-checked locking is the most famous concurrency bug pattern in Java, and understanding why it's broken (without `volatile`) crystallizes everything about the JMM in a single example. The pattern attempts to optimize singleton creation by avoiding synchronization on the common path (when the instance already exists). The first `null` check is unsynchronized (fast), and synchronization only happens on the rare first initialization. This seems clever, but it's broken because of instruction reordering: the JVM can assign the reference to the `instance` variable *before* the constructor finishes executing the object's fields. A second thread can then see a non-null `instance` that points to an incompletely constructed object. The fix is simple — make `instance` volatile — but the bug illustrates why you cannot reason about concurrent code using sequential intuition.

```java
// BROKEN (without volatile):
class Singleton {
    private static Singleton instance;  // NOT volatile

    public static Singleton getInstance() {
        if (instance == null) {              // (1) check
            synchronized (Singleton.class) {
                if (instance == null) {      // (2) double check
                    instance = new Singleton(); // (3) create
                }
            }
        }
        return instance;
    }
}
```

**Why it's broken:** `instance = new Singleton()` is actually 3 operations:

```
1. Allocate memory for Singleton
2. Call constructor (initialize fields)
3. Assign reference to 'instance' variable

The CPU/compiler can reorder to: 1 → 3 → 2

Thread A:                          Thread B:
  1. Allocate memory                 
  3. instance = <address>            
                                     1. Check: instance != null (sees address!)
                                     return instance → USES UNINITIALIZED OBJECT
  2. Constructor runs
```

**Fix: make instance volatile:**

```java
private static volatile Singleton instance;
// volatile write (step 3) acts as a store fence
// prevents reordering: constructor MUST complete before reference is published
```

### Safe Publication Patterns

"Safe publication" is the term Brian Goetz uses in *Java Concurrency in Practice* for making an object visible to other threads in a state where all its fields are correctly initialized and visible. An unsafely published object can appear to have default values (0, null, false) for its fields, even though the publishing thread already initialized them. This happens because, without a happens-before edge, the reading thread may see the reference (non-null) but not the writes to the object's fields (still zero/null from the reading thread's perspective).

There are exactly five ways to safely publish an object in Java. Every concurrent program must use one of these:

```
1. VOLATILE:           Write object ref to volatile field
                       → volatile write happens-before subsequent read

2. SYNCHRONIZED:       Publish inside synchronized block
                       → monitor unlock happens-before subsequent lock

3. FINAL FIELDS:       Make all fields final
                       → JVM guarantees final fields visible after constructor
                       (special "freeze" action at end of constructor)

4. STATIC INITIALIZER: Assign in static {} block or static field init
                       → Class initialization is internally synchronized
                       → guaranteed visible to all threads after class is loaded

5. CONCURRENT COLLECTION: Put into ConcurrentHashMap, etc.
                       → these collections provide their own happens-before
```

---

## 4. Locks — ReentrantLock, ReadWriteLock, StampedLock

`synchronized` is simple and safe, but it lacks features that production systems need: timeout-based lock acquisition (to avoid indefinite blocking), interruptible locking (to cancel waiting threads), try-lock semantics (to attempt without blocking), multiple condition variables (to separate different wait conditions), and fairness guarantees (to prevent thread starvation). `ReentrantLock` provides all of these, at the cost of requiring manual `lock()`/`unlock()` in try-finally blocks (where forgetting the `finally` means a permanent lock leak).

The decision of when to use `synchronized` versus `ReentrantLock` is straightforward: use `synchronized` unless you need one of the features above. `synchronized` is simpler, less error-prone (the compiler guarantees unlock on all exit paths), and the JVM optimizes it aggressively with lock escalation. Use `ReentrantLock` when you need tryLock, timeout, interruptibility, or multiple conditions — these are the situations where `synchronized` simply cannot help you.

### ReentrantLock and AbstractQueuedSynchronizer (AQS)

`ReentrantLock` is built on **AQS** (AbstractQueuedSynchronizer), the backbone of `java.util.concurrent`. Doug Lea designed AQS as a unified framework for building synchronization primitives. `ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock`, and `FutureTask` are all built on AQS. Understanding AQS means understanding the engine behind every lock in the JDK.

The core idea is elegant: AQS maintains a single `int state` (whose meaning is defined by the subclass), an `owner` thread, and a **CLH queue** (Craig, Landin, Hagersten) — a FIFO queue of waiting threads built as a doubly-linked list. When a thread fails to acquire the lock, it creates a node, enqueues itself, and parks (suspends via `LockSupport.park()`). When the lock is released, the holder unparks the first waiter, which retries acquisition.

```
AQS internals:
┌─────────────────────────────────────────────┐
│  int state;        // 0 = unlocked, >0 = locked (count for reentrancy)
│  Thread owner;     // thread that holds the lock
│                                             │
│  CLH Queue (doubly-linked FIFO):            │
│  ┌──────┐   ┌──────┐   ┌──────┐            │
│  │ head │──►│ Node │──►│ tail │            │
│  │(dummy)│   │ Thrd B│   │ Thrd C│            │
│  └──────┘   └──────┘   └──────┘            │
│              WAITING      WAITING            │
└─────────────────────────────────────────────┘

Lock acquisition (unfair):
  1. CAS state from 0 → 1
  2. If success → set owner = currentThread, enter critical section
  3. If fail → create Node, enqueue in CLH queue, park (LockSupport.park)
  4. When owner releases: unpark head's successor
  5. Unparked thread retries CAS

FAIR vs UNFAIR:
  Unfair (default): arriving thread can BARGE ahead of queued threads
    → 2-10x higher throughput (avoids context switch for barged thread)
    → risk of starvation for queued threads

  Fair: arriving thread always goes to back of queue
    → guaranteed FIFO ordering
    → lower throughput (every acquisition = context switch)
```

```java
// ReentrantLock features not available in synchronized:
ReentrantLock lock = new ReentrantLock();

// 1. tryLock — non-blocking attempt
if (lock.tryLock()) {
    try {
        // got the lock
    } finally {
        lock.unlock();
    }
} else {
    // couldn't get lock — do something else
}

// 2. tryLock with timeout — avoids deadlock
if (lock.tryLock(5, TimeUnit.SECONDS)) { ... }

// 3. lockInterruptibly — respond to interruption while waiting
lock.lockInterruptibly();

// 4. Multiple conditions
Condition notFull = lock.newCondition();
Condition notEmpty = lock.newCondition();
// vs synchronized: only ONE wait/notify set per monitor
```

### ReadWriteLock — Shared vs Exclusive

In many real-world systems, reads vastly outnumber writes. A configuration cache, a routing table, a user session store — all are read thousands of times for every write. Using a regular exclusive lock for these structures forces all readers to serialize, which destroys throughput. `ReadWriteLock` solves this by allowing **multiple concurrent readers** while still guaranteeing exclusive access for writers. As long as nobody is writing, any number of threads can read simultaneously without contention.

The trade-off is complexity: the lock must track how many readers hold the lock at any time, and a writer must wait for ALL readers to release before it can acquire. This creates a subtle problem: if new readers keep arriving while a writer is waiting, the writer can be starved indefinitely. The `fair` variant of `ReentrantReadWriteLock` solves this by blocking new readers once a writer is queued, but at a throughput cost.

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Multiple readers can hold simultaneously:
rwLock.readLock().lock();   // shared — many threads can hold
try {
    return data.get(key);
} finally {
    rwLock.readLock().unlock();
}

// Writer needs exclusive access:
rwLock.writeLock().lock();  // exclusive — blocks ALL readers and writers
try {
    data.put(key, value);
} finally {
    rwLock.writeLock().unlock();
}
```

```
State diagram:
                 ┌──────────┐
    read lock    │ READERS   │    read lock
   ──────────►   │ (n holds) │   ◄──────────
                 └─────┬────┘
                       │ write lock request
                       ▼
                 ┌──────────┐
                 │ WRITER    │  exclusive — all readers blocked
                 │ (1 hold)  │
                 └──────────┘

Write starvation problem: continuous stream of readers can starve writers
Fix: fair ReadWriteLock — writer request blocks new readers
```

### StampedLock — Optimistic Reads

`StampedLock` (Java 8) takes the read-write lock concept further with **optimistic reading** — the fastest possible read path. An optimistic read doesn't acquire any lock at all. Instead, it reads a version stamp, performs the reads, and then validates that no writer intervened. If validation succeeds, the read completes without any synchronization overhead — no CAS, no atomic increment, just a single volatile read. If validation fails (a writer was active), the reader falls back to a pessimistic read lock.

This is ideal for the very common pattern where reads are extremely frequent and writes are extremely rare — like reading coordinates in a game engine, checking a feature flag, or reading a price in a trading system. Under these workloads, optimistic reads can be 5-10x faster than `ReadWriteLock` because there's zero contention between readers.

The catch: `StampedLock` is NOT reentrant. If a thread holding a write lock tries to acquire a read lock, it will deadlock. It's also not interruptible. These limitations make it unsuitable as a general-purpose lock but excellent for specific high-performance scenarios.

```java
StampedLock sl = new StampedLock();

// Optimistic read — NO lock acquired, just a version stamp
long stamp = sl.tryOptimisticRead();
double x = this.x;
double y = this.y;
if (!sl.validate(stamp)) {
    // someone wrote during our read — fall back to pessimistic
    stamp = sl.readLock();
    try {
        x = this.x;
        y = this.y;
    } finally {
        sl.unlockRead(stamp);
    }
}
// Use x, y

// This is MUCH faster under low write contention:
// optimistic read = single volatile read of the stamp
// no CAS, no park, no OS involvement
```

### Deadlock — Four Conditions

Deadlock is the most feared concurrency bug because it's silent — no exception is thrown, no error is logged, threads just stop making progress forever. Your application appears to hang, CPU usage drops to zero, and users see timeouts. Unlike race conditions (which produce wrong results intermittently), deadlocks are deterministic once the thread scheduling hits the right interleaving — but that interleaving may only occur under production load.

The theory of deadlock is well-understood: it requires four conditions to hold simultaneously. Break any one of them and deadlock becomes impossible. In practice, the most effective prevention strategy is **lock ordering**: always acquire locks in the same global order. If every thread acquires lock A before lock B, the circular wait condition can never form.

```
1. Mutual Exclusion:    Resource can only be held by one thread
2. Hold and Wait:       Thread holds one resource, waits for another
3. No Preemption:       Resource can't be forcibly taken
4. Circular Wait:       A→B→C→A dependency cycle

Break ANY ONE condition to prevent deadlock.
```

```java
// Classic deadlock:
Object lockA = new Object();
Object lockB = new Object();

// Thread 1:                        Thread 2:
synchronized (lockA) {              synchronized (lockB) {
    Thread.sleep(100);                  Thread.sleep(100);
    synchronized (lockB) {              synchronized (lockA) {
        // deadlock                         // deadlock
    }                                   }
}                                   }
```

**Detection with jstack:**

```
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f9a0c00b3a8 (object 0x00000007aee02098, a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f9a0c00b458 (object 0x00000007aee020a8, a java.lang.Object),
  which is held by "Thread-1"
```

**Prevention: Lock ordering — always acquire locks in a consistent global order.**

---

## 5. Atomic Classes — CAS and Lock-Free Programming

Locks work, but they have a fundamental limitation: when a thread holds a lock, every other thread that wants that lock must wait. Under high contention, this creates a convoy effect where threads spend more time waiting than working. **Lock-free algorithms** take a radically different approach: instead of preventing concurrent access, they let threads race and detect conflicts after the fact. The core primitive is **Compare-And-Swap (CAS)** — a single CPU instruction that atomically checks whether a memory location still holds an expected value and, if so, updates it. If another thread changed the value first, the CAS fails and the thread retries with the new value.

Lock-free programming is not "better" than locking in all cases — it trades contention stalls for retry loops, and under extreme contention, the retry loops can waste more CPU than a lock would. But for the common pattern of "read a value, compute a new value, write it back" (like incrementing a counter), CAS-based atomics are 2-10x faster than locks because they never involve OS-level thread parking and unparking.

Java's `java.util.concurrent.atomic` package provides CAS-based atomic classes for all common cases: `AtomicInteger`, `AtomicLong`, `AtomicReference`, `AtomicBoolean`, `LongAdder`, and `AtomicStampedReference`. Understanding when to use each one is a core concurrency skill.

### Compare-And-Swap (CAS)

```
CAS is a SINGLE CPU INSTRUCTION (CMPXCHG on x86):

CAS(memory_location, expected_value, new_value):
    atomically {
        if (*memory_location == expected_value) {
            *memory_location = new_value;
            return true;   // success
        } else {
            return false;  // someone else changed it
        }
    }

This is the foundation of ALL lock-free algorithms in Java.
```

```java
// AtomicInteger.incrementAndGet() — CAS retry loop:
public final int incrementAndGet() {
    int prev, next;
    do {
        prev = get();              // read current value (volatile)
        next = prev + 1;           // compute new value
    } while (!compareAndSet(prev, next));  // CAS — retry if someone else changed it
    return next;
}
```

### LongAdder vs AtomicLong — High-Contention Counter

This is a crucial performance distinction for metrics, counters, and rate limiters. `AtomicLong` uses a single CAS on a single memory location. Under high contention (many threads incrementing simultaneously), every CAS except one will fail on each attempt, forcing retries and causing the cache line containing the counter to bounce between CPU cores (cache-line ping-pong). `LongAdder` solves this by **spreading contention across multiple cells** — each thread preferentially updates its own cell, and `sum()` adds them all together. The cells are padded with `@Contended` to ensure each occupies its own CPU cache line, eliminating false sharing.

Use `AtomicLong` when you need to read the exact current value frequently (e.g., a sequence generator). Use `LongAdder` when you primarily add/increment and only occasionally read the sum (e.g., request counters, metrics). In benchmarks with 16+ threads, `LongAdder` is 10-50x faster than `AtomicLong` for increment operations.

```
AtomicLong under high contention:
  Thread 1: CAS(0→1) success
  Thread 2: CAS(0→1) FAIL → retry CAS(1→2) success
  Thread 3: CAS(0→1) FAIL → retry CAS(2→3) success
  → lots of CAS retries, lots of cache line bouncing

LongAdder under high contention:
  ┌──────────┬──────────┬──────────┬──────────┐
  │  base    │  Cell[0] │  Cell[1] │  Cell[2] │
  │  (long)  │  (long)  │  (long)  │  (long)  │
  └──────────┴──────────┴──────────┴──────────┘

  Thread 1: CAS on base → success
  Thread 2: CAS on base → fail → CAS on Cell[0] → success
  Thread 3: CAS on Cell[1] → success

  sum() = base + Cell[0] + Cell[1] + Cell[2]

  Each Cell is padded with @Contended to avoid FALSE SHARING:
  ┌────────────────────────────────────────────┐
  │  padding (128 bytes) │ value │ padding      │
  └────────────────────────────────────────────┘
  Each Cell occupies its own cache line (64 bytes on most CPUs)
  → no cache line bouncing between cores
```

**Use `LongAdder` for counters (add-heavy). Use `AtomicLong` when you need `get()` to be exact.**

### ABA Problem

The ABA problem is the Achilles' heel of CAS-based algorithms. CAS only checks whether the current value matches the expected value — it cannot detect whether the value was changed to something else and then changed back. In simple counters this doesn't matter, but in lock-free data structures (stacks, queues, linked lists) where the value is a pointer/reference, ABA can cause silent data corruption: a pointer may point to a completely different object that happens to have the same address as the one that was freed and reallocated.

```
Thread 1 reads value A, goes to sleep
Thread 2 changes A → B → A
Thread 1 wakes, CAS sees A == expected A → succeeds
But the value went through B — state may be inconsistent

Example: lock-free stack
  Stack: [A] → [B] → [C]
  Thread 1: reads top=A, next=B. Plans to CAS(top, A, B)
  Thread 2: pop A, pop B, push A. Stack: [A] → [C]
  Thread 1: CAS(top, A, B) — succeeds! But B is gone. Stack corrupted.

Fix: AtomicStampedReference — CAS on (reference, stamp) pair
  stamp is a version counter that increments on every write
  Even if reference returns to same value, stamp is different → CAS fails
```

---

## 6. ExecutorService — Thread Pool Architecture

Thread pools are the backbone of every Java backend system. The idea is simple: instead of creating a new OS thread for every task (expensive: ~1MB stack allocation, kernel scheduling overhead, creation/teardown cost), you maintain a pool of reusable threads that pick up tasks from a queue. This amortizes thread creation cost across thousands of tasks and gives you control over the maximum number of concurrent threads (which limits resource consumption and prevents your system from falling over under load).

But the devil is in the details. A thread pool that's too small starves tasks of CPU time. A thread pool that's too large wastes memory and causes excessive context switching. An unbounded task queue hides backpressure and leads to OutOfMemoryError. A `CallerRunsPolicy` provides natural backpressure but changes the threading semantics. Every production thread pool configuration is a trade-off between throughput, latency, memory, and failure behavior — and getting it wrong is one of the most common causes of production outages.

The most important lesson in this entire section is: **never use `Executors` factory methods in production**. They hide dangerous defaults (unbounded queues, unlimited thread creation) behind convenient APIs. Always construct `ThreadPoolExecutor` directly with explicit, bounded parameters.

### ThreadPoolExecutor Internals

```java
ThreadPoolExecutor(
    int corePoolSize,           // threads to keep alive even when idle
    int maximumPoolSize,        // hard cap on thread count
    long keepAliveTime,         // idle time before non-core threads die
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,  // queue for excess tasks
    ThreadFactory threadFactory,
    RejectedExecutionHandler handler
);
```

```
Task submission flow:

New task submitted
      │
      ▼
 activeThreads < corePoolSize?
      │ YES                    │ NO
      ▼                        ▼
 Create new thread         Queue full?
 (even if others idle)        │ NO              │ YES
                              ▼                  ▼
                         Enqueue task      activeThreads < maxPoolSize?
                                               │ YES           │ NO
                                               ▼                ▼
                                          Create thread    REJECT (handler)
```

### Why Executors Factory Methods Are Dangerous

This is one of the most critical "gotchas" in Java — so important that many companies ban `Executors` factory methods in their style guides, and tools like Error Prone flag them as warnings. The factory methods look convenient but hide configurations that will crash your application under load. Understanding *why* they're dangerous requires understanding the task submission flow above.

```java
// Executors.newFixedThreadPool(n):
new ThreadPoolExecutor(n, n, 0L, TimeUnit.MILLISECONDS,
    new LinkedBlockingQueue<Runnable>());  // ← UNBOUNDED queue!
// Risk: if tasks produce faster than consumed, queue grows until OOM

// Executors.newCachedThreadPool():
new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, TimeUnit.SECONDS,
    new SynchronousQueue<Runnable>());  // ← no queue, always creates thread
// Risk: burst of tasks creates unlimited threads until OOM

// CORRECT: always construct ThreadPoolExecutor directly
ExecutorService pool = new ThreadPoolExecutor(
    10,                                    // core
    50,                                    // max
    60L, TimeUnit.SECONDS,                // keepalive
    new ArrayBlockingQueue<>(100),         // bounded queue!
    new ThreadPoolExecutor.CallerRunsPolicy()  // backpressure: caller runs it
);
```

### Queue Types and Their Effects

```
Queue Type              Behavior                     Use When
────────────────────────────────────────────────────────────────
LinkedBlockingQueue     Unbounded (or bounded)       DANGEROUS if unbounded
(unbounded)             Never rejects, grows to OOM  Use bounded always!

ArrayBlockingQueue      Bounded, single array        General purpose bounded queue
                        Fair/unfair ordering

SynchronousQueue        Zero capacity                CachedThreadPool-style:
                        Producer blocks until        always create new thread
                        consumer takes               for immediate execution

PriorityBlockingQueue   Unbounded, heap-ordered      Priority task scheduling
```

### Thread Pool Sizing

Thread pool sizing is one of the few areas in concurrency where there's an actual mathematical formula. The key insight is that the optimal number of threads depends on the ratio of waiting time to compute time in your tasks. A purely CPU-bound task (like encryption or image processing) gains nothing from more threads than CPU cores — extra threads just cause context switching overhead. An I/O-bound task (like calling a REST API or querying a database) spends most of its time waiting, and during that wait, the CPU is idle. More threads let you overlap the waiting periods, keeping the CPU busy.

The formula below comes from Brian Goetz's *Java Concurrency in Practice* and is the standard starting point for production sizing. But remember: it's a starting point, not an answer. Real workloads are mixed (some tasks CPU-bound, some I/O-bound), downstream systems have their own limits (database connection pools, rate limiters), and the formula doesn't account for GC pauses, JIT compilation bursts, or memory pressure. Always measure under realistic load.

```
CPU-BOUND tasks (computation, no I/O waits):
    threads = N_cpu + 1
    (N_cpu = Runtime.getRuntime().availableProcessors())
    +1 to utilize CPU during occasional page fault

I/O-BOUND tasks (HTTP calls, DB queries, file I/O):
    threads = N_cpu * (1 + W/C)
    W = average wait time (I/O)
    C = average compute time

    Example: REST API that spends 90ms waiting for DB, 10ms computing
    W/C = 90/10 = 9
    threads = 8 * (1 + 9) = 80

    But also limited by downstream:
    If DB max connections = 20, don't use 80 threads
```

### Rejection Policies

```
Policy              Behavior                         When to use
──────────────────────────────────────────────────────────────────
AbortPolicy         Throws RejectedExecutionException  Fail fast (default)
CallerRunsPolicy    Caller's thread runs the task      Backpressure (recommended!)
DiscardPolicy       Silently drops the task            Never (data loss)
DiscardOldestPolicy Drops oldest queued task           Rarely (stale data ok)
Custom              Implement RejectedExecutionHandler  Metrics + backpressure
```

**`CallerRunsPolicy` is usually the best choice** — it slows down the producer when the pool is saturated, creating natural backpressure.

---

## 7. ForkJoinPool — Work Stealing Algorithm

The `ForkJoinPool` is designed for a specific class of problems: tasks that can be recursively divided into smaller subtasks, processed in parallel, and then combined. This is the **divide and conquer** pattern — the same algorithm pattern as merge sort, parallel map-reduce, and recursive tree traversal. The key innovation is the **work-stealing** scheduling algorithm: each worker thread has its own double-ended queue (deque), and when a worker runs out of tasks, it "steals" work from another worker's deque rather than going idle.

Why does work-stealing matter? In a traditional thread pool, all tasks share a single queue, and every enqueue/dequeue operation is a contention point. In ForkJoinPool, each worker primarily interacts with its own deque (no contention), and stealing happens infrequently and from the opposite end of the deque (minimal contention). This design achieves near-linear speedup on multicore CPUs for divide-and-conquer workloads.

ForkJoinPool also serves as the default execution engine for parallel streams and `CompletableFuture.supplyAsync()` — which is both convenient and dangerous, as the shared singleton `commonPool()` becomes a contention point when overused in web applications.

```
ForkJoinPool structure:

┌──────────────────────────────────────────────────┐
│  Worker 0: [task_a, task_b, task_c]  ◄── LIFO    │
│  Worker 1: [task_d]                               │
│  Worker 2: []          ──steal──►  Worker 0 FIFO │
│  Worker 3: [task_e, task_f]                       │
└──────────────────────────────────────────────────┘

Each worker has a DEQUE (double-ended queue):
  - Worker pushes/pops from the TOP (LIFO) — fast, no contention
  - Idle workers steal from the BOTTOM (FIFO) — large tasks first

Why LIFO for own work: most recently forked = smallest subtask = cache-hot
Why FIFO for stealing: oldest = largest chunk = more work to amortize steal cost
```

```java
// Fork/Join pattern
class SumTask extends RecursiveTask<Long> {
    private final int[] arr;
    private final int lo, hi;
    static final int THRESHOLD = 10_000;

    protected Long compute() {
        if (hi - lo <= THRESHOLD) {
            long sum = 0;
            for (int i = lo; i < hi; i++) sum += arr[i];
            return sum;
        }
        int mid = (lo + hi) / 2;
        SumTask left = new SumTask(arr, lo, mid);
        SumTask right = new SumTask(arr, mid, hi);
        left.fork();           // submit to deque — another worker may steal it
        long rightResult = right.compute();  // compute in current thread
        long leftResult = left.join();       // wait for forked task
        return leftResult + rightResult;
    }
}
```

### ForkJoinPool.commonPool() — The Shared Singleton

```java
// ALL of these use the SAME pool:
list.parallelStream().map(...)                    // parallel stream
CompletableFuture.supplyAsync(() -> ...)          // default async
CompletableFuture.runAsync(() -> ...)             // default async

// Common pool size:
Runtime.getRuntime().availableProcessors() - 1
// On an 8-core machine: 7 threads

// In a web app with 200 concurrent requests, all sharing 7 threads → starvation
```

**Fix for parallel streams:**

```java
ForkJoinPool customPool = new ForkJoinPool(16);
List<Result> results = customPool.submit(() ->
    data.parallelStream()
        .map(this::process)
        .collect(toList())
).get();
```

---

## 8. CompletableFuture — Async Composition

`CompletableFuture` (Java 8) is Java's answer to the callback hell problem. Before it, async programming in Java meant either blocking on `Future.get()` (defeating the purpose of async) or hand-managing callbacks with thread pools (error-prone, unreadable, and impossible to compose). `CompletableFuture` provides a fluent API for chaining async operations: "when this completes, do that; when that fails, do this; when both of these complete, combine them."

The mental model is a **pipeline of transformations on a value that may not exist yet**. Each stage in the pipeline runs only when the previous stage completes, and the entire chain is non-blocking — the calling thread submits the first stage and walks away. Results flow forward, exceptions flow through `exceptionally()` or `handle()`, and the library manages all the thread scheduling and completion callbacks.

The most important production rule: **always specify your own executor**. The default behavior runs stages on `ForkJoinPool.commonPool()`, which is shared by every `CompletableFuture` and every parallel stream in your JVM. In a web server handling hundreds of requests, this leads to thread starvation. Always pass a dedicated `ExecutorService` to the `Async` variants.

### Core Patterns

```java
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchUser())              // runs on ForkJoinPool.commonPool()
    .thenApply(user -> user.getName())            // transform (like map)
    .thenCompose(name -> fetchProfile(name))      // flatMap (returns another CF)
    .thenCombine(fetchConfig(), (profile, config) -> merge(profile, config))
    .exceptionally(ex -> fallbackValue())         // recover from exception
    .orTimeout(5, TimeUnit.SECONDS)               // Java 9+: timeout
    .completeOnTimeout(defaultVal, 5, TimeUnit.SECONDS); // Java 9+: default on timeout
```

### thenApply vs thenCompose (map vs flatMap)

This distinction is identical to `map` vs `flatMap` on `Optional` and `Stream`, and understanding it is the key to composing async pipelines without creating nested `CompletableFuture<CompletableFuture<T>>` types. Use `thenApply` when your transformation is synchronous (takes a value, returns a value). Use `thenCompose` when your transformation is itself asynchronous (takes a value, returns a `CompletableFuture`).

```java
// thenApply: T → U (synchronous transform)
CompletableFuture<String> name = fetchUser().thenApply(User::getName);
// Type: CF<User> → CF<String>

// thenCompose: T → CF<U> (async chain — like flatMap)
CompletableFuture<Profile> profile = fetchUser().thenCompose(user -> fetchProfile(user.getId()));
// Type: CF<User> → CF<Profile>

// If you used thenApply with an async function:
CompletableFuture<CompletableFuture<Profile>> nested = fetchUser().thenApply(user -> fetchProfile(user.getId()));
// → CF<CF<Profile>> — wrong! Use thenCompose to flatten
```

### Async Variants

```java
// thenApply:      runs on SAME thread that completed the previous stage
// thenApplyAsync: runs on ForkJoinPool.commonPool() (or provided executor)

cf.thenApply(x -> transform(x));                        // same thread
cf.thenApplyAsync(x -> transform(x));                   // commonPool thread
cf.thenApplyAsync(x -> transform(x), myExecutor);       // your executor
```

**Production rule: ALWAYS pass your own executor in production code.** Don't let business logic compete for the common pool.

### Combining and Error Handling

```java
// allOf — wait for all (returns CF<Void>)
CompletableFuture<Void> all = CompletableFuture.allOf(cf1, cf2, cf3);
all.thenRun(() -> {
    String r1 = cf1.join();  // safe — all completed
    String r2 = cf2.join();
    String r3 = cf3.join();
});

// anyOf — first to complete (returns CF<Object>)
CompletableFuture<Object> any = CompletableFuture.anyOf(cf1, cf2, cf3);

// Error handling
cf.handle((result, ex) -> {
    if (ex != null) return fallback;
    return process(result);
});

cf.whenComplete((result, ex) -> {
    // observe result/exception but don't transform
    // used for logging, metrics, cleanup
});
```

---

## 9. Concurrent Collections — Lock-Free and Segmented Designs

The collections in `java.util.concurrent` are designed from the ground up for multithreaded access — they're not thread-safe wrappers around regular collections (which is what `Collections.synchronizedMap()` gives you). Each concurrent collection uses a different strategy optimized for its access pattern: `ConcurrentHashMap` uses per-bucket locking and lock-free reads, `CopyOnWriteArrayList` uses snapshot isolation for reads, and `BlockingQueue` implementations use condition variables for producer-consumer coordination.

The crucial insight is that "thread-safe" doesn't mean "correct under concurrent use." A `ConcurrentHashMap` guarantees that `put()` and `get()` won't corrupt the data structure, but it does NOT guarantee that `if (!map.containsKey(key)) { map.put(key, value); }` is atomic — another thread can insert between the check and the put. This check-then-act pattern is the #1 source of bugs when using concurrent collections. Use atomic compound operations like `putIfAbsent()`, `computeIfAbsent()`, and `merge()` instead.

### ConcurrentHashMap — Java 8+ Internals

`ConcurrentHashMap` is the workhorse of concurrent Java — used for caches, lookup tables, counters, and virtually any shared key-value mapping. Its Java 8+ implementation is a masterpiece of concurrent engineering. Unlike its predecessor (which used segmented locking with a fixed 16 segments), the Java 8 version uses per-bucket synchronization: each bucket in the hash table can be locked independently, so threads modifying different buckets never contend with each other. Empty-bucket insertions are even better — they use lock-free CAS, which means the most common operation (inserting into an empty slot) requires no synchronization at all.

```
Structure:
    Node<K,V>[] table;    // bucket array (volatile)
    int sizeCtl;          // controls initialization and resizing

Bucket states:
    null         → empty
    Node         → linked list (≤8 entries)
    TreeNode     → red-black tree (>8 entries)
    ForwardingNode → resize in progress (this bucket already moved)

┌────┬────┬────┬────┬────┬────┬────┬────┐
│null│ N  │null│ T  │ FW │ N  │null│ N  │  table[]
└────┴──┬─┴────┴──┬─┴──┬─┴──┬─┴────┴──┬─┘
        ▼         ▼    │    ▼         ▼
       [A→B]    tree   │   [E→F]    [G]
                       ▼
                  forwarding
                  (resize)
```

```
Put operation (Java 8+):

1. hash = spread(key.hashCode())     // (h ^ (h >>> 16)) & 0x7fffffff
2. index = hash & (table.length - 1)
3. If bucket is empty:
     CAS null → new Node          // lock-free insertion!
4. If bucket has entries:
     synchronized (first_node) {   // lock ONLY this bucket's head node
         if linked list: traverse, insert/update
         if tree: tree insert
     }
5. If list length > TREEIFY_THRESHOLD (8):
     treeifyBin — convert to red-black tree
6. addCount — increment size (uses LongAdder-style striped counters)

KEY INSIGHT: no global lock. Different buckets are modified concurrently.
Only contention is two threads hitting the SAME bucket.
```

**The size() trap:**

```java
ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
// map.size() is an ESTIMATE during concurrent modifications
// It sums striped counter cells — which may be stale
// For exact count, map.mappingCount() returns a long (handles >Integer.MAX_VALUE)
// But even mappingCount is approximate under concurrent writes
```

**Atomic compound operations:**

```java
// WRONG — check-then-act is not atomic:
if (!map.containsKey(key)) {
    map.put(key, value);  // another thread may put between check and put
}

// RIGHT — atomic compound operations:
map.putIfAbsent(key, value);
map.computeIfAbsent(key, k -> expensiveCompute(k));
map.compute(key, (k, v) -> v == null ? 1 : v + 1);  // atomic increment
map.merge(key, 1, Integer::sum);                      // atomic merge
```

### CopyOnWriteArrayList

`CopyOnWriteArrayList` uses a radical strategy: every write operation (add, set, remove) creates a **complete copy** of the internal array, modifies the copy, and atomically swaps the reference. Readers never synchronize — they see a consistent snapshot of the array at the time they started reading, even if a write happens concurrently. This means iteration never throws `ConcurrentModificationException`, and read performance is identical to a regular `ArrayList`.

The obvious cost is writes: every modification allocates a new array and copies all elements, which is O(n) and creates garbage for the GC. This makes `CopyOnWriteArrayList` ideal for situations where reads vastly outnumber writes — like listener lists, observer patterns, configuration snapshots, and feature flag sets. It's terrible for write-heavy workloads.

```
Write:                              Read:
  1. Lock (ReentrantLock)             1. Read volatile array reference
  2. Copy entire array                2. Iterate over snapshot
  3. Modify copy                      (no locking needed!)
  4. Swap volatile reference
  5. Unlock                           Even if a write happens during
                                      iteration, reader sees old array

┌──────────────────┐     write     ┌──────────────────┐
│ [A, B, C]        │  ──────────►  │ [A, B, C, D]     │
│ (old array)      │  (copy+add)   │ (new array)      │
└──────────────────┘               └──────────────────┘
     ▲                                    ▲
     │ readers still see this             │ new readers see this
     │ (snapshot)                         │ (after volatile swap)
```

**Use case:** Event listener lists, observer patterns — writes are rare, reads are frequent.

### BlockingQueue — Producer-Consumer Backbone

The producer-consumer pattern is the most fundamental concurrency pattern in software engineering: one or more threads produce work items, and one or more threads consume them. The `BlockingQueue` interface is the abstraction that makes this pattern safe, efficient, and simple. Its `put()` method blocks when the queue is full (creating backpressure on producers), and its `take()` method blocks when the queue is empty (suspending consumers until work arrives). This is literally how `ThreadPoolExecutor` works internally: worker threads sit in a loop calling `workQueue.take()`.

The choice of `BlockingQueue` implementation dramatically affects your system's behavior. `ArrayBlockingQueue` is bounded and uses a single lock (simpler, but producers and consumers contend). `LinkedBlockingQueue` uses separate locks for producers and consumers (higher throughput, because they don't contend). `SynchronousQueue` has zero capacity — every `put()` blocks until a `take()` is ready (direct handoff, used by `CachedThreadPool`). Choosing the wrong queue type is a common source of production problems.

```java
// The foundation of all thread pools:
BlockingQueue<Runnable> queue = new ArrayBlockingQueue<>(100);

// Producer:
queue.put(task);    // BLOCKS if queue full — natural backpressure

// Consumer:
Runnable task = queue.take();  // BLOCKS if queue empty — waits for work

// This is literally how ThreadPoolExecutor works:
// Worker threads call: task = workQueue.take() in a loop
```

```
ArrayBlockingQueue:
  Single array, two locks (takeLock + putLock in LinkedBlockingQueue)
  Actually uses ONE ReentrantLock in ArrayBlockingQueue
  Two Conditions: notEmpty (for take) and notFull (for put)

LinkedBlockingQueue:
  Separate takeLock and putLock → higher throughput
  Because producers and consumers don't contend

SynchronousQueue:
  No capacity at all
  put() blocks until take() is called (or vice versa)
  Direct handoff — used by CachedThreadPool
```

---

## 10. Common Concurrency Bugs and How to Find Them

Concurrency bugs are the hardest bugs to find, reproduce, and fix. They're timing-dependent: a race condition might occur once in a million executions, and adding a print statement or a debugger breakpoint changes the timing enough to make it disappear (the **Heisenbug** phenomenon). They're non-deterministic: the same code with the same inputs can produce different results on different runs. And they're often silent: a data race doesn't throw an exception — it just reads a stale or partially-written value, and the program continues with subtly wrong data.

The patterns below represent the vast majority of concurrency bugs seen in production Java applications. If you learn to recognize these patterns in code review, you'll prevent more bugs than any testing framework could catch.

### Race Condition: Check-Then-Act

This is the most common concurrency bug pattern. The fundamental problem is that two operations that need to be atomic (check, then act on the check) are performed separately, and another thread can change the state between them. The check becomes stale the instant another thread modifies the state — but your code acts on the stale information as if it were still true.

```java
// BROKEN:
if (map.containsKey(key)) {
    return map.get(key);   // another thread may remove key between check and get
}

// FIX:
Value v = map.get(key);    // single atomic read
if (v != null) return v;
```

### Race Condition: Read-Modify-Write

The second most common pattern: an operation that reads a value, computes a new value based on it, and writes the result back. `count++` is the canonical example, but any operation of the form "read the current state, decide what to do, update the state" is vulnerable. Between your read and your write, another thread can do its own read-modify-write, and one of the updates is lost (the **lost update** problem).

```java
// BROKEN:
count++;   // read, increment, write — not atomic

// FIX:
atomicCount.incrementAndGet();  // CAS loop — atomic
```

### Thread Starvation

Thread starvation is a deadlock variant where no circular lock dependency exists, but the system still stops making progress because all available threads are blocked waiting for work that can only be performed by threads in the same pool. This is especially common when a task submitted to a thread pool submits another task to the same pool and then blocks waiting for it. If the pool is full, the inner task can never start because there are no free threads, and the outer task can never complete because it's waiting for the inner task. The system is logically deadlocked even though no locks are involved.

```java
// All pool threads blocked on I/O, no threads left for new tasks:
ExecutorService pool = Executors.newFixedThreadPool(2);

pool.submit(() -> {
    Future<?> f = pool.submit(() -> "inner");  // needs a pool thread!
    return f.get();  // BLOCKS — waiting for inner task, but no threads available
});
// DEADLOCK: outer task holds one thread, waits for inner task
// inner task needs a thread but pool is full
```

**Fix:** Never submit to your own pool from within a task, or use separate pools.

### How to Debug Concurrency Issues

When a concurrency issue occurs in production, you need tools and techniques that can capture the state of all threads at the moment of the problem. A thread dump is your first tool: it shows every thread's state (RUNNABLE, BLOCKED, WAITING, TIMED_WAITING), the lock it's waiting for (if any), the lock it holds (if any), and the full stack trace. Modern JVMs can detect deadlocks automatically and report them in the thread dump. For intermittent issues, Java Flight Recorder (JFR) and async-profiler can capture lock contention events over time without significant performance impact.

```bash
# Thread dump (shows deadlocks, blocked threads, stack traces):
jstack <pid>
# or
jcmd <pid> Thread.print

# Detect deadlocks programmatically:
ThreadMXBean tmx = ManagementFactory.getThreadMXBean();
long[] deadlocked = tmx.findDeadlockedThreads();

# Stress test with jcstress (OpenJDK concurrency stress testing):
# https://github.com/openjdk/jcstress
```

### Concurrency Decision Table

This table is your quick reference for choosing the right concurrency primitive. The most common mistake is reaching for a more complex tool than needed — using `ReentrantLock` when `synchronized` would suffice, or using `ConcurrentHashMap.compute()` when a simple `AtomicInteger` would do. Start with the simplest primitive that meets your requirements, and escalate only when you have a measured performance problem.

```
Scenario                        Use This
──────────────────────────────────────────────────────
Simple counter                  AtomicInteger / LongAdder
Flag / state indicator          volatile boolean
Protect multi-step operation    synchronized or ReentrantLock
Read-heavy, rare writes         ReadWriteLock or StampedLock
Producer-consumer               BlockingQueue
Cache / shared map              ConcurrentHashMap
Listener list                   CopyOnWriteArrayList
Async composition               CompletableFuture
Parallel bulk operation         parallelStream (with custom pool)
Millions of blocking tasks      Virtual threads (Java 21+)
```

---

*After this phase: you can read a thread dump and immediately spot the deadlock. You can explain why a volatile counter loses increments. You can size a thread pool for your exact workload. You can tell your team why their ConcurrentHashMap usage has a race condition. That's concurrency mastery.*
