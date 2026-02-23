# Phase 7 — Performance Tools and Production Debugging

> When your production system is on fire, you need to know EXACTLY which tool to run, what output to look for, and what action to take. This phase is your diagnostic playbook.

All the OS knowledge from Phases 0-6 converges here: processes, memory, filesystems, networking, and containers — diagnosed with specific tools that give you visibility into what the kernel is doing. Brendan Gregg (Netflix performance engineer, author of *Systems Performance*) calls this the **USE Method**: for every resource, check Utilization, Saturation, and Errors. This systematic approach replaces random guessing with targeted diagnosis.

---

## 1. The USE Method — Systematic Performance Analysis

```
FOR EVERY RESOURCE, CHECK:

  U — UTILIZATION:  What percentage of the resource is being used?
  S — SATURATION:   Is there a queue or backlog? (work waiting)
  E — ERRORS:       Are there error events? (failed operations)

RESOURCE        UTILIZATION          SATURATION              ERRORS
──────────────────────────────────────────────────────────────────────────
CPU             CPU% per core        Run queue length        perf for crashes
                (top, mpstat)        (vmstat procs r)        (dmesg for MCE)

Memory          Used RAM %           Swap activity           OOM kills
                (free -h)            (vmstat si/so > 0)      (dmesg | grep oom)

Disk            I/O bandwidth %      I/O queue depth         Disk errors
                (iostat %util)       (iostat avgqu-sz)       (dmesg, smartctl)

Network         Bandwidth %          Socket backlog          Drops, errors
                (sar -n DEV)         (ss -tlnp Recv-Q)      (netstat -s errors)

THE PROCESS:
  1. Pick a resource (CPU? Memory? Disk? Network?)
  2. Check U, S, E
  3. If utilization is high: you've found the bottleneck → optimize or scale
  4. If saturation is high: the resource is overloaded → it's queuing work
  5. If errors exist: something is broken → fix it
  6. If all three are fine: the bottleneck is elsewhere → check the next resource
```

---

## 2. CPU Tools — Is the CPU the Bottleneck?

```
TOP / HTOP (first tool to run):
  $ top
  
  top - 14:30:22 up 45 days,  4 users,  load average: 8.50, 6.20, 4.10
  Tasks: 312 total,   4 running, 308 sleeping
  %Cpu(s): 65.2 us, 12.3 sy,  0.0 ni, 18.5 id,  3.8 wa,  0.0 hi,  0.2 si
  MiB Mem:  16384.0 total,   1234.5 free,   8500.0 used,   6649.5 buff/cache

  KEY METRICS:
    load average: 8.50 on 8-core machine → load = cores → CPU-saturated!
      Rule: load average > number of cores = CPU saturation
    us (user): 65% → your application code using CPU (expected for compute)
    sy (system): 12% → kernel code (syscalls, interrupts). High? Too many syscalls.
    wa (I/O wait): 3.8% → CPU waiting for disk I/O. High (>20%)? Disk bottleneck.
    id (idle): 18% → some headroom left
    
  PER-PROCESS: look at %CPU column
    PID   USER    %CPU  %MEM  COMMAND
    12345 app     250%  52%   java -jar app.jar   ← using 2.5 cores
    12346 app      45%   3%   [GC task thread]     ← GC overhead

MPSTAT (per-core CPU usage):
  $ mpstat -P ALL 1
  
  CPU    %usr   %sys   %iowait  %idle
  0      95.0   3.0    0.0      2.0    ← core 0 maxed out!
  1      12.0   2.0    0.0      86.0   ← core 1 mostly idle
  2      11.0   3.0    15.0     71.0   ← core 2 waiting for I/O
  3      10.0   1.0    0.0      89.0
  
  If ONE core is 100% and others are idle: single-threaded bottleneck
    → find the thread (pidstat -t), identify the code, parallelize or optimize

PIDSTAT (per-process/thread CPU):
  $ pidstat -t -p 12345 1    # per-thread CPU for Java process
  
  Shows: which Java threads use the most CPU
  Map thread ID to Java thread name using jstack + thread dump

PERF TOP (function-level CPU profiling):
  $ perf top -p 12345
  
  Shows: which FUNCTIONS are consuming the most CPU
    35.2%  [jvm]  libjvm.so  G1ParScanThreadState::copy_to_survivor_space
    12.1%  [app]  MyService.processOrder
    8.5%   [kernel] tcp_sendmsg
    
  Instantly tells you: 35% of CPU is in GC, 12% in your business logic, 8.5% in TCP sending
```

---

## 3. Memory Tools — Is Memory the Bottleneck?

```
FREE (quick memory overview):
  $ free -h
              total    used    free    shared  buff/cache  available
  Mem:         16G     8.5G    1.2G     50M      6.3G        6.9G
  Swap:        4.0G    500M    3.5G

  KEY: "available" = 6.9G (this is how much your apps CAN use, not "free")
  buff/cache: 6.3G → this IS usable memory (page cache, will be evicted if needed)
  Swap used: 500M → BAD for latency-sensitive apps! Something is swapping.

VMSTAT (memory + CPU + I/O activity):
  $ vmstat 1
  procs ─memory──── ──swap── ──io── ─system── ──cpu──
   r  b  swpd   free  buff  cache   si   so   bi   bo   in   cs  us sy id wa
   4  1  512000 1.2G  200M  6.1G    0    20   50   200  8000 15000 65 12 18 5

  KEY COLUMNS:
    r:  4 processes in run queue (runnable) → CPU-saturated if > num_cores
    b:  1 process blocked on I/O → disk bottleneck indicator
    si: 0 pages swapped IN from disk → OK
    so: 20 pages swapped OUT to disk → ACTIVE SWAPPING! Bad!
    cs: 15000 context switches/sec → normal for a busy server
    wa: 5% CPU waiting for I/O

  IF si/so > 0 CONSISTENTLY: memory pressure → add RAM, reduce heap, fix leak

/proc/meminfo (detailed memory breakdown):
  $ cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|Cached|SwapTotal|SwapFree"
  
  Detailed breakdown of where ALL memory is going

PMAP (per-process memory map):
  $ pmap -x 12345 | tail -5
  Shows: how memory is distributed (heap, stack, shared libs, mapped files)
  Useful for: finding unexpected memory-mapped regions, native memory leaks
```

---

## 4. Disk I/O Tools — Is the Disk the Bottleneck?

```
IOSTAT (disk I/O performance):
  $ iostat -xz 1
  
  Device  r/s    w/s    rkB/s   wkB/s   await  %util
  sda     150    500    6000    25000   2.5    85%
  nvme0n1 5000   2000   200000  80000   0.2    45%

  KEY METRICS:
    r/s, w/s:   IOPS (reads/writes per second)
    rkB/s, wkB/s: throughput (KB/sec)
    await:      average I/O latency in milliseconds
                SSD: should be <1ms. HDD: 2-10ms. >20ms: saturated!
    %util:      how busy the disk is (100% = saturated, no more capacity)
                85% for sda → approaching saturation → consider SSD upgrade

  DIAGNOSIS:
    High %util + high await: disk is the bottleneck
      → add caching (Redis), move to SSD, reduce I/O (batch writes)
    High w/s with low r/s: write-heavy workload
      → check if fsync is too frequent, consider write-behind caching

IOTOP (per-process I/O):
  $ iotop -oa
  
  TID    PRIO  USER  DISK READ  DISK WRITE  COMMAND
  12345  be/4  app   50.00 M/s  200.00 M/s  java -jar app.jar
  
  Shows which process is doing the most I/O
  → correlate with jstack to find which Java thread is doing disk I/O

LSOF (open files — essential for leak diagnosis):
  $ lsof -p 12345 | wc -l     # how many open files?
  $ lsof -p 12345 | grep socket  # how many sockets?
  $ lsof +D /var/log/           # who's writing to /var/log?
  
  IF open file count keeps growing: FILE DESCRIPTOR LEAK
  → find the code that opens files/connections without closing them
```

---

## 5. Network Tools — Is the Network the Bottleneck?

```
SS (socket statistics — replacement for netstat):
  $ ss -s                      # connection summary
  $ ss -tnp                    # all TCP connections with PID
  $ ss -tlnp                   # listening ports with PID
  $ ss -tn state time-wait | wc -l   # count TIME_WAIT connections
  $ ss -tn state close-wait          # find connection leaks (CLOSE_WAIT)

TCPDUMP (packet capture — the ultimate network debugger):
  $ tcpdump -i any port 8080 -n -c 100   # capture 100 packets on port 8080
  $ tcpdump -i any host 10.0.1.5 -w capture.pcap   # save for Wireshark analysis
  
  USE WHEN: "is the request reaching the server?" "what does the TLS handshake look like?"

SAR (network throughput over time):
  $ sar -n DEV 1    # network interface statistics every second
  
  IFACE    rxpck/s  txpck/s  rxkB/s   txkB/s
  eth0     15000    12000    120000   85000
  
  If rxkB/s approaching NIC speed (e.g., 1Gbps = 125,000 kB/s): network saturated
```

---

## 6. Tracing Tools — Seeing Inside the Kernel

```
STRACE (system call tracing — your #1 debugging tool):
  $ strace -p 12345 -e trace=network   # trace only network syscalls
  $ strace -p 12345 -e trace=file      # trace only file syscalls
  $ strace -c -p 12345                 # count syscalls and time spent
  
  OUTPUT:
  % time     seconds  usecs/call     calls    errors syscall
  ------  ----------- ----------- --------- --------- ------
   45.23    2.345678        234      10000           read     ← 45% of time in read()!
   30.12    1.562345        156      10000           write
   15.67    0.812345         81      10000           futex    ← lock contention?
   
  DIAGNOSIS: 45% of time in read() → I/O-bound → add caching or optimize queries

PERF (CPU performance counters):
  $ perf stat -p 12345
    10,234,567,890  cycles
     5,123,456,789  instructions         # IPC = 0.50 (low — lots of stalls)
       234,567,890  cache-misses         # high cache misses → memory access pattern issue
       123,456,789  branch-misses        # branch prediction failures
  
  $ perf record -p 12345 -g -- sleep 30   # record 30 seconds of profiling
  $ perf report                            # interactive report

FLAME GRAPHS (the best visualization for CPU profiling):
  $ perf record -p 12345 -g -F 99 -- sleep 30
  $ perf script | ./stackcollapse-perf.pl | ./flamegraph.pl > flame.svg
  
  OR for Java (recommended — includes Java frame names):
  $ async-profiler/profiler.sh -d 30 -f flame.html 12345
  
  HOW TO READ A FLAME GRAPH:
    Width = time spent (wider = more CPU time)
    Y-axis = stack depth (bottom = entry point, top = leaf function)
    Color = random (don't read into colors)
    
  LOOK FOR: wide plateaus at the TOP → these functions consume the most CPU
    If GC functions are wide: GC overhead → tune heap or fix allocation
    If your business method is wide: optimize that method
    If kernel functions are wide: too many syscalls or I/O
```

---

## 7. Common Production Scenarios — The Diagnostic Playbook

```
SCENARIO: "The application is slow"
  1. top → check CPU%, memory, I/O wait
  2. If CPU% high → perf top / async-profiler → find hot method → optimize
  3. If wa% high → iostat → disk saturated → add cache or upgrade disk
  4. If memory low → free -h → swapping? → add RAM or reduce heap
  5. If all look fine → thread dump (jstack) → are threads BLOCKED/WAITING?
     → lock contention or waiting for external service → fix the bottleneck

SCENARIO: "Java process was killed with no log"
  1. dmesg | grep -i "out of memory"
  2. If found: OOM killer → process exceeded memory limit
  3. If container: docker inspect → check memory limit vs process RSS
  4. Fix: increase memory limit, OR fix memory leak (jmap heap dump → analyze)
  5. Prevention: -XX:MaxRAMPercentage=75, monitor RSS not just JVM heap

SCENARIO: "Too many open files (EMFILE)"
  1. lsof -p <pid> | wc -l → how many file descriptors?
  2. lsof -p <pid> | grep socket → how many sockets? (connection leak?)
  3. Compare with: ulimit -n (default 1024)
  4. Short-term: ulimit -n 65536
  5. Long-term: find and fix the leak (try-with-resources, connection pooling)

SCENARIO: "Connection refused / timeout"
  1. ss -tlnp | grep <port> → is anything listening on that port?
  2. ss -s → total connections. Approaching limit?
  3. ss -tn state syn-recv | wc -l → SYN flood? Backlog full?
  4. iptables -L → firewall blocking?
  5. curl -v <url> → where does the connection fail?

SCENARIO: "Container using too much CPU"
  1. cat /sys/fs/cgroup/cpu/docker/<id>/cpu.stat → nr_throttled?
  2. If throttled: container CPU limit too low for burst workload
  3. Fix: increase --cpus or use --cpu-shares (soft limit)
  4. Also check: is GC taking too much CPU? (jstat -gcutil)

SCENARIO: "Disk is full"
  1. df -h → which filesystem is full?
  2. du -sh /* | sort -rh → which directory is biggest?
  3. lsof +L1 → deleted files still held open (consuming space!)
  4. Common culprits: logs (rotate!), temp files, Docker images (docker system prune)

SCENARIO: "Network connections piling up"
  1. ss -s → check TIME_WAIT count
  2. If TIME_WAIT > 10,000: lots of short-lived connections
  3. Fix: enable tcp_tw_reuse, use connection pooling, use HTTP keep-alive
  4. If CLOSE_WAIT > 100: YOUR code isn't closing connections properly
  5. Fix: find and close unclosed sockets (connection leak)
```

---

## 8. Tool Quick Reference

```
WHAT YOU NEED TO KNOW          TOOL                    COMMAND
──────────────────────────────────────────────────────────────────────
Overall system health          top / htop              top
CPU per core                   mpstat                  mpstat -P ALL 1
CPU per process/thread         pidstat                 pidstat -t -p PID 1
Memory overview                free                    free -h
Memory activity                vmstat                  vmstat 1
Disk I/O                       iostat                  iostat -xz 1
Disk per process               iotop                   iotop -oa
Open files                     lsof                    lsof -p PID
Network connections            ss                      ss -tnp
Network traffic                sar                     sar -n DEV 1
Packet capture                 tcpdump                 tcpdump -i any port 8080
System call tracing            strace                  strace -c -p PID
CPU profiling                  perf                    perf top -p PID
Java profiling                 async-profiler          profiler.sh -d 30 PID
Flame graph                    perf + flamegraph.pl    see Section 6
Kernel log                     dmesg                   dmesg | tail -50
Container stats                docker stats            docker stats
Container cgroups              cgroup files            /sys/fs/cgroup/...
```

---

*After this phase: when production breaks, you know exactly what to run. You don't guess — you follow the USE method, pick the right tool, read the output, and identify the bottleneck. You can create flame graphs, trace system calls, diagnose OOM kills, find connection leaks, and resolve disk saturation. This is the practical payoff of all your OS knowledge.*
