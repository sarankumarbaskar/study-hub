# Phase 6 — Containers and Virtualization: How Docker Actually Works

> Docker is NOT a virtual machine. It's a process with namespace isolation and resource limits. Understanding this at the kernel level changes how you think about container sizing, security, networking, and performance.

When you run `docker run -d --memory=512m --cpus=2 -p 8080:8080 my-app`, here's what ACTUALLY happens: the Docker daemon calls `clone()` with specific namespace flags (creating isolated views of PID, network, filesystem, etc.), sets up cgroup limits (512MB memory, 2 CPUs), layers an overlay filesystem (your image), and runs your application as a regular Linux process. There's no hypervisor, no guest kernel, no hardware emulation. Your container IS a process — just with walls around it.

---

## 1. Linux Namespaces — The Isolation Mechanism

Namespaces give each container its own isolated view of specific system resources. A process in a container sees only its own PIDs, its own network stack, its own filesystem — unaware that hundreds of other containers exist on the same host.

```
NAMESPACE    ISOLATES              WHAT THE CONTAINER SEES
──────────────────────────────────────────────────────────────────────
pid          Process IDs           Only its own processes (PID 1 = your app)
net          Network stack         Its own interfaces, routing table, iptables
mnt          Filesystem mounts     Its own root filesystem (overlay from image)
uts          Hostname              Its own hostname (docker run --hostname)
ipc          IPC (shared memory)   Its own shared memory segments, semaphores
user         User/Group IDs        Root inside container = non-root on host (if configured)
cgroup       cgroup visibility     Sees only its own cgroup hierarchy (Linux 4.6+)

CREATING NAMESPACES (what Docker does under the hood):
  clone(CLONE_NEWPID | CLONE_NEWNET | CLONE_NEWNS | CLONE_NEWUTS | CLONE_NEWIPC)
  
  Or for an existing process:
  unshare(CLONE_NEWPID)  → create new PID namespace for current process

PID NAMESPACE EXAMPLE:
  Host sees:
    PID 1:    systemd
    PID 1234: dockerd
    PID 5678: java -jar app.jar  (your container's app)
    PID 5679: java GC thread
    
  Container sees:
    PID 1: java -jar app.jar  (thinks it's PID 1!)
    PID 2: java GC thread
    
  The container has NO IDEA about systemd, dockerd, or any other process.
  From inside: ps aux shows only container processes.
  From outside: the host can see ALL processes (including container's).

NETWORK NAMESPACE:
  Each container gets its own:
    eth0 interface (virtual, connected to Docker bridge)
    Routing table
    iptables rules
    Port bindings (container's port 8080 != host's port 8080)
  
  Docker networking:
    Container eth0 ←→ veth pair ←→ docker0 bridge ←→ host eth0
    -p 8080:8080 = iptables DNAT rule: host:8080 → container:8080
```

---

## 2. cgroups — The Resource Limiting Mechanism

Namespaces provide **isolation** (what you can see). cgroups provide **limits** (how much you can use). Together, they make containers work.

```
WHAT CGROUPS CONTROL:

MEMORY (memory cgroup):
  docker run --memory=512m
  → memory.limit_in_bytes = 536870912
  
  If the container exceeds 512MB:
    Kernel's cgroup OOM killer kills a process INSIDE the container
    (NOT the host's OOM killer — container failure is isolated)
  
  Memory accounting:
    RSS (anonymous pages) + page cache (file-backed pages) + kernel memory
    The page cache counts toward the limit!
    This is why a container with --memory=512m and a 256MB JVM heap
    may still OOM → the other 256MB is used by page cache + native memory

CPU (cpu cgroup):
  docker run --cpus=2
  → cpu.cfs_quota_us = 200000, cpu.cfs_period_us = 100000
  
  Meaning: in every 100ms period, this container can use 200ms of CPU time
  = 2 full CPU cores worth of compute
  
  If the container tries to use more: kernel THROTTLES it
  (puts the container's threads to sleep for the remainder of the period)
  
  CPU throttling is SILENT — no error, no log. Your app just runs slower.
  Monitor: cat /sys/fs/cgroup/cpu/docker/<id>/cpu.stat → nr_throttled
  
  CPU SHARES (soft limit — relative weight, not absolute):
  docker run --cpu-shares=1024  (default 1024)
  If container A has 1024 shares and B has 512 shares:
    A gets 2/3 of CPU when both are busy. If B is idle: A gets 100%.
  Shares only matter under CONTENTION.

I/O (blkio cgroup):
  docker run --device-read-bps=/dev/sda:100mb
  Limit disk read bandwidth to 100 MB/s for this container.
  Also: device-write-bps, device-read-iops, device-write-iops

JAVA AND CGROUP AWARENESS:
  Java 8u191+ and Java 10+: JVM reads cgroup limits
  -XX:+UseContainerSupport (default: true in modern JVMs)
  
  JVM auto-detects:
    Available CPUs: reads cpu.cfs_quota_us / cpu.cfs_period_us
    Available memory: reads memory.limit_in_bytes
    
  -XX:MaxRAMPercentage=75 → sets -Xmx to 75% of cgroup memory limit
  -XX:ActiveProcessorCount → overrides if cgroup CPU detection is wrong
  
  BEFORE Java 10: JVM saw HOST's 64 CPUs and 128GB RAM inside a 2-CPU, 2GB container
  → created 64 GC threads, set heap to 32GB → instant OOM
  → This was one of the most common Java-in-Docker bugs
```

---

## 3. Overlay Filesystem — How Docker Images Layer

```
A Docker image is NOT a VM disk image. It's a STACK OF LAYERS,
each layer being a directory of file changes (additions, modifications, deletions).

IMAGE LAYERS (read-only):
  Layer 1 (base): Ubuntu 22.04 (base OS files)
  Layer 2: apt-get install openjdk-17 (adds JDK files)
  Layer 3: COPY app.jar /app/ (adds your application)

CONTAINER LAYER (read-write):
  Layer 4 (thin): Container writes go here (logs, temp files, etc.)

HOW OVERLAY FILESYSTEM MERGES THEM:
  ┌─────────────────────────────────┐ ← What the container sees
  │  / (merged view)                 │    (unified filesystem)
  │    /usr/bin/java (from layer 2)  │
  │    /app/app.jar (from layer 3)   │
  │    /tmp/output.log (from layer 4)│ ← container wrote this
  └─────────────────────────────────┘
          │ overlayfs merges │
  Layer 4 (upperdir, read-write):  /tmp/output.log
  Layer 3 (lowerdir, read-only):   /app/app.jar
  Layer 2 (lowerdir, read-only):   /usr/bin/java, /usr/lib/jvm/...
  Layer 1 (lowerdir, read-only):   /bin/bash, /lib/...

COPY-ON-WRITE:
  When the container MODIFIES a file from a lower layer:
    1. File is COPIED from lower layer to upper layer (container layer)
    2. Modification happens on the COPY
    3. Lower layer file is UNCHANGED (other containers using same image are unaffected)
  
  This is why: docker images are SHARED between containers
    10 containers from the same image: share ALL read-only layers
    Each container has only its thin read-write layer (~MB, not GB)

IMPLICATIONS:
  - Image layers are CACHED (docker build only rebuilds changed layers)
  - Put frequently-changing files in LATER Dockerifle instructions
  - Minimize layer size (combine RUN commands, clean up in same layer)
  - Don't write large files in the container layer (use volumes for data)
```

---

## 4. Container vs Virtual Machine — When to Use Each

```
CONTAINER:
  ┌─────────────────┐  ┌─────────────────┐
  │ App A            │  │ App B            │
  │ (your Java app)  │  │ (Python service) │
  ├─────────────────┤  ├─────────────────┤
  │ Container runtime│  │ Container runtime│
  ├─────────────────┴──┴─────────────────┤
  │          HOST LINUX KERNEL            │  ← shared kernel!
  ├───────────────────────────────────────┤
  │          HOST HARDWARE                │
  └───────────────────────────────────────┘
  
  Startup: milliseconds (just fork a process)
  Memory: MBs (no guest kernel)
  Isolation: process-level (namespaces + cgroups)
  Security: moderate (shared kernel = shared vulnerabilities)

VIRTUAL MACHINE:
  ┌─────────────────┐  ┌─────────────────┐
  │ App A            │  │ App B            │
  ├─────────────────┤  ├─────────────────┤
  │ Guest Kernel     │  │ Guest Kernel     │  ← separate kernel per VM!
  ├─────────────────┤  ├─────────────────┤
  │ Virtual Hardware │  │ Virtual Hardware │
  ├─────────────────┴──┴─────────────────┤
  │         HYPERVISOR (KVM/Xen)          │
  ├───────────────────────────────────────┤
  │          HOST HARDWARE                │
  └───────────────────────────────────────┘
  
  Startup: seconds to minutes (boot an entire OS)
  Memory: GBs (full kernel + OS)
  Isolation: hardware-level (separate kernel, separate memory)
  Security: strong (kernel vulnerability in guest doesn't affect host)

WHEN TO USE WHICH:
  Container: same-trust applications, microservices, CI/CD, dev environments
  VM: multi-tenant isolation (cloud providers), running different OSes, legacy apps
  
  AWS runs YOUR containers inside VMs (Firecracker micro-VMs) for security
  → VM isolation between customers, container efficiency within each customer

Firecracker (AWS Lambda / Fargate):
  Micro-VM: boots in <125ms, ~5MB memory overhead
  Combines VM security with near-container speed
  Used for: serverless functions, container-as-a-service
```

---

## 5. Container Networking

```
DOCKER BRIDGE (default):
  ┌───────────────────────────────────────────────────┐
  │ Host                                               │
  │                                                     │
  │  ┌─────────┐  ┌─────────┐     docker0 bridge       │
  │  │Container │  │Container │    (172.17.0.1)         │
  │  │ A        │  │ B        │         │                │
  │  │eth0      │  │eth0      │         │                │
  │  │172.17.0.2│  │172.17.0.3│         │                │
  │  └───┬──────┘  └───┬──────┘         │                │
  │      │veth pair    │veth pair       │                │
  │      └─────────────┴────────────────┘                │
  │                     │                                │
  │                host eth0 (10.0.1.5)                   │
  │                     │ NAT (iptables MASQUERADE)       │
  └─────────────────────┼───────────────────────────────┘
                        │
                    Internet

  Container → Container (same host): via docker0 bridge (layer 2)
  Container → Internet: NAT through host's IP (iptables)
  Internet → Container: port mapping (-p 8080:8080) via iptables DNAT

KUBERNETES NETWORKING:
  Every pod gets a unique IP address (no NAT between pods)
  Pod-to-pod: flat network (CNI plugin: Calico, Flannel, Cilium)
  Service: stable virtual IP (ClusterIP) → kube-proxy load balances to pods
  External: Ingress controller (Nginx/Traefik) → routes HTTP to services
```

---

## 6. Container Security

```
WHAT CONTAINERS DON'T ISOLATE:
  The kernel! All containers share the host kernel.
  A kernel exploit in ANY container compromises the HOST.
  /proc and /sys: may expose host information to containers
  
SECURITY MECHANISMS:
  seccomp: restrict which SYSCALLS a container can make
    Default Docker seccomp profile blocks ~44 dangerous syscalls
    (reboot, mount, modify kernel modules, access raw network, etc.)
    
  AppArmor / SELinux: mandatory access control
    Restrict file access, network access, capabilities
    Even root inside the container is limited
    
  Capabilities: fine-grained root powers
    Instead of "root can do everything":
    CAP_NET_BIND_SERVICE: bind to ports <1024 (without full root)
    CAP_SYS_ADMIN: mount filesystems, modify namespaces
    Docker drops most capabilities by default
    
  Rootless containers: container runtime runs as non-root user
    Even if an attacker escapes the container: they're a non-root user on the host
    Podman supports rootless natively. Docker supports it since 20.10.

  Read-only filesystem: docker run --read-only
    Container can't write to the filesystem → prevents many attacks
    Use tmpfs for /tmp: --tmpfs /tmp

BEST PRACTICES:
  ✓ Don't run as root inside the container (USER directive in Dockerfile)
  ✓ Use minimal base images (distroless, Alpine) → smaller attack surface
  ✓ Scan images for vulnerabilities (Trivy, Snyk)
  ✓ Don't expose the Docker socket (/var/run/docker.sock) to containers
  ✓ Use read-only filesystem where possible
  ✓ Set resource limits (memory, CPU) → prevent resource exhaustion attacks
  ✓ Keep images updated (security patches)
```

---

## 7. Container Performance

```
CPU THROTTLING (the silent killer):
  --cpus=2 → cfs_quota_us=200000, cfs_period_us=100000
  
  If your container has a burst of CPU usage (GC pause, request spike):
    JVM GC needs 100% of 4 CPUs for 200ms → but limit is 2 CPUs
    Kernel throttles: GC takes 400ms instead of 200ms
    Application latency doubles during GC!
  
  DETECTION: check cpu.stat: nr_throttled, throttled_time
    $ cat /sys/fs/cgroup/cpu/docker/<id>/cpu.stat
    nr_periods 10000
    nr_throttled 523     ← 5.2% of periods were throttled!
    throttled_time 89342144000  ← 89 seconds total throttled time
  
  FIX: give more CPU than average needs (headroom for bursts)
       or use --cpu-shares (soft limit) instead of --cpus (hard limit)

MEMORY:
  --memory=2g → container can use 2GB total (RSS + page cache)
  JVM heap = 1.5GB → only 512MB left for page cache, native memory, threads
  If page cache eviction is aggressive → more disk I/O → slower
  
  FIX: right-size container memory
       JVM heap = 75% of container memory (not 90% — leave room for non-heap)

I/O:
  Overlay filesystem: slight overhead for file operations (path lookups through layers)
  Volumes (docker -v): native filesystem performance (bypasses overlay)
  tmpfs (docker --tmpfs): in-memory filesystem for temp data (fastest possible)
  
  ALWAYS use volumes for: database data, logs, application data
  NEVER write high-I/O data to the container layer (overlay overhead + layer growth)
```

---

*After this phase: you understand that Docker is namespaces + cgroups + overlay FS, not a VM. You can explain PID, network, and mount namespaces. You can diagnose CPU throttling, size container memory for JVM applications, and implement container security best practices. You understand Kubernetes networking at the kernel level.*
