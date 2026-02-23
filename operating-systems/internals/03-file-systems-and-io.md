# Phase 3 — File Systems and I/O: How Data Gets From Code to Disk

> Every `write()` in your application travels through 6 layers before hitting the physical storage medium. Understanding this journey explains write durability, I/O performance, and why `fsync()` matters for databases.

When your Java application writes data to a file or a database commits a transaction, that data travels through a long pipeline: your application buffer → JVM → libc → system call → kernel VFS → filesystem → block I/O layer → device driver → disk controller → physical media. At each layer, data may be cached, buffered, reordered, or batched for performance. Understanding this pipeline is essential for understanding when data is truly safe (durable) and why I/O performance varies so dramatically depending on the access pattern.

---

## 1. File System Basics — How Files Are Actually Stored

### Inodes and Data Blocks

A file on disk consists of two parts: the **inode** (metadata) and **data blocks** (actual content). An inode contains everything about the file EXCEPT its name and content.

```
INODE (metadata — one per file):
  inode number:     unique identifier within the filesystem
  file type:        regular, directory, symlink, socket, pipe
  permissions:      rwxr-xr-x (owner/group/other)
  owner UID/GID:    who owns it
  size:             file size in bytes
  timestamps:       atime (accessed), mtime (modified), ctime (changed)
  link count:       number of hard links pointing to this inode
  block pointers:   addresses of data blocks on disk

DATA BLOCKS (content — variable number):
  Actual file data stored in fixed-size blocks (typically 4KB in ext4)
  Small file (< 4KB): one block
  Large file (1GB): ~262,144 blocks

DIRECTORY:
  A directory is just a special file containing: (name → inode number) mappings
  
  $ ls -li /home/user/
  12345  -rw-r--r--  config.json
  12346  -rw-r--r--  app.log
  12347  drwxr-xr-x  data/
  
  The directory file contains: "config.json" → inode 12345, "app.log" → inode 12346
  File NAMES live in the directory, not in the inode
  This is why hard links work: two names → same inode → same data

IMPLICATIONS:
  Renaming a file (in same directory): change ONE directory entry → instant O(1)
  Moving a file (across filesystems): copy all data + delete original → slow O(n)
  Deleting a file: remove directory entry, decrement link count
    If link count reaches 0 AND no process has the file open → free inode + blocks
    If a process still has it open → data stays until process closes it
    (This is how "deleted but still using disk space" happens in production)
```

---

## 2. The I/O Stack — The Complete Journey

```
YOUR CODE:
  outputStream.write("hello".getBytes());
        │
        ▼
JAVA/JVM:
  BufferedOutputStream → buffer (8KB default, flushes when full)
  When buffer full → native write() call
        │
        ▼
LIBC (C library):
  write() wrapper → prepares syscall arguments
        │
        ▼
SYSTEM CALL (mode switch: Ring 3 → Ring 0):
  sys_write(fd, buffer, length)
        │
        ▼
VFS (Virtual File System):
  Abstract layer that provides uniform interface over ALL filesystems
  Determines: which filesystem owns this file? (ext4, XFS, NFS, tmpfs, procfs)
  Calls the filesystem-specific write function
        │
        ▼
FILESYSTEM (e.g., ext4):
  Find inode → find data blocks → write data into page cache
  Mark pages as DIRTY (modified but not yet on disk)
  Return to user space (write() returns SUCCESS)
  NOTE: data is NOT on disk yet! It's in the page cache.
        │
        ▼
PAGE CACHE (kernel RAM):
  Dirty pages accumulate (kernel buffers writes for efficiency)
  Background kernel thread (pdflush/writeback) periodically flushes dirty pages to disk
  Default: flush every 5 seconds (vm.dirty_writeback_centisecs = 500)
  Or when dirty pages exceed threshold (vm.dirty_ratio = 20% of RAM)
        │
        ▼
BLOCK I/O LAYER:
  Merges adjacent writes → single large I/O (elevator algorithm)
  Schedules I/O operations for the device driver
        │
        ▼
DEVICE DRIVER:
  Translates generic block I/O to device-specific commands
  NVMe driver → NVMe command queue
  SATA driver → AHCI commands
        │
        ▼
DISK CONTROLLER:
  May have its own write-back cache (volatile!)
  Executes the actual disk write
        │
        ▼
PHYSICAL MEDIA:
  SSD: writes to flash memory cells (with wear leveling, garbage collection)
  HDD: moves head to correct track, waits for sector rotation, magnetizes surface
```

---

## 3. Durability — When Is Your Data Actually Safe?

This is one of the most important topics for anyone working with databases, financial systems, or any application where data loss is unacceptable.

```
write() returns SUCCESS:
  Data is in the PAGE CACHE (kernel RAM). NOT on disk.
  If the MACHINE loses power NOW: DATA IS LOST.
  If the PROCESS crashes: data is SAFE (it's in the kernel, not the process).
  If the KERNEL crashes: DATA IS LOST (page cache is volatile).

fsync(fd):
  Forces ALL dirty pages for this file to be written to the DISK CONTROLLER.
  Waits until the disk controller acknowledges the write.
  AFTER fsync returns: data is safe on disk (survives power loss).
  
  BUT: if the disk controller has a VOLATILE write cache:
    Data might be in the controller's cache, not on physical media
    Disk firmware LIES about completion → data loss risk!
    Enterprise SSDs and HDDs: battery-backed cache → safe
    Consumer SSDs: volatile cache → fsync may not be truly durable
    
  This is why databases care about "disk write barrier" and "flush on commit."

fdatasync(fd):
  Like fsync, but skips metadata updates (file size, timestamps) if unchanged.
  Faster than fsync for writes that don't change file size.
  Databases use fdatasync for WAL (Write-Ahead Log) flushes.

O_SYNC / O_DSYNC:
  Open a file with O_SYNC: every write() is automatically followed by fsync()
  Extremely slow (one disk I/O per write) but maximally durable.
  Used by: WAL writes in some database configurations.

WHEN TO USE fsync:
  Database WAL: fsync on every commit (or fdatasync) → transaction durability
  File uploads: fsync after write completes → don't lose uploaded data
  Configuration writes: write to temp file → fsync → rename → fsync directory
  
  DON'T fsync everything: it kills I/O throughput. Only fsync critical data.
  The page cache's batching (flush every 5s) is fine for non-critical data.
```

---

## 4. Journaling — How Filesystems Survive Crashes

```
THE PROBLEM:
  Creating a file requires multiple disk writes:
    1. Allocate inode
    2. Write inode data
    3. Add directory entry
    4. Update free block bitmap
  
  If power fails between step 2 and step 3:
    Inode exists but no directory entry → orphaned inode → wasted space
    Directory entry exists but inode is incomplete → corrupted file
  
SOLUTION: JOURNALING (write-ahead log)
  Before making changes to the filesystem:
    1. Write ALL planned changes to a JOURNAL (sequential log on disk)
    2. Flush journal to disk (fsync)
    3. Apply changes to the actual filesystem structures
    4. Mark journal entry as complete
  
  If crash during step 3:
    On reboot: replay the journal → apply missing changes → filesystem is consistent
  
  ext4 journal modes:
    journal:     journal data + metadata (safest, slowest — rarely used)
    ordered:     journal metadata, write data before metadata (default — good balance)
    writeback:   journal metadata only, data may be written after (fastest, data may be stale)

WHY DATABASES USE THEIR OWN WAL:
  Filesystem journaling protects filesystem METADATA (inodes, directories)
  It does NOT guarantee your APPLICATION DATA is consistent
  Databases (PostgreSQL, MySQL) write their own Write-Ahead Log (WAL/binlog)
  to guarantee that committed transactions survive crashes
```

---

## 5. File Descriptors — The Universal I/O Abstraction

```
WHAT A FILE DESCRIPTOR IS:
  An integer index into the process's FILE DESCRIPTOR TABLE
  The table maps integers to kernel objects:
  
  fd  →  Kernel Object
  0   →  terminal stdin (keyboard input)
  1   →  terminal stdout (screen output)
  2   →  terminal stderr (error output)
  3   →  /var/log/app.log (opened file)
  4   →  TCP socket to 10.0.1.5:5432 (database connection)
  5   →  epoll instance (monitoring other fds)
  6   →  Unix domain socket (IPC)
  7   →  pipe (connected to child process)
  
  EVERYTHING IS A FILE in Unix:
    Regular files, directories, sockets, pipes, devices, /proc, /sys
    All accessed through the same read()/write()/close() interface
    This is the VFS (Virtual File System) abstraction

LIMITS:
  Per-process: ulimit -n (default 1024 on most systems)
    1024 file descriptors = max 1024 open files + sockets + pipes
    For a server with 10,000 connections: NOT ENOUGH!
    FIX: ulimit -n 65536 (or /etc/security/limits.conf)
  
  System-wide: /proc/sys/fs/file-max (default ~100,000-1,000,000)
    Total file descriptors across ALL processes
    FIX: sysctl fs.file-max=2097152

"TOO MANY OPEN FILES" ERROR:
  java.io.IOException: Too many open files
  
  Diagnosis:
    $ ls -la /proc/<pid>/fd | wc -l    # how many fds is this process using?
    $ lsof -p <pid> | wc -l             # what are they?
    $ lsof -p <pid> | grep socket       # how many sockets?
    
  Common causes:
    Connection leak: opening DB connections without closing (no try-with-resources!)
    File leak: opening files without closing
    Accumulating connections: server accepts clients but never closes them
  
  Fix: close resources properly (try-with-resources in Java), increase ulimit
```

---

## 6. Direct I/O — Bypassing the Page Cache

```
NORMAL I/O: application → page cache → disk (OS manages caching)
DIRECT I/O: application → disk (bypasses page cache entirely)

WHEN TO USE DIRECT I/O:
  Databases: PostgreSQL, MySQL InnoDB manage their own buffer pool
    They KNOW which pages to cache better than the OS does
    Using page cache = double caching (DB buffer pool + page cache) → wasted RAM
    O_DIRECT: let the database manage its own cache, skip the OS page cache
    
  Large sequential reads: streaming huge files that won't be re-read
    Page cache polluted with one-time data → evicts frequently-read data
    O_DIRECT: read without polluting the page cache

WHEN NOT TO USE DIRECT I/O:
  Application code: let the OS cache your files (it's very good at it)
  Kafka: deliberately uses page cache (sequential writes + reads from tail = perfect for page cache)
  General file I/O: page cache gives you free read caching

  int fd = open("datafile", O_RDWR | O_DIRECT);
  // Reads/writes bypass page cache
  // Buffer must be memory-aligned (posix_memalign)
  // Performance: predictable latency (no page cache variability)
  //              but no caching benefit for repeated reads
```

---

## 7. I/O Best Practices

```
FOR APPLICATION DEVELOPERS:
  ✓ Use BufferedInputStream/BufferedOutputStream (reduce syscall count)
  ✓ Close resources with try-with-resources (prevent fd leaks)
  ✓ Use appropriate buffer sizes: 8KB-64KB for file I/O
  ✓ Use sequential I/O when possible (100x faster than random on HDD, 4x on SSD)
  ✓ Use NIO for file operations (FileChannel, MappedByteBuffer)

FOR SYSTEM ADMINISTRATORS:
  ✓ Monitor I/O with iostat: watch %util, await (ms per I/O), IOPS
  ✓ If await > 10ms on SSD: I/O subsystem saturated → upgrade disk or reduce I/O
  ✓ Set vm.dirty_ratio and vm.dirty_background_ratio for write-heavy workloads
  ✓ Use ext4 or XFS (both are battle-tested; XFS better for very large files)
  ✓ Enable noatime mount option (don't update access time on every read)

FOR DATABASE ADMINISTRATORS:
  ✓ Use fsync/fdatasync for WAL durability (transactions MUST be durable)
  ✓ Consider O_DIRECT for database data files (avoid double-caching)
  ✓ Place WAL on separate disk from data files (separate I/O paths)
  ✓ Use battery-backed write cache on RAID controllers (safe fsync acceleration)
```

---

*After this phase: you understand how data travels from your code to the physical disk through 6 layers. You know why `write()` returning success doesn't mean your data is on disk. You can explain fsync, journaling, and file descriptors. You can diagnose "too many open files" errors and I/O performance problems.*
