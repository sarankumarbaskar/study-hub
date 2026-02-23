# System Design Mastery Roadmap

> **Goal:** Not "I memorized URL Shortener design" — but "I can design any system from first principles because I understand how every building block works."

**Timeline:** 12–16 weeks at 2–3 hrs/day. This is not a speed run — each phase builds on the previous one.

**Strategy:** Deep understanding first, interview prep second. When you truly understand how TCP, databases, caching, and message queues work at the implementation level, designing systems becomes logical reasoning, not memorization.

---

## Why This Resource Exists

Most system design resources teach you *what* to draw on the whiteboard. This resource teaches you *why* each component exists, *how* it works behind the scenes, *when* to use it vs alternatives, and *what breaks* in production. The difference: a memorizer can design one system they've seen before. An engineer who understands the building blocks can design any system they haven't seen before.

---

## The Phases

### Phase 0 — Networking Fundamentals (Weeks 1–2)

**Why this comes first:** Every distributed system is just computers talking to each other over a network. If you don't understand TCP, DNS, and how packets travel, you can't reason about latency, failure modes, or why your microservice architecture is slow.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| OSI / TCP-IP Model | What actually happens when you type a URL | Foundation of all network reasoning |
| TCP | 3-way handshake, flow control, congestion control, TIME_WAIT | Why connections are expensive, why pooling exists |
| UDP | When to use, why DNS/video/gaming prefer it | Not everything needs reliability |
| IP & Routing | Subnets, NAT, CIDR, how packets find their way | VPC design, network architecture |
| DNS | Resolution chain, caching, TTL, failover | #1 cause of "it works on my machine" |
| Sockets | File descriptors, listen/accept/read at OS level | Understanding server capacity limits |

### Phase 1 — Protocols Deep Dive (Weeks 3–4)

**Why this matters:** HTTP is the language of the web. TLS is why it's secure. gRPC is why microservices are fast. Understanding protocols means understanding the trade-offs behind every API decision.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| HTTP/1.1, HTTP/2, HTTP/3 | Head-of-line blocking, multiplexing, QUIC | Why your API is slow, how to make it fast |
| TLS/HTTPS | Handshake, certificates, mTLS | Security is non-negotiable |
| REST API Design | Methods, status codes, versioning, pagination | You design APIs every day |
| WebSocket | Upgrade handshake, when to use, scaling | Real-time features (chat, live data) |
| gRPC | Protocol Buffers, HTTP/2 streaming, vs REST | Microservice communication |
| GraphQL | Query language, when it helps vs hurts | Frontend-driven API design |

### Phase 2 — Databases (Weeks 5–7)

**Why this matters:** Every system stores data. The database is usually the bottleneck. Understanding indexing, sharding, and replication is the difference between a system that handles 100 QPS and one that handles 100,000 QPS.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| SQL Internals | B-tree indexes, query plans, EXPLAIN, join algorithms | Why your query is slow |
| NoSQL Categories | Key-value, Document, Column-family, Graph | Right tool for the right job |
| Indexing | B-tree vs LSM-tree, composite indexes, covering indexes | 100x query speedup |
| Sharding | Hash, range, consistent hashing, resharding | Scaling writes beyond one machine |
| Replication | Leader-follower, multi-leader, leaderless | Scaling reads, fault tolerance |
| CAP Theorem | What it really means, CP vs AP | Fundamental distributed systems trade-off |

### Phase 3 — Caching (Weeks 8–9)

**Why this matters:** Caching is the single most impactful performance optimization. A well-placed cache can reduce database load by 99% and cut latency from 50ms to 1ms. A badly designed cache causes stale data, stampedes, and outages.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| Cache Levels | Browser → CDN → Gateway → App → DB cache | Where to cache for maximum impact |
| Redis | Data structures, persistence, replication, cluster | The universal caching tool |
| Strategies | Cache-aside, read-through, write-through, write-behind | Consistency vs performance trade-offs |
| Invalidation | TTL, event-driven, versioning | "The two hard problems in CS" |
| CDN | Edge locations, origin pull/push, cache headers | Global latency reduction |

### Phase 4 — Message Queues & Event-Driven (Weeks 10–11)

**Why this matters:** Synchronous request-response doesn't scale for everything. When you need to decouple services, handle traffic spikes, or process events in order, message queues are the answer.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| Kafka | Partitions, consumer groups, exactly-once, log compaction | The backbone of event streaming |
| RabbitMQ | Exchanges, queues, acknowledgments | Task queues and RPC patterns |
| Event Sourcing & CQRS | Append-only log, separate read/write models | Audit trails, complex domains |
| Backpressure | When consumers can't keep up | Preventing cascade failures |
| Idempotency | At-least-once delivery, deduplication | Correctness in distributed systems |

### Phase 5 — Microservices Architecture (Weeks 12–13)

**Why this matters:** Most production systems are distributed. Understanding service communication patterns, failure handling, and observability is what separates a developer who builds features from an engineer who builds systems.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| Monolith vs Microservices | Honest trade-offs, when monolith wins | Don't distribute prematurely |
| Service Discovery | Consul, Eureka, K8s DNS | How services find each other |
| Circuit Breaker | Cascading failures, Resilience4j | Fault isolation |
| Distributed Tracing | Jaeger, Zipkin, OpenTelemetry | Debugging across 20 services |
| Saga Pattern | Choreography vs orchestration | Distributed transactions |

### Phase 6 — Scalability Patterns (Weeks 14–15)

**Why this matters:** This is the "architecture" layer — the patterns that make a system handle 10x, 100x, 1000x more load. Every system design interview question is fundamentally about applying these patterns.

| Topic | What to Understand | Why It Matters |
|-------|-------------------|----------------|
| Load Balancing | L4 vs L7, algorithms, health checks | Distributing traffic |
| Rate Limiting | Token bucket, sliding window | Protecting your system |
| Consistent Hashing | Virtual nodes, ring-based distribution | Cache and shard distribution |
| Observability | Metrics, logs, traces (three pillars) | You can't fix what you can't see |
| Disaster Recovery | Active-active/passive, RPO/RTO | Surviving failures |

### Phase 7 — System Design Interviews (Week 16)

**Why this comes LAST:** If you've internalized Phases 0–6, interviews become applying what you know. The "framework" is just a checklist to make sure you don't forget anything under pressure.

10 classic problems solved from first principles, using everything you've learned.

---

## Resource Summary

| # | Resource | Type | Phase | Priority |
|---|----------|------|-------|----------|
| 1 | Computer Networking: A Top-Down Approach — Kurose & Ross | Book | 0-1 | Foundation |
| 2 | Designing Data-Intensive Applications — Martin Kleppmann | Book | 2-6 | **Critical** |
| 3 | System Design Interview — Alex Xu (Vol 1 & 2) | Book | 7 | Interview |
| 4 | High Performance Browser Networking — Ilya Grigorik | Book | 0-1 | Deep Dive |
| 5 | Redis in Action — Josiah Carlson | Book | 3 | Practical |
| 6 | Kafka: The Definitive Guide | Book | 4 | Practical |
| 7 | Building Microservices — Sam Newman | Book | 5 | Architecture |

---

## Free Online Resources

- **DDIA Distilled** — [dataintensive.net](https://dataintensive.net/) — Martin Kleppmann's companion site
- **ByteByteGo** — [bytebytego.com](https://bytebytego.com/) — Alex Xu's system design visual guides
- **High Scalability** — [highscalability.com](http://highscalability.com/) — Real architecture case studies
- **AWS Architecture Center** — [aws.amazon.com/architecture](https://aws.amazon.com/architecture/) — Production patterns
- **Google SRE Book** — [sre.google/books](https://sre.google/books/) — Free online, production wisdom
- **Cloudflare Blog** — [blog.cloudflare.com](https://blog.cloudflare.com/) — CDN, DNS, DDoS, networking deep dives
- **Julia Evans' Zines** — [wizardzines.com](https://wizardzines.com/) — Visual networking/Linux explanations
- **Gergely Orosz — The Pragmatic Engineer** — [pragmaticengineer.com](https://blog.pragmaticengineer.com/) — Big tech insider perspectives

---

## Weekly Schedule Template

| Week | Phase | Focus | Key Resource |
|------|-------|-------|--------------|
| 1 | 0 | TCP/IP, OSI, DNS, Sockets | Networking Top-Down (Ch. 1-3) |
| 2 | 0 | TCP deep dive, UDP, routing, debugging tools | Networking Top-Down (Ch. 3-4) |
| 3 | 1 | HTTP/1.1, HTTP/2, HTTP/3, TLS | HPBN, Cloudflare blog |
| 4 | 1 | REST, WebSocket, gRPC, GraphQL, API Gateway | DDIA Ch. 4, API design guides |
| 5 | 2 | SQL internals, indexing, query optimization | DDIA Ch. 3 |
| 6 | 2 | NoSQL, CAP theorem, replication | DDIA Ch. 5-6 |
| 7 | 2 | Sharding, partitioning, distributed transactions | DDIA Ch. 6-7 |
| 8 | 3 | Caching fundamentals, Redis deep dive | Redis in Action |
| 9 | 3 | CDN, cache strategies, invalidation | Cloudflare blog, AWS docs |
| 10 | 4 | Kafka deep dive, consumer groups, exactly-once | Kafka Definitive Guide |
| 11 | 4 | Event sourcing, CQRS, saga, idempotency | DDIA Ch. 11-12 |
| 12 | 5 | Microservices patterns, service discovery | Building Microservices |
| 13 | 5 | Circuit breaker, distributed tracing, 12-factor | Resilience4j docs, OpenTelemetry |
| 14 | 6 | Load balancing, rate limiting, consistent hashing | DDIA Ch. 5, Alex Xu |
| 15 | 6 | Observability, disaster recovery, chaos engineering | Google SRE Book |
| 16 | 7 | Interview framework + practice 10 classic problems | Alex Xu Vol 1 & 2 |

---

*After completing this roadmap: you can design any system from first principles. You can explain WHY you chose each component, not just WHAT to draw. You can debate trade-offs with architects. System design interviews become conversations, not recitations.*
