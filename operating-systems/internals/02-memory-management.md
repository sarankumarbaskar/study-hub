# Phase 2 — Memory Management: The Illusion of Infinite Private Memory

> Every process thinks it has its own private, contiguous memory space starting at address 0. This is a lie — created by the operating system and the CPU's memory management unit. Understanding this lie is the key to understanding performance, GC behavior, memory-mapped files, and why the OOM killer murdered your Java process at 3 AM.

When your Java application allocates a 4GB heap with `-Xmx4g`, it's not reserving 4GB of physical RAM. It's reserving 4GB of **virtual address space** — a range of addresses that the OS maps to physical memory on demand, one 4KB page at a time. Pages that aren't actively used might not be in physical RAM at all — they could be on disk (swap) or simply not yet allocated. The memory management unit (MMU) hardware in the CPU translates every virtual address your code uses into a physical address transparently, and the OS manages the mapping.

---

## 1. Virtual Memory — Why Every Process Gets Its Own Universe

### The Problem Virtual Memory Solves

Without virtual memory, every process would access physical memory directly. Process A's data at address 0x1000 and Process B's data at address 0x1000 would be the SAME location — instant corruption. Programs would need to be loaded at different addresses, and a bug in one program could overwrite another's memory.

Virtual memory solves all of this: each process gets its own **virtual address space** (0 to 2^48 on 64-bit Linux = 256 TB). The MMU hardware translates virtual addresses to physical addresses using **page tables** maintained by the OS. Two processes can both use virtual address 0x1000 — the MMU maps them to different physical locations.

```
PROCESS A:                      PHYSICAL RAM:              PROCESS B:
Virtual Address Space           ┌──────────────┐           Virtual Address Space
┌──────────────┐                │              │           ┌──────────────┐
│ 0x1000: "hi" │──► MMU ──────►│ 0x5A00: "hi" │           │ 0x1000: 42   │
│ 0x2000: 99   │──► MMU ──────►│ 0x8B00: 99   │           │ 0x2000: "yo" │
└──────────────┘                │ 0x3F00: 42   │◄── MMU ◄──│              │
                                │ 0x7100: "yo" │◄── MMU ◄──└──────────────┘
                                └──────────────┘

Both processes use address 0x1000, but the MMU maps them to DIFFERENT physical locations.
Process A cannot access Process B's memory — the MMU enforces this.
If Process A tries to access an address it doesn't own → SIGSEGV (segmentation fault).
```

### Process Address Space Layout

```
64-bit Linux process virtual address space:

High addresses (0x7FFF...)
  ┌──────────────────────────┐
  │ KERNEL SPACE              │  Top half: mapped in every process, but inaccessible
  │ (mapped but inaccessible │  from user mode. Kernel code and data lives here.
  │  from user mode)          │
  ├──────────────────────────┤  ← 0x7FFF FFFF FFFF (user/kernel boundary)
  │ Stack                     │  Grows DOWNWARD ↓
  │ (local variables,         │  Default size: 8MB per thread (ulimit -s)
  │  function call frames)    │  Each thread has its own stack
  ├──────────────────────────┤
  │ Memory-mapped files       │  mmap() region — shared libraries, mapped files
  │ (shared libraries,        │  libc.so, ld.so, JVM's libjvm.so live here
  │  JVM mapped memory)       │
  ├──────────────────────────┤
  │ Heap                      │  Grows UPWARD ↑
  │ (dynamic allocation:      │  JVM heap lives here (mmap'd by the JVM)
  │  malloc/mmap)             │  brk() extends, mmap() for large allocations
  ├──────────────────────────┤
  │ BSS (uninitialized data) │  Global variables that are zero-initialized
  ├──────────────────────────┤
  │ Data (initialized)       │  Global variables with initial values
  ├──────────────────────────┤
  │ Text (code)               │  Program instructions (read-only, executable)
  │                           │  Shared between processes running same binary
  └──────────────────────────┘
Low addresses (0x0000...)
  (Address 0 = NULL — deliberately invalid to catch null pointer dereferences)
```

---

## 2. Page Tables — How Virtual Addresses Become Physical

```
PAGES: memory is divided into fixed-size blocks (4KB on x86-64)
  Virtual page number → Physical page frame number (mapped by page table)
  
  Virtual address 0x00007F3A4C001234:
    Page number: 0x00007F3A4C001 (upper bits)
    Offset: 0x234 (lower 12 bits = position within the 4KB page)
    
  Page table lookup:
    virtual page 0x00007F3A4C001 → physical frame 0x3A7F1
    Physical address: 0x3A7F1234

MULTI-LEVEL PAGE TABLES (x86-64 uses 4 levels):
  Why? A flat page table for 256TB address space would need 512GB of entries!
  Solution: hierarchy of tables, only populated for addresses actually used
  
  Virtual address → PGD (level 4) → PUD (level 3) → PMD (level 2) → PTE (level 1) → Physical
  
  Each level: 512 entries × 8 bytes = 4KB (fits in one page)
  Most entries are empty (process doesn't use most of its 256TB address space)
  Only pages that are actually accessed have page table entries

TLB (Translation Lookaside Buffer):
  Page table walks are SLOW (4 memory accesses for 4-level table)
  TLB is a CPU CACHE for recent page table translations
  TLB hit: ~1 cycle (0.3ns) → address translated instantly
  TLB miss: ~100 cycles (30ns) → must walk the page table
  
  TLB size: ~64-1024 entries per core
  TLB flush: happens on context switch between processes → EXPENSIVE
    (This is why cross-process context switches are slower than same-process thread switches)

HUGE PAGES:
  Normal page: 4KB → need many TLB entries for large memory regions
  Huge page: 2MB or 1GB → one TLB entry covers much more memory
  
  JVM heap = 4GB with 4KB pages: needs 1 million page table entries, ~1000 TLB entries
  JVM heap = 4GB with 2MB huge pages: needs 2048 entries, ~2 TLB entries
  
  Enable for JVM: -XX:+UseLargePages (reduces TLB misses → 5-10% throughput improvement)
  Linux: echo 2048 > /proc/sys/vm/nr_hugepages
```

---

## 3. Page Faults — When the Page Isn't There

A **page fault** occurs when your code accesses a virtual address whose page is not currently in physical memory. The MMU generates an exception, the kernel's page fault handler runs, and the resolution depends on the type of fault.

```
MINOR PAGE FAULT (~1 μs):
  Page IS in physical memory, but the page table entry is missing
  Cause: first access to a freshly allocated page (lazy allocation)
  Resolution: kernel creates page table entry → done
  
  When this happens:
    malloc()/mmap() doesn't allocate physical memory immediately
    Physical memory allocated on FIRST ACCESS (lazy allocation)
    This is why RSS (Resident Set Size) < virtual memory size
    A 4GB JVM heap may only use 2GB of physical RAM if not all pages are touched

MAJOR PAGE FAULT (~1-10 ms):
  Page is NOT in physical memory — it's on disk (swap or memory-mapped file)
  Resolution: kernel reads the page from disk into RAM → updates page table → resumes
  
  When this happens:
    Swapped-out pages (system under memory pressure)
    Memory-mapped files (first access loads page from file)
    Executable code pages (loaded from binary on first execution)
  
  Cost: SSD = ~16μs, HDD = ~2ms. HUGELY expensive compared to normal memory access (100ns)
  This is why swap kills performance for latency-sensitive applications!

INVALID PAGE FAULT (→ crash):
  Virtual address is not mapped at all (not in any valid region)
  Resolution: kernel sends SIGSEGV (Segmentation Fault) → process crashes
  
  When this happens:
    Null pointer dereference (address 0x0000... is deliberately unmapped)
    Buffer overflow (accessing beyond allocated region)
    Use-after-free (accessing freed memory — may be unmapped)
    Stack overflow (stack grows beyond its limit)

OBSERVING PAGE FAULTS:
  $ /usr/bin/time -v java -jar app.jar
    Major (requiring I/O) page faults: 150
    Minor (reclaiming a frame) page faults: 523456
    
  $ perf stat -e page-faults java -jar app.jar
    523,606  page-faults
```

---

## 4. The Page Cache — Why Kafka and Elasticsearch Are Fast

The page cache is the kernel's most impactful optimization: it uses ALL unused RAM as a cache for file data. When you read a file, the data stays in RAM (in the page cache). The next read of the same data comes from RAM, not disk — hundreds of times faster.

```
FIRST READ of file.txt:
  Application: read(fd, buffer, 4096)
  Kernel: file not in page cache → read from disk → copy to page cache → copy to buffer
  Time: ~16μs (SSD) or ~2ms (HDD) — dominated by disk I/O

SECOND READ of file.txt:
  Application: read(fd, buffer, 4096)
  Kernel: file IS in page cache → copy directly from RAM to buffer
  Time: ~100ns — 100x faster than SSD, 20,000x faster than HDD!

HOW THE PAGE CACHE WORKS:
  ┌────────────────────────────────────────────────────┐
  │                  Physical RAM                       │
  │                                                     │
  │  ┌──────────────┐  ┌───────────────────────────┐  │
  │  │ Process Memory │  │      Page Cache            │  │
  │  │ (JVM heap,     │  │  (file data cached in RAM) │  │
  │  │  stacks, etc)  │  │                            │  │
  │  │  2 GB          │  │  file.txt: [pages...]       │  │
  │  │               │  │  data.db: [pages...]        │  │
  │  │               │  │  kafka-log: [pages...]      │  │
  │  │               │  │  6 GB                       │  │
  │  └──────────────┘  └───────────────────────────┘  │
  └────────────────────────────────────────────────────┘
  
  Total RAM: 8 GB
  Process memory: 2 GB
  Page cache: 6 GB (all remaining RAM used for file caching!)
  
  `free -h` output:
    total    used    free    buff/cache    available
    8 GB     2 GB    200 MB  5.8 GB        5.5 GB
    
  "free" shows only 200 MB free — but 5.8 GB is buff/cache!
  This memory IS available: the kernel evicts page cache pages when processes need RAM.
  New developers panic at "low free memory" — don't! buff/cache IS usable memory.

WHY KAFKA IS FAST:
  Kafka writes to a log file (sequential writes → fast)
  The log file is in the page cache (recent data = memory speed)
  Consumers reading near the tail: data served from page cache (no disk I/O!)
  Kafka deliberately does NOT manage its own cache — it trusts the OS page cache
  This is why Kafka performs best when you give it LOTS of free RAM (for page cache)

WHY ELASTICSEARCH IS FAST:
  Elasticsearch stores index segments as files on disk
  Frequently accessed segments live in the page cache
  Search queries that hit cached segments: memory speed
  Recommendation: give ES only 50% of RAM for JVM heap, leave 50% for page cache!
```

---

## 5. The OOM Killer — When Memory Runs Out

When the system truly runs out of memory (all RAM used, swap full or disabled), the Linux kernel's **OOM Killer** chooses a process to kill. This is a last resort to prevent the entire system from crashing.

```
HOW THE OOM KILLER CHOOSES ITS VICTIM:
  Each process has an oom_score (0-1000)
  Higher score = more likely to be killed
  
  Factors:
    Memory usage (primary factor — biggest consumer is most likely killed)
    Process age (newer processes slightly preferred for killing)
    Nice value (low-priority processes slightly preferred)
    oom_score_adj: manual adjustment (-1000 to +1000)
  
  oom_score_adj = -1000: NEVER kill this process (e.g., sshd, init)
  oom_score_adj = +1000: ALWAYS kill this process first

  $ cat /proc/<pid>/oom_score       # current score
  $ echo -1000 > /proc/<pid>/oom_score_adj  # protect this process

WHEN IT HAPPENS:
  1. System memory exhausted + no swap (or swap full)
  2. Kernel can't allocate a single page → PANIC → invoke OOM killer
  3. OOM killer scans all processes → picks highest oom_score → sends SIGKILL
  4. Your Java process disappears with NO LOG ENTRY in your application!
  5. dmesg shows: "Out of memory: Kill process 12345 (java) score 890"

DIAGNOSING AN OOM KILL:
  $ dmesg | grep -i "out of memory"
  $ dmesg | grep -i "killed process"
  $ journalctl -k | grep -i oom
  
  Look for: process name, PID, memory usage, oom_score

IN CONTAINERS (cgroups):
  docker run --memory=512m → sets memory.limit_in_bytes = 512MB
  If the process exceeds this: cgroup OOM (more predictable than system OOM)
  The kernel kills the process INSIDE the container only
  
  Java 10+: JVM reads cgroup limits automatically
    -XX:MaxRAMPercentage=75 → JVM heap = 75% of container memory limit
    Leaves 25% for native memory, page cache, thread stacks, JNI

PREVENTING OOM:
  1. Size your JVM heap correctly (don't use 100% of available RAM)
  2. Monitor RSS (not just JVM heap) — native memory also counts
  3. Set container memory limits (predictable OOM, not system-wide chaos)
  4. Use oom_score_adj to protect critical processes
  5. Disable swap for latency-sensitive apps (better to OOM fast than swap and be slow)
     vm.swappiness = 0 or swapoff -a
```

---

## 6. Memory-Mapped Files (mmap) — Zero-Copy File Access

```
NORMAL FILE READ:
  read(fd, buf, size)
  Data path: Disk → Kernel page cache → User space buffer (one copy)
  
MEMORY-MAPPED FILE:
  ptr = mmap(fd, size, ...)
  Data path: Disk → Kernel page cache ← Direct access from user space (zero copy!)
  
  mmap() maps a file directly into the process's virtual address space
  Reading ptr[offset] triggers a page fault → kernel loads the page from disk
  Subsequent reads: page is in RAM → direct memory access (no syscall overhead!)

HOW IT WORKS:
  Process address space:
  ┌───────────────────────────────────┐
  │ ...                               │
  │ mmap region: 0x7F3A00000000       │
  │   page 0 → file offset 0         │──► Page cache (shared with other processes)
  │   page 1 → file offset 4096      │──► Page cache
  │   page 2 → file offset 8192      │──► Page cache (not yet loaded — will page fault)
  │ ...                               │
  └───────────────────────────────────┘

WHO USES MMAP:
  JVM:           loads class files via mmap (text segment of libjvm.so)
  Kafka:         consumers mmap log segment files for fast sequential reads
  Databases:     PostgreSQL mmaps relation files; SQLite mmaps database file
  Java NIO:      FileChannel.map() → MappedByteBuffer → mmap under the hood
  Search:        Lucene/Elasticsearch mmaps index segments for fast access

ADVANTAGES:
  No syscall per read (after initial mmap): just memory access
  Shared between processes: multiple readers share the same pages
  Lazy loading: pages loaded on demand (only touched pages use physical RAM)
  OS manages caching: page cache handles eviction, dirty page writeback

DISADVANTAGES:
  Hard to control when pages are loaded/evicted (OS decides)
  Page faults can cause latency spikes (unpredictable disk reads)
  Difficult to handle I/O errors (SIGBUS instead of return value)
  File must fit in virtual address space (not a problem on 64-bit)
```

---

## 7. Swap — When RAM Overflows to Disk

```
WHAT SWAP IS:
  When physical RAM is full and a process needs more memory:
  Kernel picks the LEAST RECENTLY USED pages and writes them to SWAP space (on disk)
  Frees those physical pages for the requesting process
  When the swapped pages are accessed again: page fault → load from swap → slow!

SWAP PERFORMANCE:
  RAM access: ~100 ns
  Swap on SSD: ~16,000 ns (160x slower!)
  Swap on HDD: ~2,000,000 ns (20,000x slower!)
  
  A Java application that starts swapping: response times go from 5ms to 500ms+
  GC during swapping: heap pages on disk → GC must page them in → GC pause 10x longer

TUNING:
  vm.swappiness = 0-100 (default 60)
    0:   kernel avoids swap as long as possible (prefer killing processes over swapping)
    60:  default (balanced between swapping and killing)
    100: kernel aggressively swaps
  
  FOR LATENCY-SENSITIVE APPS: vm.swappiness = 1 (or 0, or disable swap entirely)
  
  $ sysctl vm.swappiness=1        # set at runtime
  $ swapoff -a                    # disable swap entirely
  
  In containers: swap is typically disabled (Kubernetes disables swap by default)
  Reasoning: better to OOM-kill and restart than to degrade to disk-speed performance

MONITORING SWAP:
  $ free -h             # shows swap usage
  $ vmstat 1            # watch si/so columns (swap in / swap out per second)
  $ swapon -s           # show swap devices
  
  If si/so > 0 consistently: your system is under memory pressure → add RAM or reduce usage
```

---

## 8. Memory Best Practices

```
JVM MEMORY SIZING:
  Container memory: 2 GB
  JVM heap (-Xmx):  1.5 GB (75% of container memory)
  Remaining 512 MB: thread stacks, native memory, page cache, JNI, Metaspace
  
  FORMULA: -XX:MaxRAMPercentage=75 (Java 10+ reads cgroup limits automatically)
  
  NEVER set -Xmx = container memory (no room for native memory → OOM kill!)

MONITORING:
  $ top -o %MEM                    # sort by memory usage
  $ ps -eo pid,rss,vsz,comm --sort=-rss | head  # top RSS consumers
  $ cat /proc/<pid>/status | grep Vm   # detailed per-process memory
  $ jcmd <pid> VM.native_memory summary  # JVM native memory tracker

PAGE CACHE:
  More free RAM = more page cache = faster file I/O
  Don't panic at "low free memory" — check "available" column in free -h
  For Kafka/Elasticsearch: allocate only 50% to JVM heap, leave rest for page cache

HUGE PAGES:
  For large JVM heaps (>4GB): enable huge pages for 5-10% throughput gain
  -XX:+UseLargePages -XX:LargePageSizeInBytes=2m
  
OOM PREVENTION:
  Set container memory limits (always!)
  Monitor RSS not just JVM heap (native memory leaks exist)
  Use jcmd VM.native_memory for JVM native memory tracking
  Set oom_score_adj for critical processes
```

---

*After this phase: you understand how virtual memory creates the illusion of private memory for every process. You can explain page tables, TLB, and why huge pages improve performance. You know how the page cache makes Kafka and Elasticsearch fast. You can diagnose and prevent OOM kills. You understand why swap destroys latency and how to avoid it.*
