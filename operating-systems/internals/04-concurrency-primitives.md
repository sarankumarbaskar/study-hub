# Phase 4 — Concurrency Primitives: How the Kernel Implements Locks

> When your Java code uses `synchronized`, `ReentrantLock`, or `Semaphore`, these ultimately map to OS-level primitives. Understanding the OS layer explains why uncontested locks are fast, why contended locks are slow, and how the JVM's lock escalation (biased → lightweight → heavyweight) actually works.

Your Java Concurrency knowledge (Phase 2 of Java Internals) explained locks from the Java perspective. This phase explains what happens BELOW that — in the kernel and the CPU — when your threads compete for resources.

---

## 1. The Fundamental Problem — Why We Need Synchronization

Multiple threads sharing memory can corrupt data without synchronization:

```
UNSYNCHRONIZED INCREMENT (the classic race):

  Thread A                          Thread B
  ────────                          ────────
  LOAD count (0) into register      
                                    LOAD count (0) into register
  ADD 1 → register = 1             
                                    ADD 1 → register = 1
  STORE register → count = 1       
                                    STORE register → count = 1

  Expected: count = 2
  Actual:   count = 1 (LOST UPDATE)
  
  The CPU doesn't execute "count++" atomically — it's three separate operations
  (load, add, store), and another thread can interleave between any two of them.

FIX 1: Atomic instruction (CAS — Compare And Swap)
  lock cmpxchg [count], newval   (x86 instruction — atomic read-modify-write)
  If count == expected: count = newval, return success
  If count != expected: return failure, retry with new value
  → Java's AtomicInteger.incrementAndGet() uses this

FIX 2: Lock (mutual exclusion)
  Ensure only ONE thread at a time executes the critical section
  → Java's synchronized and ReentrantLock use this (backed by futex on Linux)
```

---

## 2. Futex — The Foundation of Everything

### What Futex Is

**Futex (Fast User-space Mutex)** is the Linux primitive that ALL high-level synchronization (mutex, semaphore, condition variable, reader-writer lock, Java synchronized, Java ReentrantLock) is built on. Its brilliance: the **common case** (no contention) is handled entirely in user space with a single atomic instruction — no kernel involvement, no syscall, no context switch. The kernel is ONLY involved when there's actual contention (a thread must wait for another).

```
HOW FUTEX WORKS:

User space: integer variable (the futex word) at a known memory address

ACQUIRE (lock):
  1. Atomic CAS: try to change futex word from 0 (unlocked) to 1 (locked)
  2. If CAS succeeds: LOCKED! No syscall. ~10ns. Done.
  3. If CAS fails (someone else holds it):
     → syscall: futex(FUTEX_WAIT, &futex_word, 1)
     → kernel puts this thread to SLEEP on a wait queue keyed by the futex address
     → thread is removed from CPU run queue → no CPU wasted

RELEASE (unlock):
  1. Atomic: set futex word from 1 to 0
  2. If anyone was waiting:
     → syscall: futex(FUTEX_WAKE, &futex_word, 1)
     → kernel wakes ONE sleeping thread
     → woken thread retries the CAS

PERFORMANCE BREAKDOWN:
  Uncontested lock (no other thread wants it):
    1 CAS instruction = ~10-20 nanoseconds. NO SYSCALL. 
    This is why "locks are slow" is a myth for uncontested cases.
  
  Contested lock (another thread holds it):
    CAS fails → futex syscall → kernel sleep → wake → retry CAS
    = ~1-10 microseconds (context switch + kernel scheduling)
    This is why CONTENTION is what makes locks slow, not locks themselves.

THIS IS WHAT JAVA's LOCKING MAPS TO:
  Biased lock:       no atomic operation (just check thread ID)
  Lightweight lock:  CAS on object header (user-space, like futex fast path)
  Heavyweight lock:  futex syscall (kernel sleep when contended)
```

---

## 3. Mutex (Mutual Exclusion) — One Thread at a Time

```
WHAT: only ONE thread can hold the mutex at a time
BEHIND THE SCENES: built on futex

  pthread_mutex_lock(&mutex):
    1. Try CAS (futex fast path) → if success: locked, return
    2. If fail: spin briefly (adaptive spinning — ~100 iterations)
       → CAS may succeed if the holder releases quickly
    3. If still fail: futex(FUTEX_WAIT) → sleep in kernel

  pthread_mutex_unlock(&mutex):
    1. Set mutex to unlocked (atomic)
    2. If waiters exist: futex(FUTEX_WAKE, 1) → wake one waiter

ADAPTIVE SPINNING:
  Before sleeping (expensive: ~5μs for context switch + wake):
  The thread spins (busy-waits) for a short time
  If the lock holder is currently running on another core:
    It might release the lock in the next few hundred nanoseconds
    Spinning is CHEAPER than sleeping + waking
  If the lock holder is NOT running (sleeping, waiting):
    Spinning is wasted CPU → go to sleep immediately
  
  Linux's adaptive mutex checks: "is the lock holder currently on a CPU?"
  If yes: spin. If no: sleep immediately.

JAVA MAPPING:
  synchronized → ObjectMonitor → pthread_mutex → futex
  ReentrantLock → AQS → LockSupport.park() → futex
```

---

## 4. Spinlock — Busy Waiting (Kernel Use Only)

```
WHAT: thread loops ("spins") checking the lock, never sleeps

  while (!atomic_try_lock(&spinlock)) {
      // CPU is running this loop at full speed
      // doing NOTHING useful, burning CPU cycles
      cpu_relax();  // hint to CPU: "I'm spinning" (reduces power, avoids starving pipeline)
  }
  // lock acquired

WHY SPINLOCKS EXIST (in the kernel):
  Context switch cost: ~5μs
  Spinlock cost for short critical section: ~0.1μs
  If the critical section is shorter than a context switch:
    Spinning is FASTER than sleeping and waking
  
  Kernel uses spinlocks for very short critical sections:
    Updating a linked list node, incrementing a counter, checking a flag
    These take ~10-100ns → spinning wins over sleeping

WHY NOT IN USER SPACE:
  If the lock holder is preempted by the scheduler (time slice expired):
    The spinner waits for the ENTIRE time slice (~1-10ms) doing nothing
    The lock holder is sleeping, can't release the lock
    = wasted CPU for milliseconds
  
  In kernel mode: interrupts can be disabled → lock holder won't be preempted
  In user mode: you CAN be preempted → spinlocks are dangerous

JAVA: Thread.onSpinWait() (Java 9+)
  JVM hint for spin-wait loops: uses PAUSE instruction on x86
  Reduces power consumption and avoids pipeline stalls during spinning
  Used internally by adaptive spinning in ReentrantLock
```

---

## 5. Semaphore — Counting Access

```
WHAT: allows UP TO N threads to enter simultaneously

  Semaphore sem = new Semaphore(N);  // N permits
  
  sem.acquire():  // decrement count. If count < 0: BLOCK
  sem.release();  // increment count. If waiters: WAKE one

BEHIND THE SCENES:
  Atomic counter + futex wait queue
  acquire(): atomic decrement → if result >= 0: enter. If < 0: futex sleep.
  release(): atomic increment → if waiters: futex wake.

USE CASES:
  Connection pool: Semaphore(20) → max 20 DB connections simultaneously
  Rate limiter: Semaphore(100) → max 100 concurrent requests
  Resource pool: Semaphore(N) → max N threads accessing a shared resource

MUTEX vs SEMAPHORE:
  Mutex: binary (0 or 1), has OWNERSHIP (only the holder can release)
  Semaphore: counting (0 to N), NO ownership (any thread can release)
  
  Mutex is for mutual exclusion (protecting critical sections)
  Semaphore is for resource counting (limiting concurrent access)
```

---

## 6. Condition Variables — Coordinating Threads

```
WHAT: allows threads to WAIT for a condition and be WOKEN when it changes

PATTERN (producer-consumer):
  CONSUMER:
    pthread_mutex_lock(&mutex);
    while (queue_empty()) {                    // ALWAYS use while, not if!
        pthread_cond_wait(&cond, &mutex);      // atomically: release mutex + sleep
    }                                          // on wake: reacquire mutex
    item = dequeue();
    pthread_mutex_unlock(&mutex);

  PRODUCER:
    pthread_mutex_lock(&mutex);
    enqueue(item);
    pthread_cond_signal(&cond);                // wake ONE waiter
    pthread_mutex_unlock(&mutex);

BEHIND THE SCENES:
  pthread_cond_wait():
    1. Release the mutex (atomically with sleep)
    2. futex(FUTEX_WAIT) → sleep on condition's wait queue
    3. On wake: reacquire the mutex (may block again if mutex is held)
    4. Return to user code

WHY while() NOT if():
  Spurious wakeups: kernel can wake you without signal (for internal reasons)
  Stolen condition: between signal and mutex reacquisition, another thread may consume the item
  The loop re-checks: is the condition STILL true? If not: go back to sleep.

JAVA MAPPING:
  Object.wait()        → pthread_cond_wait() → futex
  Object.notify()      → pthread_cond_signal() → futex
  Object.notifyAll()   → pthread_cond_broadcast() → futex (wake ALL)
  Condition.await()    → same, but with named conditions (multiple wait sets per lock)
```

---

## 7. Reader-Writer Locks — Read-Heavy Optimization

```
WHAT: multiple threads can READ simultaneously, but WRITING requires exclusive access

  READ LOCK:  if no writer holds or waits → acquire (multiple readers allowed)
  WRITE LOCK: if no reader and no writer → acquire (exclusive)

BEHIND THE SCENES:
  Counter for readers + flag for writer + futex for waiting
  Read lock: atomic increment reader count → if no writer: enter
  Write lock: set writer flag → wait for reader count to reach 0
  
  Writer starvation: continuous stream of readers → writer never gets in
  Fix: once a writer is WAITING, new readers also wait (fair RW lock)

JAVA MAPPING:
  ReadWriteLock → ReentrantReadWriteLock → AQS (uses a single int: 
    upper 16 bits = read count, lower 16 bits = write count)
  StampedLock → optimistic reads (no lock at all, just a version check)

USE CASES:
  Configuration objects: read 1000x/sec, updated 1x/min → RW lock
  Routing tables: read by every request, updated by config change
  Cache structures: read by many threads, invalidated occasionally
```

---

## 8. Deadlock at the OS Level

```
WHAT: two or more threads each hold a lock the other needs → NOBODY can proceed

  Thread A: holds Lock 1, waiting for Lock 2
  Thread B: holds Lock 2, waiting for Lock 1
  → DEADLOCK: neither can make progress. System hangs.

FOUR CONDITIONS (ALL must hold for deadlock):
  1. Mutual exclusion: lock is held by one thread
  2. Hold and wait: thread holds one lock while waiting for another
  3. No preemption: locks can't be forcibly taken from a thread
  4. Circular wait: A→B→C→A dependency cycle

THE KERNEL DOES NOT DETECT APPLICATION DEADLOCKS.
  It's YOUR responsibility. The kernel has no idea which user-space locks exist.
  
  (The kernel DOES handle internal kernel deadlocks in its own code with
   lockdep — a lock dependency validator that detects potential deadlocks
   at development time by building a lock ordering graph.)

PREVENTION:
  Lock ordering: always acquire locks in the same global order
  Timeout: tryLock with timeout → give up if can't acquire within N seconds
  Avoid nested locks: restructure code to hold only one lock at a time
  
DETECTION IN JAVA:
  Thread dump (jstack): shows "Found one Java-level deadlock"
  ThreadMXBean.findDeadlockedThreads(): programmatic detection
  
DETECTION IN PRODUCTION:
  Set lock acquisition timeouts on ALL locks
  Log when timeout occurs (includes which lock and which thread)
  Alert on timeout frequency → investigate deadlock potential
```

---

*After this phase: you understand how futex makes uncontested locks nearly free (~10ns). You can explain why spinlocks work in the kernel but not in user space. You know how Java's synchronized, ReentrantLock, and ReadWriteLock map to OS primitives. You can diagnose and prevent deadlocks.*
