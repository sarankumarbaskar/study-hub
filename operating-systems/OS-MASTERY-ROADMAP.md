# Operating Systems Mastery Roadmap

> **Goal:** Not "I know Linux commands" — but "I understand what the kernel does when my code runs, why my container was OOM-killed, and how to diagnose a production hang with strace and perf."

**Timeline:** 8–12 weeks at 2–3 hrs/day. Each phase builds on the previous.

**Strategy:** Understand the kernel's role in everything your application does. Once you see the OS layer, JVM behavior (GC, threads, I/O) and system design decisions (connection pools, caching, containers) become crystal clear.

---

## Why OS Knowledge Matters

Every line of Java code you write eventually becomes a system call. `new Object()` becomes `mmap()`. `Thread.start()` becomes `clone()`. `socket.read()` becomes `read()`. `Files.write()` becomes `write()` + `fsync()`. The operating system is not an implementation detail — it's the machine your code actually runs on.

Without OS knowledge:
- You can't explain why your 200-thread application is slower than a 20-thread one (context switching)
- You can't debug why your Java process was killed with no log entry (OOM killer)
- You can't understand why Docker `--memory=512m` doesn't match what `free -h` shows inside the container (cgroups vs virtual memory)
- You can't optimize Kafka disk throughput (page cache, sequential I/O, zero-copy)
- You can't diagnose why your service is slow despite low CPU usage (I/O wait, lock contention)

---

## The Phases

| Phase | Topic | What You'll Understand | Weeks |
|-------|-------|----------------------|-------|
| 0 | How the OS Works | Kernel, syscalls, user/kernel space, interrupts | 1 |
| 1 | Processes & Threads | fork/exec, scheduling, context switch, signals | 1-2 |
| 2 | Memory Management | Virtual memory, paging, page faults, OOM, mmap | 1-2 |
| 3 | File Systems & I/O | Inodes, I/O stack, buffering, journaling, fsync | 1 |
| 4 | Concurrency Primitives | Mutex, futex, spinlock, semaphore, deadlock | 1 |
| 5 | Linux Networking | Socket internals, TCP stack, epoll, zero-copy | 1-2 |
| 6 | Containers & VMs | Namespaces, cgroups, Docker internals, overlay FS | 1-2 |
| 7 | Performance Tools | top, strace, perf, eBPF, flame graphs, production debugging | 1-2 |

---

## Resource Summary

| # | Resource | Type | Priority |
|---|----------|------|----------|
| 1 | **Operating Systems: Three Easy Pieces (OSTEP)** — Arpaci-Dusseau | Book (free online) | **Critical** |
| 2 | **Linux Kernel Development** — Robert Love | Book | Deep Dive |
| 3 | **Systems Performance** — Brendan Gregg (2nd Ed) | Book | **Critical** |
| 4 | **The Linux Programming Interface** — Michael Kerrisk | Book | Reference |
| 5 | **BPF Performance Tools** — Brendan Gregg | Book | Advanced |

## Free Online Resources

- **OSTEP** — [pages.cs.wisc.edu/~remzi/OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) — the best free OS textbook
- **Brendan Gregg's Blog** — [brendangregg.com](https://www.brendangregg.com/) — performance analysis god-tier
- **Julia Evans' Zines** — [wizardzines.com](https://wizardzines.com/) — visual Linux/networking explanations
- **The Linux Documentation Project** — [tldp.org](https://tldp.org/) — classic Linux guides
- **man pages** — `man 2 read`, `man 7 epoll` — the definitive reference for every syscall
- **LWN.net** — [lwn.net](https://lwn.net/) — Linux kernel news and deep-dive articles
- **Kernel Newbies** — [kernelnewbies.org](https://kernelnewbies.org/) — understanding kernel changes

---

## How This Connects to Your Other Resources

```
Java Internals                     System Design
  │ Thread.start() → clone()         │ epoll → NIO Selector
  │ new Object() → mmap()            │ Page cache → Kafka speed
  │ GC STW → OS scheduler            │ TCP tuning → net.core.*
  │ JVM process → fork+exec          │ Containers → namespaces+cgroups
  └─────────────┬─────────────────────┘
                │
        Operating Systems ← YOU ARE HERE
                │
        Hardware (CPU, RAM, Disk, NIC)
```

---

*After completing this roadmap: you understand the machine. When someone says "it's slow," you know exactly which tool to run, which metric to check, and which kernel subsystem is the bottleneck. You can explain Docker to someone who thinks it's a VM. You can tune TCP parameters for a high-throughput service. You can read a flame graph and immediately spot the hot path.*
