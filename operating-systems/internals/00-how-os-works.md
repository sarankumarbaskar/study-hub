# Phase 0 — How the Operating System Works: The Big Picture

> The OS is not "Windows vs Linux." It's the software layer that turns raw hardware into something your programs can safely and efficiently use.

Every time you call `new ArrayList<>()` in Java, the JVM eventually asks the operating system for memory via `mmap()`. Every time you open a database connection, the OS creates a socket (a file descriptor), establishes a TCP connection (kernel network stack), and allocates buffers (kernel memory). Every time your Spring Boot app starts, the OS loads the JVM binary (`exec()`), allocates its heap (`mmap()`), creates threads (`clone()`), and schedules them on CPU cores. You cannot understand application performance without understanding the OS layer.

This phase gives you the mental model of what the OS is, what it does, and how your code interacts with it through system calls.

---

## 1. What the Operating System Actually Does

### The Kernel's Four Jobs

The OS kernel is a program that runs with full hardware access (Ring 0 on x86) and provides four essential services:

**1. Hardware Abstraction:** Your code doesn't talk to disk controllers, network cards, or GPU registers directly. The kernel provides uniform interfaces (`read()`, `write()`, `send()`, `recv()`) that work the same whether the underlying hardware is an NVMe SSD, a spinning disk, a Wi-Fi adapter, or a virtual device in the cloud.

**2. Resource Multiplexing:** A single machine has N CPU cores, M gigabytes of RAM, one disk, and one network interface. But dozens of processes want to use all of them simultaneously. The kernel creates the **illusion** that each process has its own CPU (scheduling), its own memory (virtual memory), and its own set of files (file descriptors). This multiplexing is invisible to your application — every process thinks it's the only one running.

**3. Isolation and Protection:** Process A cannot read Process B's memory. A user program cannot overwrite the kernel's code. A container cannot see the host's filesystem. This protection is enforced by the CPU's hardware (memory management unit, privilege rings) and the kernel's policies (page tables, namespaces, permissions). Without this, one buggy program could crash everything.

**4. Resource Allocation and Accounting:** The kernel decides which process gets how much CPU time (scheduler), how much memory (OOM killer when resources are scarce), and how much network bandwidth (traffic control). In containers, cgroups add explicit limits so one container can't starve others.

```
Your Java Application
    │
    │  (calls like Thread.start(), socket.read(), new byte[1024])
    │
    ▼
JVM Runtime
    │
    │  (translates to native calls: clone(), read(), mmap())
    │
    ▼
System Call Interface (the boundary)
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│                    LINUX KERNEL                            │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Process   │  │ Memory   │  │ File     │  │ Network  │ │
│  │ Scheduler │  │ Manager  │  │ System   │  │ Stack    │ │
│  │ (CFS)     │  │ (VM,     │  │ (VFS,    │  │ (TCP/IP, │ │
│  │           │  │  paging)  │  │  ext4)   │  │  sockets)│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Device Drivers                           │ │
│  │  (disk, network, USB, GPU, etc.)                     │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
    │
    ▼
Hardware (CPU, RAM, Disk, NIC, GPU)
```

---

## 2. User Space vs Kernel Space — The Most Important Boundary

### Why the Boundary Exists

Modern CPUs have **privilege levels** (called "rings" on x86). Ring 0 (kernel mode) has full access to all hardware and memory. Ring 3 (user mode) is restricted — it cannot directly access hardware, cannot modify page tables, and cannot execute privileged instructions. Your application runs in Ring 3. The kernel runs in Ring 0.

This separation exists for **safety**. If your buggy Java application could directly access disk hardware, a single bug could corrupt every file on the system. If it could modify page tables, it could read any other process's memory (passwords, encryption keys). The privilege boundary prevents applications from breaking the system or each other.

```
Ring 3 (User Space):
  Your application, JVM, libraries, tools
  CAN: compute, access own memory, call system calls
  CANNOT: access hardware directly, read other processes' memory,
          modify kernel data structures, execute privileged CPU instructions

Ring 0 (Kernel Space):
  Linux kernel, device drivers, kernel modules
  CAN: everything — full hardware access, all memory, all devices
  RUNS: in response to system calls, interrupts, or exceptions

THE BOUNDARY:
  User space → Kernel space: SYSTEM CALL (software interrupt / trap)
  Kernel space → User space: return from syscall (restore registers, switch back to Ring 3)
  
  Crossing the boundary costs ~100-200 nanoseconds
  This is why syscalls are "expensive" — not because the kernel is slow,
  but because the mode switch (save registers, switch stacks, check permissions) adds up
  when you do millions of syscalls per second.
```

### What Happens During a System Call

When your Java code does `inputStream.read()`, here's the complete chain:

```
1. Java: inputStream.read(buffer)
2. JVM: calls native method → JNI → C function read()
3. libc: read() wrapper prepares arguments in registers
4. CPU: executes SYSCALL instruction (x86-64) or INT 0x80 (x86-32)
   ┌──────────────────────────────────────────────────────────┐
   │ MODE SWITCH: Ring 3 → Ring 0                             │
   │  - Save user registers to kernel stack                   │
   │  - Switch to kernel stack                                │
   │  - Look up syscall number in syscall table               │
   │  - Call sys_read() in the kernel                         │
   └──────────────────────────────────────────────────────────┘
5. Kernel: sys_read()
   - Find file descriptor in process's fd table
   - Check permissions
   - Call VFS layer → filesystem → block layer → device driver
   - If data in page cache: copy to user buffer (fast!)
   - If data on disk: schedule I/O, put process to sleep, wake when data arrives
6. Return:
   ┌──────────────────────────────────────────────────────────┐
   │ MODE SWITCH: Ring 0 → Ring 3                             │
   │  - Restore user registers from kernel stack              │
   │  - Switch to user stack                                  │
   │  - Return bytes_read to user space                       │
   └──────────────────────────────────────────────────────────┘
7. libc: returns bytes_read to JVM
8. JVM: returns data to Java inputStream.read()

TOTAL OVERHEAD of the syscall itself: ~100-200ns
If data is in page cache: add ~100ns for the memory copy
If data is on disk: add ~16μs (SSD) or ~2ms (HDD) for the I/O
```

### Observing System Calls with strace

`strace` is the most powerful debugging tool you'll ever learn. It shows every system call your program makes — every file open, every network read, every memory allocation.

```bash
# Trace all syscalls of a running Java process:
strace -p <pid> -e trace=read,write,open,close,mmap,clone

# Example output:
read(42, "GET /api/users HTTP/1.1\r\n"..., 8192) = 156
#  fd=42 (a socket), read 156 bytes of HTTP request

write(42, "HTTP/1.1 200 OK\r\n"..., 1234) = 1234
#  wrote 1234 bytes of HTTP response back to the socket

mmap(NULL, 1048576, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f3a4c000000
#  JVM allocated 1MB of memory (probably for a new thread stack or TLAB)

clone(child_stack=0x7f3a4bffe000, flags=CLONE_VM|CLONE_FS|...) = 12345
#  JVM created a new OS thread (Thread.start() → clone())

# USE CASES FOR strace:
#  "Why is my app slow?"        → strace -c -p PID (count syscalls, find which takes time)
#  "Why can't it open a file?"  → strace -e open,openat (see the path it's trying)
#  "Why is it hanging?"         → strace -p PID (see which syscall it's stuck in)
#  "What config is it reading?" → strace -e open (see all file opens at startup)
```

---

## 3. The Linux Kernel Architecture

### Monolithic Kernel — Linux's Design Choice

Linux is a **monolithic kernel**: all kernel code (scheduler, memory manager, file system, network stack, device drivers) runs in a single address space in Ring 0. This contrasts with **microkernels** (like Mach, MINIX) where each subsystem runs as a separate user-space process.

```
MONOLITHIC (Linux, Windows):
  Everything in one address space
  Function calls between subsystems (fast: nanoseconds)
  A bug in a driver can crash the entire kernel
  
MICROKERNEL (MINIX, QNX, seL4):
  Minimal kernel (scheduling, IPC, memory)
  File systems, drivers, network as user-space servers
  Message passing between components (slower: microseconds)
  A bug in a driver only crashes that driver (more reliable)

WHY LINUX CHOSE MONOLITHIC:
  Performance. A function call is ~1ns. An IPC message is ~1μs (1000x slower).
  For a kernel handling millions of operations per second, this difference matters.
  Linux compensates for the reliability risk with extensive testing and code review.
  
  Compromise: LOADABLE KERNEL MODULES (LKMs)
  You can load/unload drivers at runtime without rebooting:
    insmod my_driver.ko   # load module
    rmmod my_driver       # unload module
  Kernel modules run in Ring 0 (same privileges as kernel)
  This is how device drivers, filesystems, and networking modules are added.
```

### Key Kernel Subsystems

```
SUBSYSTEM        WHAT IT DOES                          YOUR CODE INTERACTS VIA
─────────────────────────────────────────────────────────────────────────────────
Process Manager  Create/destroy/schedule processes     fork(), exec(), wait(), clone()
Memory Manager   Virtual memory, page allocation,      mmap(), brk(), mprotect()
                 OOM handling
VFS              Uniform file interface over            open(), read(), write(), close()
                 ext4/XFS/NFS/procfs/etc.
Network Stack    TCP/IP, UDP, socket management        socket(), connect(), send(), recv()
Device Drivers   Talk to hardware (disk, NIC, GPU)     (indirectly through VFS/network)
Security         Permissions, capabilities, SELinux    (transparent — enforced by kernel)
cgroups          Resource limits for containers        (configured by Docker/K8s)
Namespaces       Isolation for containers              (configured by Docker/K8s)
```

---

## 4. Interrupts — How the CPU Handles the Outside World

### What Interrupts Are

The CPU is executing your code instruction by instruction. Suddenly, data arrives on the network card, or a timer fires, or the user presses a key. The CPU needs to respond **immediately** without your program explicitly checking. This is done through **interrupts**: the hardware sends a signal to the CPU, which stops whatever it's doing, saves the current state, jumps to a kernel interrupt handler, processes the event, restores the state, and continues your code.

```
YOUR CODE RUNNING:
  instruction 1
  instruction 2
  instruction 3  ← NETWORK CARD INTERRUPT! Packet arrived.
    │
    ▼ CPU saves registers, switches to kernel mode
  ┌────────────────────────────────────────┐
  │ Interrupt Handler:                      │
  │   Read packet from NIC buffer           │
  │   Copy to socket receive buffer         │
  │   Wake up process waiting on read()     │
  └────────────────────────────────────────┘
    │
    ▼ CPU restores registers, continues your code
  instruction 4
  instruction 5

TYPES OF INTERRUPTS:
  Hardware interrupts: NIC (packet arrived), disk (I/O complete), timer (time slice expired)
  Software interrupts (traps): syscall instruction, page fault, division by zero
  
  Timer interrupt: fires every 1-10ms (configurable). This is how the scheduler
  preempts running processes — the timer interrupt gives the kernel a chance to
  check if the current process has used its time slice and switch to another.

SOFTIRQ / BOTTOM HALF:
  Some interrupt work is too long for the interrupt handler (which must be FAST).
  Solution: interrupt handler does minimal work (acknowledge hardware, copy data),
  then schedules a "softirq" or "tasklet" to do the rest later.
  Network packet processing uses this: interrupt copies packet, softirq processes TCP/IP stack.
```

### Why Interrupts Matter for Your Application

```
1. TIMER INTERRUPT → PREEMPTIVE SCHEDULING
   Without timer interrupts, a CPU-bound loop would never give up the CPU.
   The timer interrupt forces the scheduler to check: "should another thread run?"
   This is why your 100 threads all make progress — each gets a time slice (~1-10ms).

2. NETWORK INTERRUPT → I/O NOTIFICATION
   When data arrives on a socket, the NIC interrupts the CPU.
   The kernel copies data to the socket buffer and wakes up the thread
   that was blocked in read() or select()/epoll().
   This is why NIO Selector.select() returns — the kernel woke it via interrupt.

3. PAGE FAULT INTERRUPT → VIRTUAL MEMORY
   When your code accesses a page that's not in physical memory:
   CPU generates a page fault → kernel loads the page from disk → continues your code.
   This is transparent to your program but can add milliseconds of latency
   (if the page must come from disk).

4. SAFEPOINT → JVM USES TIMER INTERRUPTS (indirectly)
   The JVM's safepoint mechanism for GC uses a "poll" approach:
   it writes to a protected memory page, causing a SIGSEGV (page fault),
   which the JVM's signal handler intercepts to bring threads to a safepoint.
```

---

## 5. The Boot Process — From Power On to Your Application

Understanding the boot process helps you understand container startup time, init systems (systemd), and why certain things must happen in a specific order.

```
1. BIOS/UEFI (firmware):
   Hardware self-test (POST)
   Find bootable device (disk, USB, network)
   Load bootloader from first sector
   
2. BOOTLOADER (GRUB):
   Display boot menu (kernel selection)
   Load Linux kernel image into memory
   Load initial RAM disk (initrd/initramfs)
   Pass control to kernel
   
3. KERNEL INITIALIZATION:
   Decompress itself
   Initialize memory management (page tables)
   Initialize process scheduler
   Mount initramfs as temporary root filesystem
   Detect hardware, load device drivers
   Mount real root filesystem
   Start PID 1 (init process)
   
4. INIT SYSTEM (systemd on modern Linux):
   PID 1 — the first user-space process
   Starts services in dependency order:
     networking → sshd → docker → your-application
   Manages service lifecycle (restart on crash, logging)
   
5. YOUR APPLICATION:
   systemd starts: java -jar your-app.jar
   JVM loads: mmap() for heap, clone() for threads
   Spring Boot initializes: class loading, bean creation, server startup
   Listening on port: socket(), bind(), listen()
   → ready to serve requests

CONTAINER BOOT (Docker):
   Steps 1-4 already done (on the HOST)
   Container starts at step 5:
     Create namespaces + cgroups → exec your process
     No kernel boot, no init system (PID 1 IS your process)
     This is why containers start in milliseconds vs minutes for VMs.
```

---

## 6. How Java Maps to the Operating System

This section bridges your Java Internals knowledge to the OS layer:

```
JAVA CONCEPT              OS CONCEPT                SYSCALL
─────────────────────────────────────────────────────────────────
new Object()              Heap allocation            mmap() (for new TLAB/arena)
Thread.start()            Create OS thread           clone(CLONE_VM | CLONE_FS | ...)
synchronized              Futex (fast userspace)     futex() (only on contention)
Thread.sleep(100)         Remove from run queue      nanosleep()
socket.connect()          TCP connection             connect()
inputStream.read()        Read from file/socket      read() or recvfrom()
outputStream.write()      Write to file/socket       write() or sendto()
Files.readAllBytes()      Open + read + close        openat() + read() + close()
System.gc()               (no direct OS call)        JVM manages heap internally
Runtime.exec("ls")        Fork + exec               fork() + execve()
FileChannel.map()         Memory-map a file          mmap()
JVM startup               Load and execute binary    execve("java") → mmap() heap

THE JVM IS A PROCESS:
  One process per JVM instance
  Java threads = OS threads (1:1 via NPTL/clone)
  JVM heap = mmap'd anonymous memory
  JNI = direct syscalls from Java through native code
  GC pauses = the OS scheduler suspends GC-blocked threads
```

---

## 7. Best Practices and Use Cases

```
WHERE OS KNOWLEDGE HELPS IN REAL WORK:

PERFORMANCE TUNING:
  "App is slow" → is it CPU-bound, I/O-bound, or memory-bound?
  → top: check CPU%, I/O wait%, memory usage
  → if CPU% high: profile with perf/async-profiler → find hot methods
  → if I/O wait high: check disk (iostat) or network (ss) → fix slow queries or add caching
  → if memory pressure: check swap activity (vmstat) → increase heap or fix leak

CONTAINER SIZING:
  Docker --memory=2g --cpus=2
  → OS enforces via cgroups: memory.limit_in_bytes, cpu.cfs_quota_us
  → JVM sees cgroup limits (Java 10+): auto-adjusts -Xmx and GC threads
  → Set JVM heap to ~75% of container memory (leave room for native memory, page cache)

DEBUGGING PRODUCTION INCIDENTS:
  "Process was killed with no log entry"
  → dmesg | grep -i oom → OOM killer struck → process consumed too much memory
  → Increase memory limit or fix the memory leak

  "Application hangs, CPU is 0%"
  → thread dump: all threads WAITING or BLOCKED → deadlock or resource exhaustion
  → strace: stuck in futex() or read() → waiting for lock or I/O that never completes

  "Connection refused errors"
  → ss -tlnp: is the port open? Is the process running?
  → ss -s: how many connections? Hit connection limit?
  → check backlog queue: net.core.somaxconn
```

---

*After this phase: you understand what the kernel does, why the user/kernel boundary exists, how system calls work, and how your Java code maps to OS operations. You can use strace to observe your application's kernel interactions. You have the mental model for everything that follows.*
