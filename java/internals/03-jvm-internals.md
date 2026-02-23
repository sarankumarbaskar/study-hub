# Phase 3 — JVM Internals: The Complete Deep Dive

> This is what separates "I write Java" from "I understand the machine running my Java."

When your Spring Boot application starts consuming 8GB of heap, pauses for 2 seconds during a garbage collection, or suddenly runs 10x slower because the JIT compiler deoptimized a hot method — you need to understand the machine running your code. This isn't academic knowledge. This is the difference between blindly restarting containers at 3 AM and calmly opening a GC log, identifying that your live data set has grown beyond Old Gen capacity because of a cache that never evicts, and fixing the root cause in 20 minutes.

The JVM is not a simple bytecode interpreter. It's one of the most sophisticated runtime systems ever built — a system that dynamically compiles your code to native machine instructions, manages memory through generational garbage collectors that run concurrently with your application, loads and links classes lazily on demand, and profiles your application's behavior to make increasingly aggressive optimization decisions at runtime. Understanding each of these subsystems — what it does, why it does it that way, and how to observe and tune it — is what makes a Java developer truly dangerous in the best sense of the word.

---

## 1. JVM Architecture — The Big Picture

The JVM consists of three major subsystems that work together to execute your Java bytecode. The **Class Loader Subsystem** finds, loads, verifies, and links class files into the runtime. The **Runtime Data Areas** are the memory regions where the JVM stores everything it needs: the heap (shared objects), thread stacks (per-thread method frames), the method area/metaspace (class metadata), and per-thread program counters. The **Execution Engine** is where bytecode actually runs — it includes an interpreter (for cold code), the C1 and C2 JIT compilers (for hot code), and the garbage collector (for memory management).

Every performance problem you'll ever diagnose maps to one of these subsystems: class loading issues (slow startup, ClassLoader leaks, `ClassNotFoundException`), memory issues (heap pressure, GC pauses, memory leaks, `OutOfMemoryError`), or execution issues (JIT deoptimization, interpreted code running too long, CPU-bound hot loops).

```
┌──────────────────────────────────────────────────────────────────┐
│                          JVM                                      │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐  │
│  │ Class Loader │───►│   Runtime   │    │   Execution Engine   │  │
│  │  Subsystem   │    │ Data Areas  │◄──►│                      │  │
│  └─────────────┘    │             │    │  ┌──────────────┐    │  │
│                      │ ┌─────────┐ │    │  │ Interpreter  │    │  │
│                      │ │ Method  │ │    │  └──────────────┘    │  │
│                      │ │  Area   │ │    │  ┌──────────────┐    │  │
│                      │ ├─────────┤ │    │  │ JIT Compiler │    │  │
│                      │ │  Heap   │ │    │  │  (C1 + C2)   │    │  │
│                      │ ├─────────┤ │    │  └──────────────┘    │  │
│                      │ │  Stack  │ │    │  ┌──────────────┐    │  │
│                      │ │(per thd)│ │    │  │     GC       │    │  │
│                      │ ├─────────┤ │    │  └──────────────┘    │  │
│                      │ │   PC    │ │    └──────────────────────┘  │
│                      │ │Register │ │                              │
│                      │ ├─────────┤ │    ┌──────────────────────┐  │
│                      │ │ Native  │ │    │  Native Method       │  │
│                      │ │ Method  │ │    │  Interface (JNI)     │  │
│                      │ │ Stack   │ │    └──────────────────────┘  │
│                      │ └─────────┘ │                              │
│                      └─────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Class Loading — Bootstrap to Application

Class loading is one of the most under-appreciated parts of the JVM, yet it's responsible for some of the most confusing bugs in Java: the infamous `ClassCastException: Foo cannot be cast to Foo` (same class name, different ClassLoaders), `NoClassDefFoundError` on classes that clearly exist in your JAR, `ClassNotFoundException` in application servers after redeployment, and Metaspace `OutOfMemoryError` from ClassLoader leaks.

The JVM loads classes **lazily** — a class is not loaded until it's first referenced. When your application starts, only the classes needed for the `main` method and its immediate dependencies are loaded. As execution proceeds and new types are encountered, the JVM loads them on demand. This is why a `ClassNotFoundException` might not appear until a rarely-executed code path is triggered in production.

The delegation model exists for a fundamental reason: **security and consistency**. Without it, a malicious application could create its own `java.lang.String` class with a backdoor. Parent delegation ensures that core Java classes (`java.lang.*`, `java.util.*`) are always loaded by the Bootstrap ClassLoader (written in C/C++, part of the JVM itself), and no user-defined ClassLoader can shadow or replace them.

### The Three-Tier Delegation Model

```
                    ┌─────────────────────────┐
                    │  Bootstrap ClassLoader   │  Written in C/C++
                    │  (rt.jar, java.base)     │  Loads: java.lang.*, java.util.*, etc.
                    └────────────┬────────────┘
                                 │ parent
                    ┌────────────▼────────────┐
                    │  Platform ClassLoader    │  (was Extension ClassLoader)
                    │  (ext/*.jar, modules)    │  Loads: javax.*, java.sql.*, etc.
                    └────────────┬────────────┘
                                 │ parent
                    ┌────────────▼────────────┐
                    │  Application ClassLoader │  (System ClassLoader)
                    │  (classpath)             │  Loads: your classes
                    └────────────┬────────────┘
                                 │ parent
                    ┌────────────▼────────────┐
                    │  Custom ClassLoaders     │  Tomcat, OSGi, etc.
                    └─────────────────────────┘
```

### Parent Delegation — How It Works

```
When Application ClassLoader is asked to load com.myapp.MyClass:

1. Delegate UP: Ask Platform ClassLoader → asks Bootstrap ClassLoader
2. Bootstrap: "I don't have com.myapp.MyClass" → return null
3. Platform: "I don't have it either" → return null
4. Application: "I'll look in classpath" → found! → load and define class

WHY parent delegation:
  - Security: can't replace java.lang.String with malicious version
  - Consistency: same class is always loaded by same loader
  - Prevents duplicate loading
```

### Class Loading Phases

The JVM loads a class through three distinct phases, and understanding the distinction between them explains several common Java puzzles. During **Preparation**, static fields are set to their default values (0, null, false) — NOT the values you assigned in code. The values you wrote are only assigned during **Initialization**, when the `<clinit>` (class initializer) method runs. This is why static field ordering matters: a static field that references another static field that hasn't been initialized yet will see the default value, not the intended value.

The **Initialization** phase has a critical guarantee: the JVM ensures that `<clinit>` runs **exactly once**, and it's internally synchronized. If two threads trigger initialization of the same class simultaneously, one thread initializes while the other blocks. This guarantee is why the static holder pattern works for lazy singletons without any explicit synchronization — the JVM provides the thread safety for free during class initialization.

```
Loading → Linking → Initialization

LOADING:
  1. Find .class file (from JAR, filesystem, network, generated)
  2. Read byte[] of class file
  3. Create java.lang.Class object in Method Area

LINKING:
  a. VERIFICATION:
     - Magic number check (0xCAFEBABE)
     - Bytecode verification (type safety, stack overflow)
     - This is why JVM is "safe" — verified before execution

  b. PREPARATION:
     - Allocate memory for static fields
     - Set default values (0, null, false — NOT initializer values)

  c. RESOLUTION:
     - Resolve symbolic references to direct references
     - Class names → Class objects
     - Method names → method addresses

INITIALIZATION:
  - Execute <clinit> (class initializer)
  - Run static initializers and static field assignments
  - Parent class initialized FIRST (if not already)
  - Thread-safe: JVM ensures <clinit> runs exactly once
    (This is why static holder pattern is safe for singletons)
```

```java
// Initialization order example:
public class Init {
    static int x = 10;          // assigned during INITIALIZATION (not preparation)
    static int y;               // 0 after preparation, then assigned in static block

    static {
        y = x * 2;              // y = 20
    }
}

// PREPARATION:  x = 0, y = 0 (default int values)
// INITIALIZATION: x = 10, then static block: y = 20
```

### Class Identity = ClassLoader + Fully Qualified Name

This is one of the most confusing aspects of the JVM, and it's the root cause of the "cannot be cast to itself" bug that plagues application servers. In the JVM, a class is uniquely identified by the combination of its fully qualified name AND the ClassLoader that loaded it. Two classes with the same name `com.example.Foo`, loaded by two different ClassLoaders, are completely different types — they cannot be cast to each other, cannot be assigned to each other's variables, and `instanceof` will return false between them. This happens in practice when an application server uses one ClassLoader per deployed application, and a shared library is accidentally loaded by both the server's ClassLoader and the app's ClassLoader.

```java
// Two classes with the same name loaded by different ClassLoaders are DIFFERENT types:
ClassLoader cl1 = new URLClassLoader(urls);
ClassLoader cl2 = new URLClassLoader(urls);

Class<?> c1 = cl1.loadClass("com.example.Foo");
Class<?> c2 = cl2.loadClass("com.example.Foo");

c1 == c2;  // FALSE — different ClassLoader = different Class object
c1.cast(c2.newInstance());  // ClassCastException!

// This is the root cause of "ClassCastException: Foo cannot be cast to Foo"
// Common in application servers with complex ClassLoader hierarchies
```

---

## 3. Memory Layout — Heap, Stack, Metaspace

Understanding how the JVM organizes memory is the foundation of everything that follows — garbage collection, performance tuning, memory leak diagnosis, and even thread safety reasoning. The JVM divides memory into regions with fundamentally different characteristics.

The **Heap** is the shared memory region where all Java objects live. Every `new` keyword allocates space on the heap. It's managed by the garbage collector, shared across all threads, and is the source of most memory problems (leaks, GC pauses, `OutOfMemoryError`). The heap is further divided into generational spaces (Young/Old) because objects have vastly different lifetimes, and optimizing for short-lived objects (the majority) dramatically reduces GC overhead.

The **Stack** is per-thread private memory. Every time a method is called, a new **stack frame** is pushed onto the calling thread's stack. The frame holds local variables, the operand stack (a scratch pad for bytecode operations), and metadata like the return address. When the method returns, the frame is popped and its memory is instantly reclaimed — no garbage collection needed. This is why local variables are cheap and why stack allocation (via escape analysis) is one of the JIT compiler's most powerful optimizations.

**Metaspace** (Java 8+, replacing PermGen) holds class metadata: bytecode, method descriptors, constant pools, and annotation data. It lives in native memory (not the Java heap), grows dynamically, and is only reclaimed when the ClassLoader that loaded the class is garbage collected. This is why application redeployments in servlet containers can cause Metaspace leaks — if any reference holds the old ClassLoader alive, none of its classes can be unloaded.

### Runtime Data Areas

```
PER-THREAD:                          SHARED:
┌──────────────────┐                 ┌──────────────────┐
│   JVM Stack      │                 │      Heap        │
│  ┌────────────┐  │                 │  ┌────────────┐  │
│  │ Frame n    │  │                 │  │ Young Gen   │  │
│  │  locals[]  │  │                 │  │ ┌────────┐ │  │
│  │  operand   │  │                 │  │ │ Eden   │ │  │
│  │   stack    │  │                 │  │ ├────────┤ │  │
│  ├────────────┤  │                 │  │ │ S0     │ │  │
│  │ Frame n-1  │  │                 │  │ ├────────┤ │  │
│  │  ...       │  │                 │  │ │ S1     │ │  │
│  ├────────────┤  │                 │  │ └────────┘ │  │
│  │ Frame 0    │  │                 │  ├────────────┤  │
│  └────────────┘  │                 │  │ Old Gen    │  │
│                  │                 │  └────────────┘  │
│   PC Register    │                 ├──────────────────┤
│                  │                 │   Metaspace      │
│   Native Method  │                 │  (class metadata,│
│   Stack          │                 │   method data,   │
└──────────────────┘                 │   constant pool) │
                                     └──────────────────┘
```

### Stack Frame — What Happens When You Call a Method

Every method call in Java pushes a new frame onto the calling thread's stack, and every return pops it. This is the mechanism behind recursion (each recursive call gets its own frame), `StackOverflowError` (the stack runs out of space from too many nested calls — default stack size is ~512KB to 1MB), and the fundamental thread safety of local variables (each thread has its own stack, so local variables are inherently thread-private — they never need synchronization).

The JVM is a **stack machine**: bytecode instructions operate by pushing and popping values on the operand stack within each frame. When you write `x = a + b`, the bytecode pushes `a`, pushes `b`, adds (pops both, pushes result), and stores the result into `x`'s slot in the local variable array. This is different from register-based architectures (like modern CPUs) — the JIT compiler translates these stack operations into register-based machine code when it compiles the method.

```
Every method call creates a new stack frame:

┌─────────────────────────────────────┐
│  Stack Frame for method foo()        │
│                                      │
│  ┌──────────────────────┐           │
│  │ Local Variable Array  │           │
│  │  [0] = this           │  (for instance methods)
│  │  [1] = param1         │           │
│  │  [2] = param2         │           │
│  │  [3] = localVar1      │           │
│  └──────────────────────┘           │
│                                      │
│  ┌──────────────────────┐           │
│  │ Operand Stack         │           │
│  │  (computation scratch │           │
│  │   pad — push/pop)     │           │
│  └──────────────────────┘           │
│                                      │
│  ┌──────────────────────┐           │
│  │ Frame Data            │           │
│  │  - return address     │           │
│  │  - constant pool ref  │           │
│  │  - exception table    │           │
│  └──────────────────────┘           │
└─────────────────────────────────────┘
```

```java
// How x = a + b compiles to stack operations:
int x = a + b;

// Bytecode:
iload_1      // push a onto operand stack
iload_2      // push b onto operand stack
iadd         // pop both, add, push result
istore_3     // pop result into local variable slot 3 (x)
```

### Object Memory Layout

Understanding object layout is critical for reasoning about memory consumption. Java developers routinely underestimate how much memory their objects consume because they think in terms of the data they store, not the overhead the JVM adds. An `Integer` that wraps a 4-byte `int` actually consumes 16 bytes (4x overhead). A `Boolean` wrapping 1 bit of data consumes 16 bytes (128x overhead). An empty `HashMap` with default capacity consumes ~128 bytes before you store anything. When you have millions of small objects — nodes in a graph, entries in a cache, elements in a financial model — this overhead dominates your memory profile.

```
Every object on the heap:

┌───────────────────────────────────────┐
│           Object Header               │
│  ┌─────────────────────────────────┐  │
│  │ Mark Word (64 bits)             │  │  Lock state, hashCode, GC age
│  ├─────────────────────────────────┤  │
│  │ Klass Pointer (32/64 bits)      │  │  Pointer to class metadata
│  ├─────────────────────────────────┤  │
│  │ Array Length (32 bits)          │  │  Only for arrays
│  └─────────────────────────────────┘  │
├───────────────────────────────────────┤
│           Instance Fields             │
│  Fields are ordered by size:          │
│  longs/doubles → ints/floats →        │
│  shorts/chars → bytes/booleans →      │
│  references                           │
│  (to minimize padding waste)          │
├───────────────────────────────────────┤
│           Padding                     │
│  (align to 8-byte boundary)           │
└───────────────────────────────────────┘

Example - new Object():
  Mark Word:     8 bytes
  Klass Pointer: 4 bytes (compressed oops)
  Padding:       4 bytes (align to 8)
  TOTAL:         16 bytes (just for an empty object!)

Example - new Integer(42):
  Mark Word:     8 bytes
  Klass Pointer: 4 bytes
  int value:     4 bytes
  TOTAL:         16 bytes (to store 4 bytes of data)

This is why primitives are faster: int = 4 bytes on stack
                                    Integer = 16 bytes on heap + pointer
```

### Metaspace (Java 8+, replaces PermGen)

Metaspace replaced PermGen in Java 8, and this was more than a rename — it was a fundamental architectural change. PermGen was a fixed-size region on the Java heap, which meant class metadata competed with your application objects for heap space, and the dreaded `java.lang.OutOfMemoryError: PermGen space` was a constant headache, especially in application servers with frequent redeployments. Metaspace lives in native memory (allocated directly from the OS), grows dynamically as needed, and is only collected when entire ClassLoaders become unreachable. This eliminated the PermGen sizing problem but introduced a new one: Metaspace can grow without bound unless you set `-XX:MaxMetaspaceSize`, and ClassLoader leaks can silently consume native memory until the OS kills your process.

```
Metaspace stores:
  - Class metadata (bytecode, field/method descriptors)
  - Method code (before JIT compilation)
  - Constant pool (string literals, class references)
  - Annotations

Key differences from PermGen:
  - Lives in NATIVE memory (not Java heap)
  - Grows automatically (no fixed size by default)
  - GC'd when ClassLoader is GC'd (all its classes are unloaded)

Flags:
  -XX:MetaspaceSize=256m        // initial size (triggers GC when reached)
  -XX:MaxMetaspaceSize=512m     // hard cap (OOM if exceeded)

Metaspace leak: happens when ClassLoaders are not GC'd
  Common cause: application redeployment in app servers
  Each redeploy creates a new ClassLoader — old one leaks if anything holds a reference
```

---

## 4. Garbage Collection — From Eden to Old Gen

Garbage collection is simultaneously the greatest strength and the greatest source of performance problems in the JVM. It frees you from manual memory management (the source of buffer overflows, use-after-free bugs, and memory leaks in C/C++), but in exchange, it introduces **GC pauses** — moments when your application threads are stopped so the collector can safely move or reclaim objects. Understanding how GC works, why different collectors exist, and how to tune them is the #1 skill for Java performance engineering.

The key insight is that not all garbage collectors optimize for the same thing. **Parallel GC** optimizes for throughput (maximize the percentage of time spent doing real work vs. GC work). **G1 GC** optimizes for predictable pause times (keep pauses below a target, typically 200ms). **ZGC** optimizes for ultra-low latency (sub-millisecond pauses regardless of heap size). Choosing the wrong collector for your workload is one of the most common performance mistakes in Java — a latency-sensitive trading system on Parallel GC will have multi-second pauses; a batch processing pipeline on ZGC will have lower throughput than necessary.

### Generational Hypothesis

The generational hypothesis is the single most important observation in garbage collection theory, and it drives the design of every production GC in the JVM. The hypothesis, validated by decades of empirical measurement across millions of applications, states: **most objects die young**. Roughly 90-95% of objects become unreachable within microseconds to milliseconds of creation — method-local variables, temporary strings from concatenation, iterator objects, lambda captures, intermediate stream results. Only a small fraction of objects survive long enough to be worth tracking in the long term.

This observation enables a powerful optimization: divide the heap into a **young generation** (small, collected frequently, optimized for the common case of mostly-dead objects) and an **old generation** (large, collected rarely, optimized for long-lived objects). Young GC is extremely fast because it only copies the small number of surviving objects and ignores the vast majority that are dead. Objects that survive enough young GCs are **promoted** to old generation, where they're collected less frequently by a more expensive algorithm. This design means that for most applications, 95%+ of garbage collection time is spent on fast, cheap young GCs.

```
"Most objects die young."

Observation: ~95% of objects become garbage within a few microseconds
Implication: optimize for short-lived objects → generational collection

Heap layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Young Generation (~1/3 of heap)    Old Generation       │
│  ┌─────────┬──────┬──────┐          ┌──────────────┐    │
│  │  Eden   │  S0  │  S1  │          │              │    │
│  │ (80%)   │(10%) │(10%) │          │  Tenured     │    │
│  │         │      │      │          │  Objects     │    │
│  │ new     │ age  │ age  │          │  (survived   │    │
│  │ objects │ 1-15 │ 1-15 │          │   many GCs)  │    │
│  │ here    │      │      │          │              │    │
│  └─────────┴──────┴──────┘          └──────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Object Lifecycle Through the Heap

Understanding how an object moves through the heap is essential for diagnosing memory issues. When you see "premature promotion" in a GC analysis tool, it means short-lived objects are being pushed to Old Gen before they die, which pollutes the old generation with garbage that's expensive to collect. When you see "promotion failure," it means Old Gen is full and can't accept promoted objects — a sign of either a memory leak or insufficient heap size. The lifecycle below is the mental model you need for interpreting GC logs, heap dumps, and profiler output.

```
1. ALLOCATION: Object created in Eden
   (fast: just bump a pointer — Thread-Local Allocation Buffer)

2. MINOR GC (Young GC): When Eden is full
   - Mark all live objects in Young Gen (reachable from GC roots)
   - Copy live objects from Eden + occupied Survivor → empty Survivor
   - Increment object's age counter
   - Clear Eden + old Survivor (instant — just reset pointer)
   - Cost: proportional to LIVE objects (not garbage)

3. PROMOTION: When object's age ≥ MaxTenuringThreshold (default 15)
   - Or when Survivor space is full
   - Object copied to Old Generation
   - Promoted objects are expensive to collect later

4. MAJOR GC (Old Gen GC): When Old Gen is full
   - Much slower — Old Gen is large
   - May be concurrent (G1, ZGC) or stop-the-world (Parallel)

GC ROOTS (starting points for live object tracing):
  - Local variables on thread stacks
  - Static fields
  - JNI references
  - Active threads
  - synchronized monitors
```

```
Minor GC visualization:

BEFORE:                               AFTER:
Eden: [A B C D E F G]                 Eden: [ empty ]
S0:   [X Y]          (from space)     S0:   [ empty ]      (was from)
S1:   [ empty ]       (to space)      S1:   [A D X Y]      (now from, live objects)

Dead: B, C, E, F, G (not reachable)
Live: A, D (from Eden), X, Y (from S0)

Cost: only copy 4 live objects, ignore millions of dead ones
This is why young GC is so fast.
```

### GC Algorithms in Detail

Each GC algorithm represents a different set of engineering trade-offs. Understanding these trade-offs — not just memorizing flags — is what enables you to choose and tune the right collector for your specific workload. The three primary dimensions are: **pause time** (how long application threads are stopped), **throughput** (what fraction of total time is spent on application work vs. GC work), and **footprint** (how much extra memory the GC needs for its bookkeeping). No collector optimizes all three simultaneously — improving one always comes at the cost of another.

#### Parallel GC (Throughput Collector)

Parallel GC is the simplest and oldest production-grade collector. Its philosophy is straightforward: when garbage collection is needed, stop the entire world, throw every CPU core at the collection, finish as fast as possible, and resume the application. It makes no attempt to do work concurrently with the application. This sounds crude, but it achieves the highest **throughput** of any collector — the maximum fraction of time is spent doing your application's work. The trade-off is that pauses can be long (hundreds of milliseconds to seconds on large heaps), which makes it unsuitable for latency-sensitive applications but excellent for batch processing, data pipelines, and any workload where total runtime matters more than individual request latency.

```
Strategy: Stop everything, collect as fast as possible using all CPUs

Young GC:  Parallel copy (multiple threads copy live objects simultaneously)
Old GC:    Parallel mark-sweep-compact (mark live → sweep dead → compact)

Characteristics:
  - STOP-THE-WORLD for both young and old
  - Maximum throughput (CPU time spent doing real work vs GC)
  - Longer pause times (can be seconds for large heaps)
  - Good for: batch processing, non-interactive apps

Enable: -XX:+UseParallelGC (default in Java 8)
Tune:   -XX:ParallelGCThreads=N
        -XX:MaxGCPauseMillis=200   // target (best effort)
        -XX:GCTimeRatio=99         // 99% app time, 1% GC time
```

#### G1 GC (Garbage First)

G1 is the default collector since Java 9, and for good reason: it's the best general-purpose balance between pause times and throughput. Its fundamental innovation is **region-based collection**. Instead of dividing the heap into fixed-size contiguous generations (like Parallel GC), G1 divides the heap into thousands of equal-sized **regions** (typically 1-32MB each). Each region is dynamically assigned a role (Eden, Survivor, Old, Humongous, or Free), which gives G1 enormous flexibility in how it collects.

The name "Garbage First" comes from its collection strategy: during a mixed GC, it prioritizes the regions with the **most garbage** (least live data). This means it reclaims the most memory for the least copying work. Combined with its pause-time target (`-XX:MaxGCPauseMillis`), G1 can intelligently choose *how many regions* to collect in each pause — enough to reclaim sufficient memory, but not so many that the pause exceeds the target. This makes G1 the only collector where the primary tuning knob is "how long are you willing to pause?" rather than heap sizes and ratios.

```
Strategy: Divide heap into equal-size REGIONS, collect the "most garbage" regions first

Heap layout (NOT generational bands — REGIONS):
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ E  │ E  │ O  │ S  │ E  │ O  │ O  │ H  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ O  │ E  │free│free│ O  │ S  │free│ H  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│free│ O  │ E  │ O  │free│free│ E  │free│
└────┴────┴────┴────┴────┴────┴────┴────┘

E = Eden region     S = Survivor region
O = Old region      H = Humongous (object > 50% region size)
free = unassigned

Region size: 1MB to 32MB (auto-calculated, or -XX:G1HeapRegionSize)

Collection phases:
  1. YOUNG GC (STW):
     - Evacuate live objects from Eden → Survivor regions
     - Promote aged Survivors → Old regions
     - Typically milliseconds

  2. CONCURRENT MARKING:
     - Runs WHILE application threads run
     - Marks all live objects in Old regions
     - Builds "liveness" data per region

  3. MIXED GC (STW):
     - Collects Young regions + some Old regions with most garbage
     - "Garbage First" → pick regions with lowest live ratio
     - Pause time target: -XX:MaxGCPauseMillis=200 (default)
     - G1 picks just enough regions to stay within target

Enable: -XX:+UseG1GC (default Java 9+)
Tune:   -XX:MaxGCPauseMillis=200    // primary tuning knob
        -XX:G1HeapRegionSize=4m
        -XX:InitiatingHeapOccupancyPercent=45  // when to start marking
```

#### ZGC (Z Garbage Collector)

ZGC represents the cutting edge of GC engineering. Its promise is extraordinary: **sub-millisecond pause times regardless of heap size**. Whether your heap is 128MB or 16TB, ZGC's stop-the-world pauses remain under 1 millisecond. It achieves this by doing almost everything — marking, relocating objects, updating references — **concurrently** with application threads. The only stop-the-world operations are brief root scanning phases that take microseconds.

The two key innovations that make this possible are **colored pointers** and **load barriers**. Colored pointers use unused bits in 64-bit object references to store GC metadata (mark bits, remap state, finalizable flag) directly in the pointer itself, eliminating the need for separate mark bitmaps. Load barriers are small code fragments injected at every object reference load; they check if the pointer is "stale" (pointing to an object that's been relocated) and transparently fix it. This self-healing mechanism means ZGC can relocate objects while the application is running — something that was previously impossible without stopping the world.

The trade-off is slightly higher CPU overhead (load barriers add a small cost to every reference load) and higher memory footprint (ZGC needs extra memory for concurrent operations). For latency-sensitive systems — trading platforms, real-time bidding engines, interactive web applications, microservices with strict SLA targets — ZGC is transformative.

```
Strategy: Do almost EVERYTHING concurrently — sub-millisecond pauses

Key innovations:
  1. COLORED POINTERS: Use unused bits in 64-bit pointers to store GC metadata
     ┌──────────────────────────────────────────────┐
     │ unused(16) │ finalizable│ remap│ mark1│ mark0│ address(42) │
     └──────────────────────────────────────────────┘
     No separate mark bitmap — metadata IS the pointer

  2. LOAD BARRIERS: When application reads a reference, a small code fragment
     checks if the pointer is "stale" and fixes it in-place
     (this is how ZGC relocates objects without stopping the world)

  3. CONCURRENT RELOCATION: Objects are moved while the app runs
     - Read barrier detects stale pointer → forwards to new location
     - Self-healing: pointer is updated on access

Phases (almost all concurrent):
  1. Pause Mark Start        (STW: < 1ms — just scan roots)
  2. Concurrent Mark         (concurrent with app)
  3. Pause Mark End          (STW: < 1ms — synchronize)
  4. Concurrent Relocation   (concurrent — move objects)

Pause times: < 1ms regardless of heap size (even terabyte heaps)
Trade-off: slightly higher CPU overhead and memory footprint

Enable: -XX:+UseZGC
Tune:   -XX:SoftMaxHeapSize=4g    // ZGC tries to stay below this
        Mostly self-tuning — very few knobs needed
```

#### GC Comparison

```
GC          Pause Time     Throughput     Heap Size    Use Case
──────────────────────────────────────────────────────────────────
Parallel    High (100ms+)  Highest        Any          Batch, offline
G1          Medium (~200ms) High          Medium-Large General purpose (default)
ZGC         Ultra-low (<1ms) Lower        Large        Latency-sensitive
Shenandoah  Ultra-low (<1ms) Lower        Large        Latency-sensitive (non-Oracle)
Serial      High           N/A            Small        Single CPU, small heap, containers
```

### Stop-The-World — What Really Happens

Every garbage collector, even ZGC, must occasionally stop all application threads. Understanding **why** and **how** this works is essential for diagnosing latency problems. The fundamental issue is that GC needs a **consistent snapshot** of the heap — it can't safely scan for live objects if threads are simultaneously creating new objects, modifying references, or moving data. The mechanism the JVM uses is the **safepoint**: a predetermined location in compiled code where the JVM can safely examine a thread's state (its stack, registers, and references).

The critical production issue with safepoints is **time-to-safepoint (TTSP)**. When the GC requests a safepoint, all threads must reach one before the GC can proceed. Most code reaches safepoints quickly (they're at method calls, allocation sites, and loop back-edges). But JIT-compiled **counted loops** (`for (int i = 0; i < n; i++)`) are optimized to *remove* safepoint polls because they add overhead. This means a thread running a long counted loop with no allocations and no method calls can delay the ENTIRE GC — every other thread is stopped, waiting for this one thread to finish its loop. This is one of the most counter-intuitive performance problems in Java: a single CPU-bound loop can cause GC pauses that are 10-100x longer than they should be.

```
When GC needs to stop all threads:

1. GC requests a SAFEPOINT
2. Each thread must reach a safepoint before GC can proceed
3. Safepoints are at:
   - Method entry/exit (compiled code)
   - Loop back-edges (long loops have safepoint polls)
   - Allocation points
   - JNI call boundaries

PROBLEM: "Time to safepoint" (TTSP)
  A thread in a counted loop (int i = 0; i < n; i++) WITHOUT allocation
  may NOT have safepoint polls → it can delay the entire GC!

  JIT-compiled counted loops are optimized to remove safepoint polls
  → one thread can hold up the entire JVM

  Diagnose: -XX:+PrintSafepointStatistics
            Look for high "sync" time in safepoint logs

  Fix: -XX:+UseCountedLoopSafepoints (adds polls in counted loops)
       Or restructure code to avoid very long counted loops
```

---

## 5. JIT Compilation — Interpreter to Native Code

The JIT (Just-In-Time) compiler is the reason Java is fast — not just "fast for an interpreted language," but genuinely competitive with C++ for many workloads. The key insight is that the JVM doesn't just interpret your bytecode — it identifies the **hot** methods (the ones called thousands of times) and compiles them to optimized native machine code at runtime. This means the compiled code can take advantage of information that a static compiler (like gcc or clang) can never have: the actual types flowing through your program, the actual branches taken, the actual methods called. A static compiler must handle every possible case; the JIT compiler can optimize for the **common** case and deoptimize when the uncommon case occurs.

This is why Java applications get faster over time as they "warm up." The first few hundred invocations of a method run in the interpreter (slow but quick to start). The C1 compiler then compiles the method with basic optimizations (fast compilation, moderate code quality). Finally, the C2 compiler recompiles the method with aggressive, profile-guided optimizations (slow compilation, excellent code quality). After warm-up, a JIT-compiled Java method can be as fast as — or sometimes faster than — the equivalent C++ code, because the JIT's runtime profiling enables optimizations that static compilers cannot safely perform.

Understanding JIT behavior matters in production for several reasons. Slow application warm-up (the first few minutes of a new deployment) is caused by methods running in the interpreter before being JIT-compiled. Sudden performance degradation can be caused by **deoptimization** — the JIT's optimistic assumptions being invalidated by a new class being loaded. And mysterious performance differences between environments are often caused by different JIT compilation decisions based on different profiling data.

### Tiered Compilation

```
Execution path for a method:

Invocations:    0          ~200          ~5000         ~10000+
                │           │             │              │
                ▼           ▼             ▼              ▼
           Interpreter → C1 Compiler → C1 + profiling → C2 Compiler
           (bytecode)    (fast compile)  (collect data)  (aggressive optimize)

Tier 0: Interpreter     — no compilation, collect basic profiling
Tier 1: C1 simple       — fast compilation, no profiling
Tier 2: C1 + counters   — compilation with invocation counters
Tier 3: C1 + full prof  — compilation with full profiling data
Tier 4: C2              — aggressive optimization using profiled data

Enable: -XX:+TieredCompilation (default since Java 8)
```

### What C2 Does (The Optimizer)

The C2 compiler is HotSpot's aggressive optimizing compiler, and it's responsible for the bulk of Java's runtime performance. When C2 compiles a method, it doesn't just translate bytecode to machine instructions — it transforms the code through a pipeline of optimizations that can change the generated code beyond recognition from the original source. Understanding these optimizations helps you write code that the JIT can optimize effectively, and — equally important — helps you understand why some seemingly-reasonable code runs inexplicably fast or slow.

```
C2 optimizations:

1. INLINING: Replace method call with method body
   → eliminates call overhead
   → enables further optimizations on the inlined code
   → controlled by: -XX:MaxInlineSize=35 (bytecodes)
                     -XX:FreqInlineSize=325

2. ESCAPE ANALYSIS: Determine if object "escapes" the method
   If it doesn't escape:
     a. SCALAR REPLACEMENT: decompose object into its fields on the stack
        → no heap allocation, no GC pressure
     b. LOCK ELISION: remove synchronized on non-escaping object
        → lock on thread-local object is useless
     c. STACK ALLOCATION: allocate object on stack (conceptual — Java uses scalar replacement)

3. LOOP OPTIMIZATIONS:
   - Loop unrolling: replace loop body with multiple copies
   - Loop vectorization: use SIMD instructions (SSE/AVX)
   - Loop invariant hoisting: move invariant computation out of loop

4. DEAD CODE ELIMINATION: remove unreachable code

5. NULL CHECK ELIMINATION: remove redundant null checks
   (after inlining, many null checks become provably unnecessary)

6. BRANCH PREDICTION: profile-guided — hot paths get optimized
```

### Escape Analysis in Detail

Escape analysis is the JIT compiler's most powerful optimization for reducing GC pressure. The idea is simple: if the JIT compiler can prove that an object created inside a method **never leaves that method** (never escapes via return, field assignment, or being passed to a non-inlined method), then the object doesn't need to be on the heap at all. Instead, the JIT decomposes the object into its individual fields and places them in local variables (or CPU registers). This is called **scalar replacement**, and it means zero heap allocation, zero GC pressure, and zero object header overhead for that object.

In practice, escape analysis eliminates millions of temporary object allocations in well-written Java code: `Point` objects in geometric calculations, `Iterator` objects in enhanced for-loops, `Optional` return values that are immediately unwrapped, and small DTOs that are created, read, and discarded within a single method. This is one of the reasons why Java's "objects are cheap" philosophy works in practice — the JIT often eliminates the objects entirely.

However, escape analysis has important limitations. It only works on objects that the JIT can **prove** don't escape, and this proof depends heavily on **inlining**. If the method where the object is created calls another method that receives the object, the JIT must inline that other method to see inside it and verify the object doesn't escape through it. If the call chain is too deep, or the called method is virtual with multiple implementations (megamorphic), inlining fails and the object must be heap-allocated.

```java
public int sumPoints() {
    int sum = 0;
    for (int i = 0; i < 1000; i++) {
        Point p = new Point(i, i * 2);  // does this object escape?
        sum += p.x + p.y;               // NO — only used locally
    }
    return sum;
}

// BEFORE escape analysis: 1000 heap allocations, GC pressure
// AFTER escape analysis (scalar replacement):
public int sumPoints() {
    int sum = 0;
    for (int i = 0; i < 1000; i++) {
        int p_x = i;        // field 'x' as local variable
        int p_y = i * 2;    // field 'y' as local variable
        sum += p_x + p_y;   // no object created at all!
    }
    return sum;
}
// → zero heap allocation, zero GC impact
```

**When escape analysis FAILS (object escapes):**

```java
// ESCAPES: returned from method
Point createPoint(int x, int y) {
    return new Point(x, y);  // escapes! Must be on heap
}

// ESCAPES: stored in field
this.lastPoint = new Point(x, y);  // escapes to instance

// ESCAPES: passed to another method that JIT can't inline
process(new Point(x, y));  // escapes if process() not inlined

// ESCAPES: stored in collection
list.add(new Point(x, y));  // escapes to heap-allocated list
```

### Deoptimization

Deoptimization is the price the JVM pays for its aggressive optimistic optimizations. The C2 compiler makes assumptions based on profiling data: "this virtual call always resolves to `FooImpl.bar()`," "this branch is always taken," "this type check always succeeds." It then compiles code that's optimized for these assumptions — inlining the single target, eliminating the untaken branch, removing the type check. But if reality changes (a new class is loaded that also implements `bar()`, or a previously-untaken branch is suddenly taken), the compiled code is **wrong**. The JVM must discard it, fall back to the interpreter, re-profile with the new information, and re-compile with less aggressive assumptions.

This is why you sometimes see sudden performance drops after a new class is loaded at runtime (common in application servers, OSGi containers, and plugins systems). The JIT had compiled monomorphic call sites (single target) that become bimorphic or megamorphic (multiple targets), and the recompiled code uses slower virtual dispatch instead of inlined direct calls.

```
C2 makes optimistic assumptions based on profiling:
  "This virtual call always resolves to FooImpl.bar()"
  → inline FooImpl.bar() directly (monomorphic optimization)

If a new class BarImpl is loaded that also implements bar():
  → DEOPTIMIZATION: discard compiled code, fall back to interpreter
  → re-profile with new type information
  → re-compile with less aggressive assumptions (bimorphic/megamorphic)

Megamorphic call sites (3+ implementations):
  → virtual dispatch table (vtable lookup)
  → NOT inlined
  → this is why streams with many lambda types can be slower
```

### Inspecting JIT Behavior

```bash
# Print compilation events:
-XX:+PrintCompilation
# Output: timestamp compile_id tier method_name size deopt

# Example output:
#   1234   567   4   com.app.Service::process (42 bytes)
#                 ↑
#              tier 4 = C2

# Print inlining decisions:
-XX:+PrintInlining

# Print assembly (requires hsdis library):
-XX:+PrintAssembly
-XX:+UnlockDiagnosticVMOptions

# JITWatch: visual tool for analyzing JIT compilation
# https://github.com/AdoptOpenJDK/jitwatch
```

---

## 6. Object Allocation — TLAB and Fast Path

One of the most surprising facts about Java performance is that **object allocation is faster in Java than in C**. In C, `malloc()` must search a free list or use other bookkeeping to find a suitable block of memory. In Java, allocation is a **pointer bump**: the JVM maintains a pointer to the next free location in Eden, and allocating an object just advances that pointer by the object's size. It's literally a single addition instruction — faster than even the most optimized `malloc` implementation.

The trick that makes this work at scale is the **Thread-Local Allocation Buffer (TLAB)**. Without TLABs, every allocation would need to atomically update the shared Eden pointer (a CAS operation), creating contention between threads. With TLABs, each thread gets its own private chunk of Eden. Allocation within the TLAB is a simple non-atomic pointer bump — no CAS, no contention, no cache-line bouncing. Only when a TLAB is exhausted does the thread need to get a new one (which does require a CAS on the shared Eden pointer), and this happens infrequently.

This design is why Java allocation has near-zero overhead per object, and why the conventional wisdom of "avoid creating objects in Java" is outdated. The cost of creating an object is dominated by the constructor body (initializing fields), not the allocation itself. The real cost comes later, when the garbage collector must trace and copy surviving objects. So the optimization advice for modern Java is not "avoid allocation" but "avoid creating long-lived objects unnecessarily" — let short-lived objects die young in Eden, where they're collected almost for free.

### Thread-Local Allocation Buffer (TLAB)

```
Without TLAB: every allocation = CAS on shared Eden pointer
  → contention between threads, cache line bouncing

With TLAB: each thread gets its own chunk of Eden
  → allocation = bump a LOCAL pointer (no CAS, no contention)

┌─────────────── Eden Space ──────────────────────┐
│                                                   │
│  ┌─── TLAB (Thread 1) ───┐  ┌─── TLAB (Thread 2) ───┐
│  │ [obj][obj][obj][free]  │  │ [obj][free...]         │
│  │           ↑            │  │       ↑                │
│  │      alloc pointer     │  │  alloc pointer         │
│  └────────────────────────┘  └────────────────────────┘
│                                                   │
│  ┌─── TLAB (Thread 3) ───┐                       │
│  │ [obj][obj][free....]   │                       │
│  └────────────────────────┘                       │
└───────────────────────────────────────────────────┘

Allocation fast path:
  1. new object fits in TLAB → bump pointer → done (nanoseconds!)
  2. TLAB full → request new TLAB from Eden (CAS on Eden pointer)
  3. Eden full → trigger Young GC

Allocation = adding a few to a pointer. This is why Java allocation
is FASTER than C malloc (which searches free lists).
```

### Humongous Objects

```
G1: Objects > 50% of region size are "humongous"
  - Allocated in contiguous regions directly in Old Gen
  - Not eligible for normal young GC
  - Collected during concurrent marking or Full GC

Implications:
  - Large byte arrays, large strings can bypass young gen
  - Can trigger premature Full GC if too many humongous allocations
  - Monitor: -XX:+G1PrintHumongous (Java 9+)
```

---

## 7. GC Tuning — Practical Guide

GC tuning is one of the most important skills for production Java engineers, and it's also one of the most commonly done wrong. The #1 mistake is tuning too early or tuning the wrong thing. Before touching GC flags, you need data: GC logs, allocation profiling, heap histograms. Without data, tuning is guessing, and guessing usually makes things worse.

The good news is that modern collectors (G1, ZGC) are largely self-tuning. For most applications, the only tuning you need is: (1) set `-Xms` and `-Xmx` to the same value (avoid heap resizing), (2) choose the right collector for your workload, and (3) set `-XX:MaxGCPauseMillis` for G1. Beyond that, tune only when GC logs show a specific problem — and tune the specific flag that addresses that problem.

The flags below are organized by what you'll actually use in production, not by what's academically interesting. The GC log format is the first thing to learn, because it's the foundation of all tuning decisions.

### Key JVM Flags

```bash
# Heap sizing
-Xms4g                          # initial heap size
-Xmx4g                          # maximum heap size (set equal to Xms to avoid resize)
-XX:NewRatio=2                   # Old:Young = 2:1 (default)
-XX:SurvivorRatio=8              # Eden:S0:S1 = 8:1:1 (default)

# GC selection
-XX:+UseG1GC                     # G1 (default Java 9+)
-XX:+UseZGC                      # ZGC (Java 15+)
-XX:+UseParallelGC               # Parallel (throughput)

# G1 tuning
-XX:MaxGCPauseMillis=200         # pause target (primary knob)
-XX:G1HeapRegionSize=4m          # region size
-XX:InitiatingHeapOccupancyPercent=45  # when to start concurrent marking

# GC logging (Java 11+)
-Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10m

# GC logging (Java 8)
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-XX:+PrintGCTimeStamps
-Xloggc:gc.log
```

### Reading GC Logs

GC logs are the single most important diagnostic artifact for Java performance. They tell you exactly what the collector is doing, how long each pause is, how much memory is reclaimed, and whether your heap is healthy. Every production Java application should have GC logging enabled — the overhead is negligible (< 1%), and the information is invaluable when something goes wrong. Tools like GCEasy (gceasy.io), GCViewer, and Eclipse GC Toolkit can parse these logs and produce visual reports showing pause time distributions, allocation rates, and promotion rates.

```
# G1 Young GC log entry (Java 11+ unified logging):
[2024-01-15T10:30:45.123+0000][info][gc] GC(42) Pause Young (Normal)
    (G1 Evacuation Pause) 2048M->1024M(4096M) 15.234ms

# Breakdown:
#   GC(42)        → 42nd GC event
#   Pause Young   → Young generation collection
#   2048M->1024M  → heap usage before → after
#   (4096M)       → total heap size
#   15.234ms      → pause duration

# WARNING SIGNS:
#   Frequent Full GC         → heap too small or memory leak
#   Long pause times         → heap too large or wrong GC
#   Promotion failure        → Old Gen full, objects can't promote
#   Concurrent mode failure  → Old Gen filled before marking finished
```

### Common GC Problems and Fixes

These are the patterns you'll encounter in production. Each has a characteristic symptom in GC logs, a root cause, and a fix. The key skill is pattern recognition: once you've seen each pattern a few times, you can diagnose most GC problems in minutes from the logs alone.

```
PROBLEM: Frequent young GCs
  Symptom:  Young GC every 1-2 seconds
  Cause:    High allocation rate, Eden too small
  Fix:      -XX:NewSize=2g (increase young gen)
            Or reduce allocation rate (object pooling, avoid temp objects)

PROBLEM: Long GC pauses
  Symptom:  Pause > 500ms
  Cause:    Large live set in Old Gen, too many references to scan
  Fix:      Switch to G1/ZGC, reduce -XX:MaxGCPauseMillis
            Reduce live data in Old Gen (fix memory leaks, reduce caching)

PROBLEM: Memory leak (Old Gen keeps growing)
  Symptom:  After each Full GC, Old Gen base usage is higher than before
  Fix:      Heap dump (jmap -dump:live,format=b,file=heap.hprof <pid>)
            Analyze with Eclipse MAT or VisualVM
            Look for: growing collections, listener leaks, ThreadLocal leaks

PROBLEM: Premature promotion
  Symptom:  Objects promoted to Old Gen that should die young
  Cause:    Survivor spaces too small, tenuring threshold too low
  Fix:      -XX:MaxTenuringThreshold=15 (default)
            -XX:+PrintTenuringDistribution (see age distribution)
```

---

## 8. Diagnostic Tools

The JDK ships with an extraordinary set of diagnostic tools that most developers never learn to use. These tools can be attached to running production JVMs with minimal overhead, giving you real-time visibility into heap usage, thread states, GC behavior, JIT compilation decisions, and CPU hot spots. Knowing which tool to reach for — and what output to look for — is what turns a 4-hour incident investigation into a 15-minute diagnosis.

The three tools you'll use 90% of the time are: `jcmd` (the all-purpose diagnostic command), `jstack` (thread dump analysis for deadlocks, contention, and thread leaks), and `jmap` (heap dump for memory leak investigation). For continuous monitoring, **Java Flight Recorder (JFR)** is a production-safe profiler that captures method-level CPU profiling, allocation profiling, GC events, thread events, and I/O events with less than 2% overhead — it should be enabled in every production JVM.

### jcmd — The Swiss Army Knife

`jcmd` is the single most useful JDK diagnostic tool. It sends commands to a running JVM and returns results. Think of it as a command-line interface to the JVM's internal diagnostic subsystem. It replaces the older `jstack`, `jmap`, and `jinfo` commands with a unified interface, and it can do things the older tools cannot — like starting and stopping Flight Recorder sessions, querying the JIT compilation queue, and inspecting ClassLoader hierarchies.

```bash
# List all Java processes:
jcmd

# Thread dump:
jcmd <pid> Thread.print

# Heap info:
jcmd <pid> GC.heap_info

# Heap dump:
jcmd <pid> GC.heap_dump /tmp/heap.hprof

# GC run:
jcmd <pid> GC.run

# VM flags:
jcmd <pid> VM.flags

# VM system properties:
jcmd <pid> VM.system_properties

# Class loading statistics:
jcmd <pid> VM.classloader_stats

# JIT compiler queue:
jcmd <pid> Compiler.queue

# Flight Recorder (production-safe continuous profiling):
jcmd <pid> JFR.start duration=60s filename=recording.jfr
jcmd <pid> JFR.stop
```

### jstack — Thread Analysis

A thread dump is your first diagnostic tool when an application hangs, becomes unresponsive, or has high CPU usage. It shows every thread's state, lock ownership, and full stack trace at a single point in time. By taking two or three thread dumps 5-10 seconds apart, you can see which threads are stuck (same stack trace across dumps), which are making progress, and where contention is occurring. Most production deadlocks can be diagnosed in under 5 minutes from a thread dump — the JVM automatically detects cycles in lock ownership and reports them at the bottom of the dump.

```bash
jstack <pid>

# Output shows each thread's state and stack:
"http-nio-8080-exec-1" #25 daemon prio=5 os_prio=0 tid=0x00007f...
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(Native Method)
        - parking to wait for <0x000000076b012a10> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)
        at java.util.concurrent.locks.LockSupport.park(LockSupport.java:211)
        at java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(AQS.java:715)
        ...
        at com.myapp.PricingService.calculatePrice(PricingService.java:42)

# Key things to look for:
# - BLOCKED threads: waiting for monitor (synchronized)
# - WAITING threads: parked on Lock or waiting for task
# - Deadlock detection (jstack reports them automatically)
# - Thread count: too many threads = thread leak
```

### jmap — Heap Analysis

When you suspect a memory leak, `jmap` gives you two critical capabilities: heap histograms (a quick snapshot of how many instances of each class exist and how much memory they consume) and heap dumps (a complete binary snapshot of every object on the heap, analyzable offline with tools like Eclipse MAT). The histogram is your first step — it takes seconds and shows you immediately if one class has an unexpectedly large number of instances. A heap dump is your second step — it lets you trace the reference chains that keep leaked objects alive, answering the question "who's holding a reference to these 10 million `PricingData` objects?"

```bash
# Heap histogram (top memory consumers):
jmap -histo <pid> | head -30

#  num     instances     bytes  class name
#    1:       892345   28555040  [B  (byte arrays)
#    2:       712456   17098944  java.lang.String
#    3:        45678    5481360  com.myapp.PricingData
#    ...

# Heap dump (for offline analysis):
jmap -dump:live,format=b,file=heap.hprof <pid>
# Analyze with: Eclipse MAT, VisualVM, or IntelliJ profiler
```

### Java Flight Recorder (JFR)

JFR is the most underused tool in the JDK, and it should be running in every production JVM. Originally a commercial feature (requiring a paid Oracle license), it was open-sourced in JDK 11 and is now freely available. JFR is a continuous-profiling framework built directly into the JVM — it captures thousands of event types (method execution, memory allocation, GC pauses, thread contention, I/O, JIT compilation) with less than 2% CPU overhead. Unlike sampling profilers that attach from outside, JFR is built into the VM and captures events that external tools cannot see.

The output is a `.jfr` binary file that can be analyzed with JDK Mission Control (JMC), IntelliJ's profiler, or the `jfr` command-line tool. A typical workflow: start a 60-second recording during a performance issue, download the `.jfr` file, and open it in JMC. Within minutes, you can see the exact methods consuming CPU, the exact allocation sites creating GC pressure, the exact locks causing contention, and the exact GC pauses and their triggers.

```bash
# Start recording with your app:
java -XX:StartFlightRecording=duration=60s,filename=app.jfr -jar app.jar

# Or attach to running process:
jcmd <pid> JFR.start duration=120s filename=recording.jfr

# Analyze with:
# - JDK Mission Control (JMC) — visual tool
# - IntelliJ profiler (reads .jfr files)
# - jfr command line tool

# JFR captures:
# - Method profiling (CPU hot spots)
# - Memory allocation profiling
# - GC events and pauses
# - Thread events (contention, parks)
# - I/O events
# - JIT compilation events
# ALL with < 2% overhead — safe for production
```

---

## 9. String Internals

Strings are covered in greater depth in Phase 1 (`01-language-mastery.md`), but their JVM-level behavior is critical for memory and GC analysis. In a typical enterprise application, 25-40% of the heap consists of `String` objects and their backing `byte[]` arrays. String optimization — compact strings, interning, concatenation via `invokedynamic` — represents some of the JVM's highest-impact performance work.

### String Pool and Interning

```
String pool (since Java 7): stored in the HEAP (not PermGen)

String s1 = "hello";        // stored in string pool
String s2 = "hello";        // reuses same pool entry
s1 == s2;                    // true (same reference)

String s3 = new String("hello");  // new object on heap (NOT pool)
s1 == s3;                         // false (different references)
s1.equals(s3);                    // true (same content)

String s4 = s3.intern();    // look up in pool, return pool reference
s1 == s4;                    // true
```

### Compact Strings (Java 9+)

```
Before Java 9: String backed by char[] (2 bytes per character)
  "hello" = char[] { 'h', 'e', 'l', 'l', 'o' } = 10 bytes

After Java 9: String backed by byte[] + coder flag
  Latin-1 string: byte[] with 1 byte per char (COMPACT)
  UTF-16 string:  byte[] with 2 bytes per char (when needed)

  "hello" = byte[] { 104, 101, 108, 108, 111 } = 5 bytes  (LATIN1)
  "héllo" = byte[] { ... UTF-16 encoding ... } = 10 bytes  (UTF16)

Memory savings: ~40-50% reduction for typical English/ASCII strings
```

### String Concatenation (Java 9+)

```java
String result = "Hello " + name + "!";

// Java 8: compiled to StringBuilder chain
// new StringBuilder().append("Hello ").append(name).append("!").toString()

// Java 9+: compiled to invokedynamic → StringConcatFactory
// The JVM generates OPTIMAL concatenation strategy at runtime
// May use: StringBuilder, byte[] copy, or specialized strategies
// Often faster than hand-written StringBuilder

// javap -c shows:
// invokedynamic #2, 0  // StringConcatFactory.makeConcatWithConstants
```

---

## 10. Memory Diagnostics Decision Tree

This decision tree is your production troubleshooting guide. When an alert fires at 3 AM, you don't have time to read documentation — you need to know immediately which tool to run and what to look for. Bookmark this table. Print it. Put it next to your on-call runbook. Each row maps a specific symptom to the exact diagnostic action and likely fix.

```
Symptom                              Action
───────────────────────────────────────────────────────
High CPU, low throughput         →   JFR CPU profiling, check GC overhead
                                     jstat -gcutil <pid> 1000

OOM: Java heap space             →   Increase -Xmx, or find memory leak
                                     jmap -dump:live,... → Eclipse MAT

OOM: Metaspace                   →   ClassLoader leak (redeployment)
                                     -XX:MaxMetaspaceSize, find loader leak

OOM: Direct buffer memory        →   Too many ByteBuffer.allocateDirect()
                                     -XX:MaxDirectMemorySize

Long GC pauses                   →   Switch to G1/ZGC
                                     Check -Xlog:gc*
                                     Reduce live data set

Thread leak                      →   jstack, count threads over time
                                     Look for thread pool misconfiguration

High allocation rate             →   JFR allocation profiling
                                     Look for: boxing, temp strings, temp collections

Deadlock                         →   jstack (reports deadlocks automatically)
                                     jcmd <pid> Thread.print
```

---

*After this phase: you can read GC logs and tune pause times. You can spot a memory leak from a heap histogram. You can explain why escape analysis eliminates allocations. You can tell your team why their counted loop is holding up safepoints. You understand the machine.*
