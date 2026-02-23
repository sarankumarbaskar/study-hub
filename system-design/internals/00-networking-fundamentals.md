# Phase 0 — Networking Fundamentals: How Computers Actually Talk

> Every distributed system is just computers sending bytes to each other over a wire. If you don't understand how those bytes travel, you can't reason about latency, failure, or scale.

Networking is the invisible foundation under everything you build. When your API call takes 500ms, is it the database? The network? DNS? A congested switch? When your microservice can't reach another service, is the port blocked? The DNS stale? The load balancer misconfigured? When your interview asks "how would you design a chat system," they're really asking: "do you understand TCP connections, WebSocket upgrades, connection limits, and what happens when a million users are online simultaneously?"

This phase builds your understanding from the physical wire to the application layer — not as academic theory, but as practical engineering knowledge you'll use every day.

---

## 1. What Happens When You Type a URL — The Complete Journey

Before diving into individual concepts, let's trace the entire journey of a single HTTP request. This is the question that ties everything together, and it's a favorite in interviews because the answer reveals exactly how deep your understanding goes.

**You type `https://www.example.com/api/users` and press Enter:**

```
Step 1: URL Parsing (Browser)
  Browser splits the URL:
    Protocol: https
    Hostname: www.example.com
    Port: 443 (default for HTTPS)
    Path: /api/users

Step 2: DNS Resolution (~1-100ms)
  Browser checks: DNS cache → OS cache → Router cache → ISP DNS → Root DNS
  Result: www.example.com → 93.184.216.34

Step 3: TCP Connection (~1-50ms per round-trip)
  Browser opens a TCP connection to 93.184.216.34:443
  Three-way handshake: SYN → SYN-ACK → ACK
  This costs ONE full round-trip time (RTT)

Step 4: TLS Handshake (~1-2 additional round-trips)
  ClientHello → ServerHello + Certificate → Key Exchange → Finished
  Establishes encrypted channel
  TLS 1.3 reduces this to 1 round-trip (or 0 with session resumption)

Step 5: HTTP Request
  Browser sends:
    GET /api/users HTTP/1.1
    Host: www.example.com
    Accept: application/json
    Connection: keep-alive

Step 6: Server Processing
  Load balancer → web server → application → database → response

Step 7: HTTP Response
  Server sends:
    HTTP/1.1 200 OK
    Content-Type: application/json
    Content-Length: 1234
    {"users": [...]}

Step 8: Rendering
  Browser parses JSON, updates UI

TOTAL MINIMUM LATENCY:
  DNS:        1 RTT  (if not cached)
  TCP:        1 RTT  (three-way handshake)
  TLS:        1-2 RTT (handshake)
  HTTP:       1 RTT  (request + response)
  ─────────────────
  MINIMUM:    4-5 RTTs before first byte of data arrives

  If RTT = 50ms (cross-continent): 200-250ms just for network overhead
  If RTT = 1ms (same datacenter): 4-5ms
  This is why CDNs, connection reuse, and HTTP/2 exist.
```

---

## 2. The OSI Model and TCP/IP — Understanding the Layers

### Why Layers Exist

Networking is impossibly complex if you try to think about everything at once: electrical signals, error correction, routing, encryption, application data. The **layered model** breaks this complexity into independent concerns. Each layer provides a service to the layer above it and uses the service of the layer below it. You can replace one layer's implementation without affecting the others — this is why you can run HTTP over Wi-Fi, Ethernet, or cellular with zero changes to your application.

### The Practical Model (TCP/IP)

The OSI 7-layer model is academically pure but nobody uses it in practice. The real internet uses the **TCP/IP model** with 4 layers. Here's what each layer does, in simple language, with what you actually need to know:

```
Layer 4: APPLICATION (HTTP, DNS, FTP, SMTP, gRPC, WebSocket)
  What it does: Defines the FORMAT and MEANING of messages
  Your code lives here: "GET /users", "SELECT * FROM users"
  You choose: HTTP vs gRPC vs WebSocket vs raw TCP
  Think of it as: the LANGUAGE two applications speak

Layer 3: TRANSPORT (TCP, UDP)
  What it does: Delivers data RELIABLY (TCP) or FAST (UDP) between processes
  Identified by: PORT numbers (80, 443, 5432, 9092)
  TCP gives you: ordering, reliability, flow control, congestion control
  UDP gives you: speed, simplicity, no guarantees
  Think of it as: the POSTAL SERVICE (TCP = registered mail, UDP = postcard)

Layer 2: INTERNET / NETWORK (IP, ICMP)
  What it does: Routes PACKETS across networks from source to destination
  Identified by: IP addresses (192.168.1.1, 10.0.0.5)
  Provides: best-effort delivery, fragmentation, TTL
  Does NOT guarantee: delivery, ordering, no duplicates
  Think of it as: the ADDRESSING SYSTEM (zip code + street address)

Layer 1: NETWORK ACCESS / LINK (Ethernet, Wi-Fi, ARP)
  What it does: Moves FRAMES between directly-connected devices
  Identified by: MAC addresses (aa:bb:cc:dd:ee:ff)
  Handles: physical transmission, error detection, local network delivery
  Think of it as: the PHYSICAL DELIVERY (the truck that drives between houses)
```

### How Data Flows Down and Up the Stack

```
SENDING (your app → network):

Application:  "GET /users HTTP/1.1\r\nHost: example.com\r\n\r\n"
                │
                ▼ add TCP header (src port, dst port, sequence number, flags)
Transport:    [TCP Header][HTTP data]
                │
                ▼ add IP header (src IP, dst IP, TTL, protocol)
Network:      [IP Header][TCP Header][HTTP data]
                │
                ▼ add Ethernet header (src MAC, dst MAC, type)
Link:         [Eth Header][IP Header][TCP Header][HTTP data][Eth Trailer]
                │
                ▼ convert to electrical signals / radio waves
Physical:     101010001110101010...

RECEIVING (network → their app):

Physical:     101010001110101010...
                │
                ▼ strip Ethernet header, check CRC
Link:         [IP Header][TCP Header][HTTP data]
                │
                ▼ strip IP header, check destination IP is ours
Network:      [TCP Header][HTTP data]
                │
                ▼ strip TCP header, reassemble segments, deliver to port
Transport:    [HTTP data]
                │
                ▼ deliver to application listening on that port
Application:  "GET /users HTTP/1.1\r\nHost: example.com\r\n\r\n"

Each layer ONLY talks to the same layer on the other side.
TCP on your machine ↔ TCP on the server.
IP on your machine ↔ IP on every router along the way.
This is why layers are powerful — each one is independent.
```

### What Travels Over the Wire — Packet Anatomy

```
A typical HTTP GET request over Ethernet:

┌─────────────────────────────────────────────────────────────────┐
│ Ethernet Header (14 bytes)                                       │
│   Dst MAC: aa:bb:cc:dd:ee:ff  (next-hop router)                │
│   Src MAC: 11:22:33:44:55:66  (your NIC)                       │
│   Type: 0x0800 (IPv4)                                           │
├─────────────────────────────────────────────────────────────────┤
│ IP Header (20 bytes)                                             │
│   Version: 4  │ Header Length: 5  │ Total Length: 215           │
│   TTL: 64     │ Protocol: 6 (TCP) │ Checksum: 0x1a2b           │
│   Src IP: 192.168.1.100    Dst IP: 93.184.216.34               │
├─────────────────────────────────────────────────────────────────┤
│ TCP Header (20 bytes)                                            │
│   Src Port: 52481    Dst Port: 443                              │
│   Sequence: 1001     Ack: 5001                                  │
│   Flags: PSH, ACK    Window: 65535                              │
├─────────────────────────────────────────────────────────────────┤
│ TLS Record (encrypted)                                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ HTTP Request (plaintext inside TLS):                     │   │
│   │   GET /api/users HTTP/1.1                                │   │
│   │   Host: www.example.com                                  │   │
│   │   Accept: application/json                               │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ Ethernet Trailer (4 bytes)                                       │
│   CRC checksum                                                   │
└─────────────────────────────────────────────────────────────────┘

Total on the wire: ~275 bytes for a simple GET request
Overhead: ~58 bytes of headers for ~160 bytes of HTTP data
This overhead is why HTTP/2 compresses headers (HPACK).
```

---

## 3. TCP — The Reliable Transport Protocol

### Why TCP Exists

The IP layer is **unreliable**: packets can be lost (router drops them), duplicated (retransmission creates copies), reordered (different routes through the internet), or corrupted (bit flips). TCP sits on top of IP and gives you the **illusion of a reliable, ordered byte stream** — like a pipe where bytes go in one end and come out the other in exactly the same order, with nothing lost or duplicated.

TCP achieves this through: sequence numbers (for ordering), acknowledgments (for detecting loss), checksums (for detecting corruption), retransmission (for recovering from loss), and flow/congestion control (for not overwhelming the receiver or the network). Understanding these mechanisms is essential for understanding connection costs, latency, and why protocols like HTTP/2 and QUIC exist.

### The Three-Way Handshake — Why Connections Are Expensive

Every TCP connection starts with a three-way handshake. This is not optional — it's how TCP establishes the shared state (sequence numbers, window sizes) needed for reliable communication.

```
Client                              Server
  │                                    │
  │───── SYN (seq=100) ──────────────►│  "I want to connect. My starting sequence is 100."
  │                                    │
  │◄──── SYN-ACK (seq=300,ack=101) ──│  "OK. My starting sequence is 300. I acknowledge your 100."
  │                                    │
  │───── ACK (ack=301) ──────────────►│  "I acknowledge your 300. Connection established."
  │                                    │
  │  ← Connection ESTABLISHED →        │  Both sides now know each other's sequence numbers
  │                                    │

TIME COST: 1 full round-trip (RTT)
  Same datacenter: ~0.5ms
  Same city: ~2-5ms
  Cross-continent: ~50-100ms
  Intercontinental: ~100-300ms

WHY THIS MATTERS:
  Every new HTTP/1.1 connection pays this cost
  HTTPS adds 1-2 MORE round-trips for TLS
  Opening a new connection to a DB: TCP + auth = 10-200ms
  This is why CONNECTION POOLING exists everywhere:
    HTTP keep-alive, database connection pools, gRPC persistent connections
```

### TCP Reliability — Sequence Numbers and Acknowledgments

```
SENDING DATA:

Client sends 3 segments:
  Segment 1: seq=100, data="Hello" (5 bytes)  → next expected: 105
  Segment 2: seq=105, data=" World" (6 bytes)  → next expected: 111
  Segment 3: seq=111, data="!" (1 byte)        → next expected: 112

Server acknowledges:
  ACK: ack=105  "I got everything up to byte 105"
  ACK: ack=112  "I got everything up to byte 112" (cumulative ACK)

IF SEGMENT 2 IS LOST:
  Server gets segment 1 (seq=100) → ACK 105
  Server gets segment 3 (seq=111) → can't process yet, out of order
  Server sends duplicate ACK: ack=105 "I'm still waiting for byte 105"
  Server sends duplicate ACK: ack=105 (again)
  Server sends duplicate ACK: ack=105 (third time)
  
  Client sees 3 duplicate ACKs → FAST RETRANSMIT (don't wait for timeout)
  Client resends segment 2 immediately
  Server gets it, now has 105-111 in buffer → ACK 112

RETRANSMISSION TIMEOUT (RTO):
  If no ACK arrives at all, client waits RTO (dynamically calculated)
  Initial RTO: ~1 second
  Doubles on each retry: 1s → 2s → 4s → 8s → 16s (exponential backoff)
  This is why a network partition causes LONG stalls, not instant failures
```

### Flow Control — Don't Overwhelm the Receiver

```
Flow control prevents a fast sender from overwhelming a slow receiver.

The receiver advertises its RECEIVE WINDOW — how many bytes it can buffer:

Client                                     Server
  │                                          │
  │─── data (1000 bytes) ──────────────────►│  Server buffer: 3000/4096 free
  │◄── ACK, window=3000 ──────────────────│  "I can accept 3000 more bytes"
  │                                          │
  │─── data (2000 bytes) ──────────────────►│  Server buffer: 1000/4096 free
  │◄── ACK, window=1000 ──────────────────│  "Slow down — only 1000 bytes left"
  │                                          │
  │─── data (1000 bytes) ──────────────────►│  Server buffer: 0/4096 free
  │◄── ACK, window=0 ─────────────────────│  "STOP! Buffer full."
  │                                          │
  │  (client STOPS sending)                  │  (server app reads data, frees buffer)
  │                                          │
  │◄── ACK, window=2048 ──────────────────│  "OK, I have space again"
  │─── data (2048 bytes) ──────────────────►│  Resumes sending

This is why a slow consumer (e.g., a mobile client on a weak connection)
causes the sender to slow down — TCP's flow control propagates backpressure
all the way from the receiver to the sender.
```

### Congestion Control — Don't Overwhelm the Network

```
Congestion control prevents senders from overwhelming ROUTERS in the network.
Even if the receiver can handle the data, intermediate routers might not.

The CONGESTION WINDOW (cwnd) limits how much data is "in flight" (sent but not yet ACKed).

SLOW START (exponential growth):
  cwnd = 1 MSS (Maximum Segment Size, typically 1460 bytes)
  For each ACK received: cwnd += 1 MSS
  Effect: cwnd doubles every RTT (1 → 2 → 4 → 8 → 16 → ...)

  cwnd: 1  ─► 2  ─► 4  ─► 8  ─► 16 ─► 32 ─►│ ssthresh (slow start threshold)
  RTT:  1     2     3     4     5     6       │
                                               ▼
  Switch to CONGESTION AVOIDANCE (linear growth):
  cwnd: 32 ─► 33 ─► 34 ─► 35 ─► ...

WHEN PACKET LOSS IS DETECTED:
  3 duplicate ACKs (fast retransmit):
    ssthresh = cwnd / 2
    cwnd = ssthresh  (cut in half, continue linear growth)

  Timeout (more severe):
    ssthresh = cwnd / 2
    cwnd = 1 MSS     (start over from scratch!)

WHY THIS MATTERS FOR YOUR APPLICATION:
  A new TCP connection starts with cwnd = ~14KB (10 segments in modern kernels)
  To send a 1MB response on a new connection:
    RTT 1: send 14KB
    RTT 2: send 28KB
    RTT 3: send 56KB
    RTT 4: send 112KB
    RTT 5: send 224KB
    RTT 6: send 448KB  → total ~880KB sent after 6 RTTs
  With 50ms RTT: ~300ms just for TCP slow start to ramp up!
  
  This is why:
  - HTTP keep-alive reuses connections (skip slow start)
  - HTTP/2 uses ONE connection with multiplexing
  - CDNs put servers close to users (lower RTT = faster ramp-up)
  - TCP initial cwnd was increased from 4 to 10 segments (Google research)
```

### TCP Connection Teardown — The Four-Way Handshake

```
Client                              Server
  │                                    │
  │───── FIN ────────────────────────►│  "I'm done sending."
  │◄──── ACK ────────────────────────│  "Got it."
  │                                    │  (server may still send data)
  │◄──── FIN ────────────────────────│  "I'm done sending too."
  │───── ACK ────────────────────────►│  "Got it."
  │                                    │
  │  TIME_WAIT (2 × MSL)              │  Client waits 2 × Maximum Segment Lifetime
  │  (typically 60 seconds)            │  before fully closing
  │                                    │

WHY TIME_WAIT EXISTS:
  If the final ACK is lost, the server will retransmit FIN
  The client must be able to re-ACK — so it keeps the connection state for 2×MSL
  
WHY TIME_WAIT CAUSES PROBLEMS:
  A busy server closing 10,000 connections/second accumulates 600,000 TIME_WAIT sockets
  Each socket holds: memory (~3.5KB on Linux) + port number
  Available ephemeral ports: ~28,000 (32768-60999)
  600,000 >> 28,000 → port exhaustion! New connections fail.

PRODUCTION FIXES:
  net.ipv4.tcp_tw_reuse = 1    # Reuse TIME_WAIT sockets for new connections
  net.ipv4.tcp_fin_timeout = 15 # Reduce FIN_WAIT_2 timeout
  Connection pooling           # Don't close connections — reuse them!
  HTTP keep-alive              # One connection serves many requests
```

### Nagle's Algorithm and TCP_NODELAY

```
NAGLE'S ALGORITHM:
  If there is unacknowledged data in flight AND the new data is small:
    Buffer it. Wait for the ACK before sending.
  Purpose: prevents sending lots of tiny packets (poor network utilization)

PROBLEM: Nagle + Delayed ACK = 200ms latency spikes
  Client sends small write → Nagle buffers it
  Server delays ACK for 200ms (delayed ACK timer)
  Nagle waits for ACK before sending → 200ms delay!

FIX: TCP_NODELAY = disable Nagle's algorithm
  Every write is sent immediately, regardless of size.
  Used by: gaming, real-time systems, interactive protocols
  
  // In Java:
  socket.setTcpNoDelay(true);
```

---

## 4. UDP — When Reliability Is Too Expensive

### What UDP Is

UDP (User Datagram Protocol) is TCP's minimalist cousin. It provides almost nothing: no connection setup, no reliability, no ordering, no flow control, no congestion control. You send a datagram, and it either arrives or it doesn't. If it arrives, it might arrive out of order. You have no way to know if it was received unless the application-level protocol includes its own acknowledgments.

This sounds terrible, but for certain use cases, TCP's reliability is actively harmful:

```
USE CASE: Video streaming (YouTube, Netflix, Twitch)
  TCP: lost packet → retransmit → video freezes while waiting for old data
  UDP: lost packet → skip it → minor visual glitch, video continues smoothly
  Viewer prefers: smooth video with occasional glitches over frozen video

USE CASE: Online gaming (Fortnite, League of Legends)
  TCP: player position from 200ms ago retransmitted, but we need CURRENT position
  UDP: send current position every 30ms, don't care if old ones are lost
  Player prefers: slight desync over input lag

USE CASE: DNS queries
  TCP: 3-way handshake (1 RTT) + query (1 RTT) = 2 RTTs minimum
  UDP: query + response = 1 RTT
  DNS prefers: speed (queries are small, loss is rare, just retry)

USE CASE: Voice/Video calls (Zoom, Teams)
  TCP: retransmitted audio from 500ms ago plays AFTER current audio → garbled
  UDP: lost audio packet → brief silence → continues with current audio
  User prefers: brief silence over garbled delayed audio
```

### TCP vs UDP — Decision Framework

```
Use TCP when:
  ✓ You need ALL data to arrive (file transfer, web pages, API calls, DB queries)
  ✓ You need data IN ORDER (command sequences, transaction logs)
  ✓ You need delivery confirmation (payments, messaging with read receipts)
  ✓ You're building on HTTP/HTTPS (which requires TCP, or QUIC over UDP)

Use UDP when:
  ✓ Speed matters more than completeness (live video, gaming, VoIP)
  ✓ You send the same data repeatedly (GPS coordinates every second)
  ✓ Stale retransmitted data is WORSE than no data (real-time systems)
  ✓ You need multicast/broadcast (service discovery, mDNS)
  ✓ You're building your own reliability on top (QUIC, custom game protocols)

Header comparison:
  TCP header: 20 bytes (sequence, ACK, flags, window, checksum, options)
  UDP header: 8 bytes (src port, dst port, length, checksum)
  UDP has 60% less overhead per packet
```

---

## 5. IP Addressing, Subnets, and Routing — How Packets Find Their Way

### IP Addresses — The Internet's Addressing System

An IP address is a logical address assigned to a network interface. Think of it as a postal address: the IP address tells routers where to send the packet, just like a zip code + street address tells the postal service where to deliver a letter.

```
IPv4: 32 bits = 4 octets
  192.168.1.100  → 11000000.10101000.00000001.01100100
  Maximum: ~4.3 billion addresses (exhausted since 2011!)

IPv6: 128 bits = 8 groups of 4 hex digits
  2001:0db8:85a3:0000:0000:8a2e:0370:7334
  Maximum: 340 undecillion addresses (enough for every atom on Earth)

Private IP ranges (RFC 1918) — used inside networks, not routable on internet:
  10.0.0.0/8       → 16.7 million addresses (large enterprises, cloud VPCs)
  172.16.0.0/12    → 1 million addresses (medium networks)
  192.168.0.0/16   → 65,536 addresses (home networks, small offices)

Special addresses:
  127.0.0.1        → localhost (loopback — talks to yourself)
  0.0.0.0          → "all interfaces" (server listens on all IPs)
  255.255.255.255  → broadcast (everyone on the local network)
```

### Subnets and CIDR — Dividing Networks

```
CIDR notation: 192.168.1.0/24
  /24 means: first 24 bits are the NETWORK part, last 8 bits are the HOST part
  Network: 192.168.1.___
  Hosts: 192.168.1.0 to 192.168.1.255 (256 addresses, 254 usable)
  Subnet mask: 255.255.255.0

Common CIDR blocks:
  /8:   16,777,216 addresses (10.0.0.0/8 — an entire cloud VPC)
  /16:  65,536 addresses (172.16.0.0/16 — a large subnet)
  /24:  256 addresses (192.168.1.0/24 — a typical LAN)
  /28:  16 addresses (a small subnet for a specific service group)
  /32:  1 address (a single host — used in routing tables)

AWS VPC example:
  VPC: 10.0.0.0/16 (65,536 IPs)
    Public subnet: 10.0.1.0/24 (256 IPs — load balancers, bastion hosts)
    Private subnet: 10.0.2.0/24 (256 IPs — application servers)
    Database subnet: 10.0.3.0/24 (256 IPs — RDS instances)
```

### NAT — How Private IPs Access the Internet

```
Your home network:
  Laptop: 192.168.1.100 (private)
  Phone: 192.168.1.101 (private)
  Router: 192.168.1.1 (private, internal) / 203.0.113.50 (public, external)

When laptop sends a packet to google.com:
  1. Laptop sends: src=192.168.1.100:52481, dst=172.217.14.206:443
  2. Router (NAT) rewrites: src=203.0.113.50:34567, dst=172.217.14.206:443
     (maps 192.168.1.100:52481 ↔ 203.0.113.50:34567 in NAT table)
  3. Google sees the packet from 203.0.113.50:34567 (your public IP)
  4. Google responds to 203.0.113.50:34567
  5. Router looks up NAT table: 34567 → 192.168.1.100:52481
  6. Router forwards to laptop

This is how millions of devices share one public IP address.
NAT is also a basic firewall: unsolicited inbound connections can't reach private IPs
unless explicitly port-forwarded.
```

### How Routing Works — Packet's Journey Across the Internet

```
You (192.168.1.100) → Google (172.217.14.206)

1. YOUR MACHINE checks routing table:
   Destination is NOT in 192.168.1.0/24 (local network)
   → send to DEFAULT GATEWAY (your router: 192.168.1.1)

2. YOUR ROUTER checks its routing table:
   Not directly connected → forward to ISP router (next hop)

3. ISP ROUTER checks its routing table (learned via BGP):
   172.217.0.0/16 → via Google's peering point
   → forward to Google's edge router

4. GOOGLE'S EDGE ROUTER:
   172.217.14.0/24 → directly connected
   → deliver to server 172.217.14.206

Each hop: router reads destination IP, looks up next hop, forwards packet.
Typically 10-15 hops across the internet.
Visible with: traceroute google.com
```

---

## 6. DNS — The Internet's Phone Book

### Why DNS Exists

Humans remember names (google.com), computers use numbers (172.217.14.206). DNS is the distributed database that translates between them. It's the first thing that happens in every network request, and when it fails, *everything* fails — your browser shows "DNS_PROBE_FINISHED_NXDOMAIN" and nothing works.

DNS is also much more than name-to-IP translation. It's used for: **load balancing** (return different IPs to different clients), **failover** (stop returning a dead server's IP), **CDN routing** (return the nearest edge server's IP), **service discovery** (SRV records for microservices), and **email routing** (MX records).

### How DNS Resolution Works

```
Browser asks: "What is the IP of www.example.com?"

Step 1: LOCAL CACHES (instant)
  Browser DNS cache → OS DNS cache → Router DNS cache
  If found: return immediately (most requests stop here)

Step 2: RECURSIVE RESOLVER (your ISP or 8.8.8.8)
  If not cached, your configured DNS server does the work.
  It's called "recursive" because it follows the chain for you.

Step 3: ROOT NAME SERVER (13 clusters worldwide: a.root-servers.net ... m.root-servers.net)
  Resolver asks root: "Where is www.example.com?"
  Root says: "I don't know, but .com is handled by these TLD servers: ..."

Step 4: TLD NAME SERVER (.com, .org, .net, etc.)
  Resolver asks .com TLD: "Where is www.example.com?"
  TLD says: "example.com is handled by these authoritative servers: ns1.example.com ..."

Step 5: AUTHORITATIVE NAME SERVER (the domain owner's DNS)
  Resolver asks ns1.example.com: "What is the IP of www.example.com?"
  Authoritative says: "www.example.com → 93.184.216.34, TTL=3600"

Step 6: CACHING
  Resolver caches: www.example.com → 93.184.216.34 for 3600 seconds
  Returns to your browser.

Total time: 50-200ms (if not cached)
Cached hit: <1ms

    You                 Recursive           Root          .com TLD      Authoritative
     │                  Resolver             │               │              │
     │── query ────────►│                    │               │              │
     │                  │── "where is .com?" ►│              │              │
     │                  │◄── "here are the TLD servers" ────│              │
     │                  │── "where is example.com?" ────────►│             │
     │                  │◄── "here are the auth servers" ───│              │
     │                  │── "what is www.example.com?" ─────────────────►│
     │                  │◄── "93.184.216.34, TTL=3600" ────────────────│
     │◄── 93.184.216.34 │                    │               │              │
```

### DNS Record Types

```
Type    Purpose                          Example
──────────────────────────────────────────────────────────────────
A       IPv4 address                     example.com → 93.184.216.34
AAAA    IPv6 address                     example.com → 2606:2800:220:1:...
CNAME   Alias to another domain          www.example.com → example.com
MX      Mail server                      example.com → mail.example.com (priority 10)
NS      Authoritative name server        example.com → ns1.example.com
TXT     Arbitrary text (SPF, DKIM, etc)  example.com → "v=spf1 include:_spf.google.com"
SRV     Service location (port + host)   _http._tcp.example.com → 0 5 80 web.example.com
PTR     Reverse lookup (IP → name)       34.216.184.93 → example.com

DNS-BASED LOAD BALANCING:
  example.com → A → 10.0.1.1
  example.com → A → 10.0.1.2
  example.com → A → 10.0.1.3
  DNS returns all three. Client picks one (usually first).
  Simple but coarse: no health checks, no weighted distribution.

DNS-BASED FAILOVER:
  Health check fails for 10.0.1.1 → remove from DNS response
  New queries get only healthy servers
  BUT: clients cache the old response for TTL duration → stale routing
  Low TTL (30s) = fast failover but more DNS traffic
  High TTL (3600s) = less DNS traffic but slow failover
```

### What Happens When DNS Goes Wrong

```
PROBLEM: DNS is stale (old IP cached)
  You deploy a new server at a new IP. Update DNS. But clients still
  have the old IP cached for TTL seconds. Traffic goes to the old server.
  FIX: Use low TTL before migrations. Use health-checked load balancers
       instead of DNS-based routing for critical services.

PROBLEM: DNS resolution is slow
  Every API call does a DNS lookup (unless cached). If your DNS server
  is slow or unreliable, EVERYTHING is slow.
  FIX: Use a fast resolver (Cloudflare 1.1.1.1, Google 8.8.8.8).
       Monitor DNS resolution time. Cache aggressively in your app.

PROBLEM: DNS poisoning
  Attacker injects false DNS records into a resolver's cache.
  Your requests go to the attacker's server instead of the real one.
  FIX: DNSSEC (signed records), DNS-over-HTTPS (DoH), DNS-over-TLS (DoT).

PROBLEM: DNS amplification DDoS
  Attacker sends DNS queries with spoofed source IP (the victim's IP).
  DNS server sends large responses to the victim. Amplification: 50x.
  FIX: Rate limiting on DNS servers, BCP38 (source IP validation).
```

---

## 7. Sockets — What Servers Actually Do

### What a Socket Really Is

A socket is the **endpoint of a network connection**, identified by: `(IP address, port number, protocol)`. At the operating system level, a socket is a **file descriptor** — just an integer that refers to a kernel data structure holding connection state (local/remote address, send/receive buffers, TCP state machine).

When people say "a server listens on port 80," they mean: the server created a socket, bound it to port 80, and called `listen()`. When a client connects, the kernel creates a NEW socket for that specific connection. The listening socket continues to accept new connections while each connected socket handles its own client.

```
SERVER LIFECYCLE:

1. socket()     → create a file descriptor (e.g., fd=3)
2. bind(fd, addr:port) → associate with IP:port (e.g., 0.0.0.0:8080)
3. listen(fd, backlog) → start accepting connections
                          backlog = max pending connections queue size
4. accept(fd)   → BLOCKS until a client connects
                   returns a NEW file descriptor (e.g., fd=4) for this client
5. read(fd=4)   → read data from client (BLOCKS until data arrives)
6. write(fd=4)  → send data to client
7. close(fd=4)  → close this client's connection

The LISTENING socket (fd=3) stays open.
Each client gets its own CONNECTED socket (fd=4, fd=5, fd=6, ...).

CONNECTION IDENTIFICATION:
  A TCP connection is uniquely identified by 4 values:
    (src_ip, src_port, dst_ip, dst_port)
  
  Server: 10.0.1.5:8080
  Client A: 192.168.1.100:52481 → 10.0.1.5:8080   (connection 1)
  Client B: 192.168.1.100:52482 → 10.0.1.5:8080   (connection 2)
  Client C: 192.168.1.200:52481 → 10.0.1.5:8080   (connection 3)
  
  All three connect to the SAME server port, but they're different connections
  because the (src_ip, src_port) tuple differs.
  
  Theoretical max connections per server port: ~2^48 (billions)
  Practical limit: file descriptors, memory, CPU
    Linux default: 1024 fds (ulimit -n)
    Production: 65536 or higher (tunable)
    Each TCP connection: ~3.5KB kernel memory
    1 million connections: ~3.5GB kernel memory
```

### Connection Limits — Why Servers Run Out of Capacity

```
What limits the number of concurrent connections:

1. FILE DESCRIPTORS (ulimit -n)
   Default: 1024 per process
   Fix: ulimit -n 65536 (or /etc/security/limits.conf)

2. EPHEMERAL PORT RANGE (for outgoing connections)
   Default: 32768-60999 = ~28,000 ports
   Limits outgoing connections (to databases, other services)
   Fix: net.ipv4.ip_local_port_range = 1024 65535

3. MEMORY
   Each connection: ~3.5KB kernel + application buffers (typically 8-64KB)
   1M connections: ~3.5GB kernel + 8-64GB application
   
4. CPU
   Processing each connection takes CPU
   I/O-bound: NIO/epoll can handle 100K+ connections per core
   CPU-bound: limited by processing speed per request

5. BACKLOG QUEUE
   listen(fd, backlog=128) → max 128 pending connections
   If connections arrive faster than accept() processes them → dropped
   Production: increase to 1024-4096
   net.core.somaxconn = 4096
```

---

## 8. Network Debugging — The Tools You Need

### Essential Tools and When to Use Them

```
SCENARIO: "I can't reach the server"
  Tool: ping <host>
    Tests: IP connectivity (ICMP echo)
    Shows: round-trip time, packet loss
    Limitation: many servers block ICMP (ping may fail even if HTTP works)

  Tool: traceroute <host> (or mtr for continuous)
    Tests: path packets take through the network
    Shows: each hop (router), latency per hop, where packets are dropped
    Use when: connection is slow or failing, want to find WHERE the problem is

  Tool: telnet <host> <port> (or nc -zv <host> <port>)
    Tests: TCP connectivity to a specific port
    Shows: whether the port is open and accepting connections
    Use when: ping works but your app can't connect

SCENARIO: "DNS isn't working"
  Tool: dig <domain> (or nslookup)
    Shows: DNS resolution result, TTL, authoritative server, all records
    Example: dig www.example.com
    dig +trace www.example.com  → shows full resolution chain

  Tool: dig @8.8.8.8 <domain>
    Tests DNS resolution using a specific server (bypass local resolver)

SCENARIO: "Connection is slow"
  Tool: curl -w "@format.txt" -o /dev/null -s <url>
    Shows: timing breakdown (DNS, connect, TLS, first byte, total)
    Example output:
      DNS:        0.025s
      Connect:    0.050s
      TLS:        0.120s
      First byte: 0.350s
      Total:      0.450s
    → if DNS is slow: resolver issue
    → if connect is slow: network latency
    → if first byte is slow: server processing time
    → if total >> first byte: large response, slow transfer

SCENARIO: "What's going on at the packet level"
  Tool: tcpdump -i any port 8080 -n
    Shows: every packet on port 8080
    Use when: you need to see exactly what's being sent/received
    
  Tool: Wireshark (GUI version of tcpdump)
    Shows: full packet decode, protocol analysis, conversation tracking
    Use when: complex protocol debugging, TLS issues

SCENARIO: "What ports are in use"
  Tool: ss -tlnp (or netstat -tlnp)
    Shows: listening TCP sockets with port, PID, and program name
    Use when: "port already in use" errors, checking what's running

  Tool: ss -tnp state established
    Shows: all active TCP connections
    Use when: checking connection counts, finding connection leaks
```

### Common Network Numbers to Know

```
Number                          What it means
────────────────────────────────────────────────────────
RTT same datacenter:            ~0.5ms
RTT same region (us-east):      ~1-5ms
RTT cross-continent:            ~50-100ms
RTT intercontinental:           ~100-300ms

Bandwidth (modern):
  1 Gbps within datacenter
  10-100 Gbps between DCs (backbone)
  10-1000 Mbps to end users

TCP handshake:                  1 RTT
TLS 1.2 handshake:              2 RTTs
TLS 1.3 handshake:              1 RTT (0-RTT with resumption)
DNS lookup (uncached):          50-200ms
DNS lookup (cached):            <1ms

Max TCP connections per port:   theoretical ~billions, practical ~100K-1M
Max ephemeral ports:            ~28,000 default (tunable to ~64K)
TCP initial window:             ~14KB (10 segments)
Ethernet MTU:                   1500 bytes
TCP MSS:                        1460 bytes (MTU - IP header - TCP header)
```

---

## 9. Best Practices for Production Networking

```
CONNECTION MANAGEMENT:
  ✓ Use connection pooling for everything (HTTP, DB, Redis, gRPC)
  ✓ Set connect timeouts (don't wait forever for a dead server)
  ✓ Set read timeouts (don't wait forever for a slow response)
  ✓ Enable TCP keep-alive to detect dead connections
  ✓ Close idle connections after a reasonable period

DNS:
  ✓ Use a fast, reliable resolver (1.1.1.1, 8.8.8.8, or corporate DNS)
  ✓ Cache DNS results in your application (respect TTL)
  ✓ Set low TTL before planned infrastructure changes
  ✓ Monitor DNS resolution time as a metric

TCP TUNING (Linux):
  net.core.somaxconn = 4096          # listen() backlog
  net.ipv4.tcp_max_syn_backlog = 4096 # SYN queue size
  net.ipv4.ip_local_port_range = 1024 65535  # ephemeral ports
  net.ipv4.tcp_tw_reuse = 1          # reuse TIME_WAIT sockets
  net.ipv4.tcp_fin_timeout = 15      # reduce FIN_WAIT_2 timeout
  net.core.rmem_max = 16777216       # max receive buffer
  net.core.wmem_max = 16777216       # max send buffer

SECURITY:
  ✓ TLS everywhere (even internal services — zero-trust)
  ✓ Certificate rotation before expiry
  ✓ Disable older TLS versions (TLS 1.0, 1.1)
  ✓ Use strong cipher suites
  ✓ Network segmentation (VPCs, security groups)
```

---

---

## 10. Real-World Failures — When Networking Goes Wrong

Understanding networking theory matters, but understanding how it FAILS in production is what separates book knowledge from engineering expertise. These are real incidents that happened to the biggest companies in the world.

### Cloudflare DNS Outage (July 2020) — BGP Route Leak

```
WHAT HAPPENED:
  Cloudflare accidentally withdrew their BGP route for 1.1.1.1 (their DNS resolver)
  A configuration change in one datacenter propagated globally
  For 27 minutes, ~15% of Cloudflare's traffic was unreachable
  
WHY IT MATTERS:
  BGP (Border Gateway Protocol) is how routers learn which paths to use
  A single misconfiguration can propagate across the ENTIRE internet
  There is NO central authority that validates BGP announcements
  This is why DNS is a single point of failure for the internet

LESSON: DNS failures affect EVERYTHING. If 1.1.1.1 goes down,
  every application using it for DNS resolution stops working.
  Always configure MULTIPLE DNS resolvers (1.1.1.1 AND 8.8.8.8).
```

### AWS us-east-1 Outage (December 2021) — Network Congestion Cascade

```
WHAT HAPPENED:
  AWS networking devices in us-east-1 experienced congestion
  Internal services couldn't communicate → cascading failures
  DynamoDB, Lambda, SQS, CloudWatch ALL went down
  The MONITORING SYSTEM was also in us-east-1 → couldn't see the problem!
  
  Duration: ~7 hours affecting millions of applications
  
WHY IT MATTERS:
  A network congestion event in one system cascaded to dozens
  Internal service discovery (DNS) was affected → services couldn't find each other
  The monitoring dependency on the same region made diagnosis harder

LESSONS:
  1. Multi-region deployments are not optional for critical systems
  2. Monitoring should be in a DIFFERENT region than the monitored system
  3. Circuit breakers prevent cascade: if a dependency is slow, STOP calling it
  4. Retry storms make network congestion WORSE (exponential backoff is essential)
```

### GitHub DDoS Attack (February 2018) — Largest DDoS Ever (at the time)

```
WHAT HAPPENED:
  1.35 Tbps of traffic hit GitHub using memcached amplification
  Attackers sent small requests to open memcached servers with GitHub's IP as source
  Memcached responded with 50,000x amplified responses → all directed at GitHub
  
  GitHub was offline for ~5 minutes, intermittent for ~9 minutes
  Akamai Prolexic (DDoS mitigation) absorbed the traffic

WHY IT MATTERS:
  UDP-based protocols with no authentication (memcached, DNS) can be amplified
  A 1KB request can generate a 50MB response aimed at the victim
  DDoS mitigation is a NETWORK-LEVEL concern, not application-level

LESSONS:
  1. Never expose memcached/Redis to the public internet (bind to localhost)
  2. Use CDN/DDoS protection (Cloudflare, Akamai, AWS Shield) for public services
  3. Rate limiting at the network edge (not the application) stops volumetric attacks
```

---

## 11. Advanced Concepts — What Top Resources Cover

### Connection Pooling — Why It's Everywhere

```
Every protocol that uses TCP has the same problem: connections are expensive.
TCP handshake (1 RTT) + TLS handshake (1-2 RTTs) = 100-300ms per connection.

The solution is universal: CONNECTION POOLING.
  Create N connections at startup, reuse them across requests.

WHERE CONNECTION POOLING IS USED:
  HTTP:       keep-alive (reuse TCP connections across requests)
  Database:   HikariCP, PgBouncer (reuse DB connections across queries)
  Redis:      Jedis/Lettuce connection pool
  gRPC:       persistent HTTP/2 connections (built-in multiplexing)
  Microservices: service mesh (Envoy maintains connection pools to each service)

POOL SIZING (same formula everywhere):
  pool_size = (num_cpu_cores * 2) + effective_spindle_count
  For an 8-core server with SSD: (8 * 2) + 1 = 17 connections
  
  More connections ≠ more throughput.
  More connections = more contention = LOWER throughput.
```

### Numbers Every Engineer Should Memorize

```
LATENCY:
  L1 cache reference:              0.5 ns
  L2 cache reference:              7 ns
  Main memory reference:           100 ns
  SSD random read:                 16 μs
  Read 1 MB sequentially from SSD: 49 μs
  Read 1 MB sequentially from HDD: 825 μs
  Disk seek (HDD):                 2 ms
  Round trip within datacenter:     0.5 ms
  Round trip same city:             2-5 ms
  Round trip cross-continent:       50-150 ms
  
THROUGHPUT:
  Network within datacenter:        1-100 Gbps
  SSD sequential read:              500 MB/s - 7 GB/s (NVMe)
  HDD sequential read:              100-200 MB/s
  Redis operations per second:      100K-1M (single instance)
  PostgreSQL queries per second:    5K-50K (depends on query)
  Kafka messages per second:        100K-2M (per broker)

STORAGE:
  1 ASCII character:                1 byte
  1 UUID:                           16 bytes
  1 typical DB row:                 100-500 bytes
  1 JSON API response:              1-10 KB
  1 image:                          100 KB - 5 MB
  1 minute of HD video:             ~150 MB
  1 day of tweets (500M):           ~250 GB text
  1 day of Instagram photos (100M): ~50 TB

AVAILABILITY:
  99%    = 3.65 days downtime/year    (two nines)
  99.9%  = 8.77 hours downtime/year   (three nines)
  99.99% = 52.6 minutes downtime/year (four nines)
  99.999%= 5.26 minutes downtime/year (five nines — gold standard)
```

### Networking in System Design Interviews — What They Actually Ask

```
When the interviewer asks "how does the client connect to the server?"
they want to hear:

LEVEL 1 (expected from everyone):
  "Client makes an HTTP request to the load balancer, which routes to a backend server."

LEVEL 2 (senior engineer):
  "Client resolves the domain via DNS (cached locally or recursive lookup).
  Opens a TCP connection to the load balancer (L7, for HTTP routing).
  TLS 1.3 handshake establishes encryption (1 RTT).
  HTTP/2 request sent over the encrypted connection.
  Connection is keep-alive for subsequent requests."

LEVEL 3 (staff/principal — distinguishes you):
  "DNS resolution returns the CDN's edge IP (Cloudflare/CloudFront).
  CDN checks cache: if HIT, returns immediately (5ms).
  If MISS, CDN connects to origin (our load balancer) via persistent HTTP/2.
  Load balancer terminates TLS, routes based on URL path to the right service cluster.
  Service responds, CDN caches the response with Cache-Control headers for future requests.
  For WebSocket upgrades (real-time features), the LB routes to a sticky session on a specific backend.
  We use TCP keep-alive with a 30-second interval to detect dead connections."

The deeper you go, the higher you score. Networking fundamentals are the FOUNDATION
that makes every other component discussion credible.
```

---

*After this phase: you can trace a packet's journey from browser to server and back. You can explain why TCP connections are expensive, why DNS failures break everything, and why Nagle's algorithm causes latency spikes. You can debug network issues with the right tool for the right problem. You know the real-world failure stories that make this knowledge visceral. You have the foundation for everything that follows.*
