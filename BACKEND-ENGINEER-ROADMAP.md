# Backend Engineer Roadmap (6–8 Months)

> **Goal:** Become interview-ready for Senior Backend Engineer roles at international product companies.
> **Profile:** 5 YoE Java Backend Engineer @ Red Hat
> **Primary Target:** International — Netherlands, Denmark, Sweden, Germany, Ireland
> **Long-term Target:** Google, Meta, Uber, Databricks, Stripe, Confluent, Snowflake
> **Outcome:** Strong in Java Backend, System Design, Distributed Systems. Interview-ready by end of August 2026.

---

## Table of Contents

- [Current Mission](#current-mission-julyaugust-2026)
- [Weekly Time Allocation](#weekly-time-allocation)
- [Track 1 — DSA (40%)](#track-1--dsa-40)
- [Track 2 — Java & Backend (30%)](#track-2--java--backend-30)
- [Track 3 — Distributed Systems & System Design (20%)](#track-3--distributed-systems--system-design-20)
- [Track 4 — Kafka & Redis](#track-4--kafka--redis)
- [Track 5 — Cloud, Containers & Platform Engineering](#track-5--cloud-containers--platform-engineering)
- [Engineering Blogs](#engineering-blogs-read-weekly)
- [Books To Finish](#books-to-finish)
- [Success Criteria](#success-criteria--interview-ready)
- [Weekly Review](#weekly-review)
- [Aligned Weekly Plan](#aligned-weekly-plan-8-weeks--july-10-to-august-31-2026)
- [AI Mentor Instructions](#ai-mentor-instructions)

---

## Current Mission (July–September 2026)

My only objective is to become **interview-ready**.

Everything I study must improve one of these:
- DSA pattern mastery — all 142 problems, no shortcuts
- Java backend depth — internals, not just syntax
- System design confidence — DDIA + HLD practice
- Resume & interview skills

Anything outside these objectives is postponed.

**Target:** Interview-ready by **September 20, 2026**.
**Interview window:** September 20 – October 31, 2026.

### Commitments

- **DSA:** minimum 3 problems/day, every day
- **Java:** 30 min/day minimum, paired with DSA pattern
- **System Design:** 30 min/day minimum, DDIA chapters + HLD
- **No compromise** on quality and depth
- **Show up daily** — Bronze day (1 problem + review) beats zero day

---

## Weekly Time Allocation

### Available Study Time

| Day | Hours |
|-----|-------|
| Monday–Friday | 4–5 hours/day |
| Saturday | 8 hours |
| Sunday | 8 hours |
| **Total** | **36–40 focused hours/week** |

### Current Priority Distribution

| Track | Weight | Hours/Week | Goal |
|-------|--------|-----------|------|
| DSA | 40% | 15–16 hrs | Pattern mastery + interview readiness |
| Java Backend | 30% | 11–12 hrs | Backend depth + Java interviews |
| Distributed Systems & System Design | 20% | 7–8 hrs | DDIA + HLD |
| Career Preparation | 10% | 3–4 hrs | Resume, LinkedIn, applications |

---

## Track 1 — DSA (40%)

### Goal
- Complete curated 142 problems ([DSA Master Tracker](dsa-patterns/DSA-PATTERNS-ROADMAP.md))
- Master pattern recognition — not problem count
- Be able to solve unseen problems from any pattern

### Resources

| Type | Resource | Link |
|------|----------|------|
| Primary | NeetCode Roadmap | [neetcode.io](https://neetcode.io/roadmap) |
| Primary | LeetCode | [leetcode.com](https://leetcode.com) |
| Video | NeetCode YouTube | [youtube.com/@NeetCode](https://youtube.com/@NeetCode) |
| Video | Take U Forward (Striver) | [youtube.com/@takeUforward](https://youtube.com/@takeUforward) |

### Practice Philosophy

Every problem is considered **completed** only if I can explain:
- Brute force approach
- Optimal solution
- Why the optimal solution works (intuition, not memorization)
- Time complexity with proof
- Space complexity
- Pattern recognition — which pattern and why
- Similar problems that use the same technique
- Variations and follow-ups

**Pattern recognition is more important than problem count.**

Previously solved problems must be revisited using spaced repetition (Day 1 → 3 → 7 → 14 → 30).

### Topics Covered

| Topic | Key Patterns |
|-------|-------------|
| Arrays & Hashing | HashMap lookup, frequency counting, prefix/suffix |
| Two Pointers | Opposite-end, same-direction, Dutch flag |
| Sliding Window | Variable/fixed window, character frequency tracking |
| Binary Search | Standard, on answer space, rotated arrays |
| Bit Manipulation | XOR, Kernighan's, carry-free arithmetic |
| Stack | Monotonic stack, nested structure parsing |
| Heap | Top K, two heaps, merge K sorted |
| Linked List | Reversal, cycle detection, two-pointer |
| Intervals | Sort + merge, greedy selection |
| Trees | BFS/DFS, BST properties, LCA, serialization |
| Graphs | BFS/DFS, topological sort, Union-Find, Dijkstra |
| Dynamic Programming | 1D, 2D, knapsack, interval DP, state machine |
| Greedy | Jump games, scheduling, exchange argument |
| Backtracking | Combinations, permutations, constraint satisfaction |
| Design | LRU/LFU cache, Trie, HashMap design |

---

## Track 2 — Java & Backend (30%)

### 2.1 Effective Java

**Goal:** Become interview-ready in modern Java idioms and best practices.

| Type | Resource |
|------|----------|
| Book | *Effective Java* — Joshua Bloch |

<details>
<summary><strong>Focus Areas</strong></summary>

| Topic | Key Items |
|-------|-----------|
| Generics | Bounded wildcards, type erasure, PECS principle |
| Collections | Choosing the right collection, immutable collections |
| Enums | Enum with behavior, EnumSet, EnumMap |
| Lambdas & Streams | Functional interfaces, stream pipeline, collectors |
| Immutability | Immutable classes, defensive copies |
| equals/hashCode | Contract, consistent implementation |
| Best Practices | Builder pattern, try-with-resources, Optional, method design |

</details>

### 2.2 Design Patterns

**Goal:** Know when and why to apply each pattern — not just the UML diagram.

| Type | Resource |
|------|----------|
| Book | *Head First Design Patterns* |
| Website | [Refactoring Guru](https://refactoring.guru/design-patterns) |
| Video | Christopher Okhravi (YouTube) |
| Video | Daily Code Buffer Design Patterns Playlist |

<details>
<summary><strong>Patterns to Master</strong></summary>

| Pattern | When to Use | Real-World Example |
|---------|-------------|-------------------|
| **Strategy** | Swap algorithms at runtime | Payment processing (CreditCard, PayPal, UPI) |
| **Observer** | Event-driven notifications | Event listeners, pub-sub systems |
| **Factory** | Decouple object creation | Database driver instantiation |
| **Singleton** | Exactly one instance needed | Configuration manager, connection pool |
| **Command** | Encapsulate requests as objects | Task queues, undo/redo |
| **Adapter** | Incompatible interface bridging | Legacy API integration |
| **Decorator** | Add behavior dynamically | Java I/O streams, middleware chains |

</details>

### 2.3 Spring Boot Deep Dive

**Goal:** Go from "I use Spring Boot" to "I understand Spring Boot."

| Type | Resource |
|------|----------|
| Docs | [Spring Official Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/) |
| Book | *Spring Start Here* |
| Book | *Spring Security in Action* |
| Video | Java Brains |
| Video | Dan Vega |
| Video | Amigoscode |

<details>
<summary><strong>Must-Know Topics</strong></summary>

**Core**
| Topic | What to Understand |
|-------|--------------------|
| Dependency Injection | Constructor vs field vs setter injection, @Qualifier, @Primary |
| Bean Lifecycle | @PostConstruct, @PreDestroy, init/destroy methods, scopes |
| Auto Configuration | How @SpringBootApplication works, conditional beans |
| Profiles | Environment-specific config, @Profile, application-{profile}.yml |

**Data**
| Topic | What to Understand |
|-------|--------------------|
| Transactions | @Transactional, propagation levels, isolation levels, rollback |
| JPA Basics | Entity mapping, relationships, N+1 problem, query optimization |

**Security**
| Topic | What to Understand |
|-------|--------------------|
| Authentication | Form login, Basic auth, custom UserDetailsService |
| Authorization | Role-based, method-level security, @PreAuthorize |
| OAuth2 | Authorization code flow, resource server, token validation |
| JWT | Token structure, signing, stateless auth, refresh tokens |

</details>

### 2.4 Java Interview Notebook

For every Java topic, maintain interview-ready notes covering internals, edge cases, and common questions.

<details>
<summary><strong>Topics to Document</strong></summary>

| Topic | What to Cover |
|-------|--------------|
| HashMap | Internal working, collision handling, resize, load factor, treeification, complexity, thread safety |
| Collections | ArrayList vs LinkedList internals, ConcurrentHashMap, CopyOnWriteArrayList, when to use which |
| Generics | Type erasure, bounded wildcards, PECS, generic methods, raw types pitfalls |
| Streams | Lazy evaluation, intermediate vs terminal ops, parallel streams, stateful vs stateless |
| JVM | Class loading, memory model (heap/stack/metaspace), JIT compilation |
| Garbage Collection | G1GC, ZGC, GC roots, generational hypothesis, tuning flags |
| Concurrency | synchronized vs ReentrantLock, volatile, CompletableFuture, thread pools, deadlock prevention |
| Spring Core | Bean lifecycle, DI internals, AOP proxying, auto-configuration |
| Transactions | Propagation levels, isolation levels, distributed transactions, @Transactional pitfalls |
| Security | Filter chain, SecurityContext, OAuth2 flow, JWT validation |
| Kafka | Consumer internals, rebalancing, offset commit strategies, exactly-once |
| Database | Connection pooling (HikariCP), N+1 problem, query optimization, indexing strategy |

</details>

### 2.5 Coding Practice

Theory alone is not enough. Every week, implement at least one production-quality Java project:

| Project | What It Tests |
|---------|--------------|
| LRU Cache | LinkedHashMap or DLL + HashMap, O(1) operations |
| Custom HashMap | Hashing, collision handling, resize, generics |
| Thread Pool | ExecutorService internals, work queue, thread lifecycle |
| Producer-Consumer | BlockingQueue, wait/notify, concurrent patterns |
| Rate Limiter | Token bucket / sliding window, thread safety |
| REST API | Spring Boot end-to-end, validation, error handling |
| Kafka Producer/Consumer | Serialization, error handling, idempotency |
| Circuit Breaker | Resilience patterns, state machine, fallback |

The objective is to write **production-quality Java** — clean, tested, well-structured.

---

## Track 3 — Distributed Systems & System Design (20%)

### 3.1 DDIA (Designing Data-Intensive Applications)

**Goal:** Build deep understanding of distributed systems fundamentals — the "why" behind every design decision.

| Type | Resource |
|------|----------|
| Book | *Designing Data-Intensive Applications* — Martin Kleppmann |
| Video | ByteByteGo |
| Video | Hussein Nasser |

<details>
<summary><strong>Chapters to Complete</strong></summary>

| # | Chapter | Key Concepts |
|---|---------|-------------|
| 1 | Reliable, Scalable, Maintainable Applications | Reliability vs availability, latency percentiles, load parameters |
| 2 | Data Models and Query Languages | Relational vs document vs graph, schema-on-read vs schema-on-write |
| 3 | Storage and Retrieval | LSM-trees vs B-trees, SSTables, write amplification |
| 4 | Encoding and Evolution | Avro/Protobuf/Thrift, schema evolution, backward/forward compatibility |
| 5 | Replication | Leader-follower, multi-leader, leaderless, quorum reads/writes |
| 6 | Partitioning | Hash vs range partitioning, rebalancing, secondary indexes |
| 7 | Transactions | ACID, isolation levels, serializability, 2PC |
| 8 | The Trouble with Distributed Systems | Partial failures, unreliable clocks, Byzantine faults |
| 9 | Consistency and Consensus | Linearizability, causality, total order broadcast, Raft/Paxos |

</details>

### 3.2 System Design

**Goal:** Confidently design scalable systems end-to-end in 45-minute interviews.

| Type | Resource |
|------|----------|
| Book | *System Design Interview* — Alex Xu |
| Website | [Hello Interview](https://www.hellointerview.com/) |
| Website | [ByteByteGo](https://bytebytego.com/) |
| Video | Gaurav Sen |
| Video | Jordan Has No Life |
| Video | ByteByteGo |

<details>
<summary><strong>Weekly Design Practice</strong></summary>

| Week | System | Key Concepts |
|------|--------|-------------|
| 1 | URL Shortener | Hashing, base62 encoding, read-heavy design, caching |
| 2 | Rate Limiter | Token bucket, sliding window, distributed rate limiting |
| 3 | Notification System | Push vs pull, fanout, message queues, delivery guarantees |
| 4 | Inventory Service | Consistency, distributed locking, stock reservation patterns |
| 5 | Order Management | Saga pattern, state machines, idempotency |
| 6 | Payment System | Exactly-once processing, reconciliation, ledger design |
| 7 | Search Service | Inverted index, Elasticsearch, ranking, autocomplete |
| 8 | Distributed Cache | Consistent hashing, eviction policies, cache coherence |

</details>

<details>
<summary><strong>Design Document Template</strong></summary>

For **every** design, document:

| Section | What to Cover |
|---------|---------------|
| Requirements | Functional + non-functional, scale estimates |
| Capacity Estimation | QPS, storage, bandwidth, memory |
| APIs | REST/gRPC endpoints, request/response schemas |
| Database | Schema design, SQL vs NoSQL choice with justification |
| Cache | What to cache, eviction policy, consistency strategy |
| Messaging | Async flows, Kafka/SQS, retry and DLQ strategy |
| Security | AuthN/AuthZ, encryption at rest/transit, rate limiting |
| Observability | Metrics, logging, tracing, alerting |
| Tradeoffs | CAP theorem decisions, consistency vs availability choices |

</details>

---

## Track 4 — Kafka & Redis (10%)

### 4.1 Kafka

**Goal:** Go from "I've used Kafka" to "I can design reliable event-driven systems."

| Type | Resource |
|------|----------|
| Docs | [Apache Kafka Documentation](https://kafka.apache.org/documentation/) |
| Blog | [Confluent Blog](https://www.confluent.io/blog/) |
| Course | Confluent Kafka Courses (Free) |
| Course | Stephane Maarek Kafka Course (Udemy) |
| Video | Confluent YouTube |
| Video | Hussein Nasser |

<details>
<summary><strong>Topics to Master</strong></summary>

**Fundamentals**
| Topic | What to Understand |
|-------|--------------------|
| Topics | Partitioning strategy, naming conventions, compacted topics |
| Brokers | Leader election, ISR (In-Sync Replicas), controller |
| Partitions | Key-based routing, ordering guarantees, partition count tradeoffs |
| Replication | Replication factor, acks=all vs acks=1, min.insync.replicas |

**Consumers**
| Topic | What to Understand |
|-------|--------------------|
| Consumer Groups | Parallel consumption, group coordinator, partition assignment |
| Rebalancing | Eager vs cooperative rebalancing, static membership |
| Offset Management | Auto vs manual commit, at-least-once vs at-most-once |

**Reliability**
| Topic | What to Understand |
|-------|--------------------|
| Retry | Retry topics, exponential backoff, max retries |
| DLQ | Dead letter queue design, monitoring, reprocessing |
| Idempotency | Producer idempotency, enable.idempotence=true, PID/sequence |
| Exactly Once | Transactional producer, read-process-write pattern, EOS guarantees |

</details>

### 4.2 Redis

**Goal:** Understand Redis as more than a cache — it's a distributed systems primitive.

| Type | Resource |
|------|----------|
| Docs | [Redis Documentation](https://redis.io/docs/) |
| Video | Hussein Nasser |
| Video | ByteByteGo Redis Videos |

<details>
<summary><strong>Topics to Master</strong></summary>

| Topic | What to Understand |
|-------|--------------------|
| Cache Aside | Read-through pattern, lazy population, consistency tradeoffs |
| TTL | Time-based expiry, volatile vs non-volatile keys, memory management |
| Cache Stampede | Thundering herd problem, probabilistic early expiration, locking |
| Distributed Locking | Redlock algorithm, SETNX + TTL, fencing tokens |
| Rate Limiting | Token bucket with Redis, sliding window with sorted sets |

</details>

---

## Track 5 — Cloud, Containers & Platform Engineering (10%)

### 5.1 Docker

**Goal:** Containerize any Spring Boot application confidently.

| Type | Resource |
|------|----------|
| Book | *Docker Deep Dive* — Nigel Poulton |
| Video | TechWorld with Nana Docker Course |
| Docs | [Docker Official Docs](https://docs.docker.com/) |

<details>
<summary><strong>Topics to Master</strong></summary>

| Topic | What to Understand |
|-------|--------------------|
| Images | Dockerfile, base images, layer caching, image size optimization |
| Containers | Container lifecycle, process isolation, resource limits |
| Layers | Union filesystem, layer reuse, .dockerignore |
| Volumes | Bind mounts vs named volumes, data persistence |
| Networks | Bridge, host, overlay; container-to-container communication |
| Multi-stage Builds | Separate build and runtime stages, minimal production images |

</details>

### 5.2 Kubernetes

**Goal:** Understand modern application deployment and orchestration.

| Type | Resource |
|------|----------|
| Video | TechWorld with Nana Kubernetes Course |
| Docs | [Kubernetes Official Documentation](https://kubernetes.io/docs/) |
| Interactive | [Killercoda Kubernetes Labs](https://killercoda.com/playgrounds/scenario/kubernetes) |

<details>
<summary><strong>Topics to Master</strong></summary>

| Topic | What to Understand |
|-------|--------------------|
| Pods | Pod lifecycle, init containers, sidecar pattern |
| Deployments | Rolling updates, rollback, replica management |
| Services | ClusterIP, NodePort, LoadBalancer, service discovery |
| ConfigMaps | Externalized configuration, environment injection |
| Secrets | Sensitive data management, encryption at rest |
| HPA | Horizontal Pod Autoscaler, CPU/memory-based scaling |
| Readiness Probes | Traffic gating, startup delays, endpoint health |
| Liveness Probes | Crash detection, automatic restart, deadlock recovery |

</details>

### 5.3 OpenShift

| Type | Resource |
|------|----------|
| Docs | [Red Hat OpenShift Documentation](https://docs.openshift.com/) |
| Video | Red Hat Developers YouTube |

<details>
<summary><strong>Topics to Master</strong></summary>

| Topic | What to Understand |
|-------|--------------------|
| Routes | Ingress routing, TLS termination, path-based routing |
| Deployments | DeploymentConfig vs Deployment, triggers, strategies |
| Security Contexts | SCCs, pod security, non-root containers |
| OpenShift Pipelines | Tekton-based CI/CD, PipelineRun, TaskRun |

</details>

### 5.4 CI/CD

| Type | Resource |
|------|----------|
| Docs | [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/) |
| Video | TechWorld with Nana CI/CD |

<details>
<summary><strong>Topics to Master</strong></summary>

| Topic | What to Understand |
|-------|--------------------|
| Pipelines | .gitlab-ci.yml structure, pipeline triggers, artifacts |
| Stages | Build → test → deploy, parallel jobs, dependencies |
| Jobs | Script execution, runners, caching, variables |
| Rollbacks | Rollback strategies, version pinning, database migrations |
| Blue-Green Deployment | Zero-downtime switches, traffic routing, smoke tests |
| Canary Deployment | Gradual rollout, metrics-based promotion, auto-rollback |

</details>

### 5.5 AWS Fundamentals

**Goal:** Understand cloud services referenced in System Design interviews.

| Type | Resource |
|------|----------|
| Course | Stephane Maarek AWS Solutions Architect Associate |
| Docs | [AWS Official Documentation](https://docs.aws.amazon.com/) |

<details>
<summary><strong>Services to Know</strong></summary>

| Category | Service | What to Understand |
|----------|---------|-------------------|
| **Compute** | EC2 | Instance types, auto-scaling groups, AMIs |
| | ECS | Task definitions, services, Fargate vs EC2 launch |
| | Lambda | Event-driven compute, cold starts, concurrency limits |
| **Storage** | S3 | Storage classes, lifecycle policies, presigned URLs |
| **Database** | RDS | Multi-AZ, read replicas, automated backups |
| | DynamoDB | Partition keys, GSI/LSI, capacity modes, single-table design |
| **Messaging** | SQS | Standard vs FIFO, visibility timeout, DLQ |
| | SNS | Topic-based pub-sub, fanout pattern, message filtering |
| **Networking** | VPC | Subnets, security groups, NAT gateway, VPC peering |
| | Load Balancer | ALB vs NLB, target groups, health checks, path-based routing |
| **Monitoring** | CloudWatch | Metrics, alarms, log groups, dashboards |

</details>

---

## Engineering Blogs (Read Weekly)

**Goal:** Read 2–3 articles per week. Focus on architecture, scalability, reliability, and production incidents.

| Blog | Focus Areas | Link |
|------|-------------|------|
| Uber Engineering | Microservices, real-time systems, scale | [eng.uber.com](https://eng.uber.com/) |
| Netflix Tech Blog | Resilience, chaos engineering, streaming | [netflixtechblog.com](https://netflixtechblog.com/) |
| Cloudflare Blog | Networking, edge computing, security | [blog.cloudflare.com](https://blog.cloudflare.com/) |
| Stripe Engineering | Payment systems, API design, reliability | [stripe.com/blog/engineering](https://stripe.com/blog/engineering) |
| LinkedIn Engineering | Data infrastructure, distributed systems | [engineering.linkedin.com](https://engineering.linkedin.com/blog) |
| Confluent Blog | Kafka, event streaming, real-time data | [confluent.io/blog](https://www.confluent.io/blog/) |

### Reading Strategy

| When | What |
|------|------|
| Weekday commute/lunch | Skim 1 article — note the architecture diagram and key decisions |
| Weekend | Deep read 1–2 articles — take notes on patterns you can apply |
| Monthly | Revisit notes — connect blog learnings to DDIA/System Design prep |

---

## Books To Finish In 8 Months

| # | Book | Track | Target Completion |
|---|------|-------|-------------------|
| 1 | *Effective Java* — Joshua Bloch | Java & Backend | Month 3 |
| 2 | *Head First Design Patterns* | Java & Backend | Month 4 |
| 3 | *DDIA* (Chapters 1–9) — Martin Kleppmann | Distributed Systems | Month 6 |

### Reading Pace

| Book | Strategy |
|------|----------|
| Effective Java | 2–3 items per week, take notes on Java-specific interview implications |
| Head First Design Patterns | 1 chapter per week, implement each pattern in a small Java project |
| DDIA | 1 chapter every 2 weeks, pair with ByteByteGo/Hussein Nasser videos |

---

## Success Criteria — Interview Ready

The goal is not "X problems solved" or "Y books finished." The goal is:

> **I can walk into any Senior Backend Engineer interview and perform.**

### Coding Interviews
- [ ] Can solve unseen Medium problems in 25 minutes
- [ ] Can solve unseen Hard problems in 40 minutes
- [ ] Can identify the correct pattern within 30 seconds of reading any problem
- [ ] Can explain brute force → optimal → complexity for every solution
- [ ] Can code clean, bug-free Java under pressure

### Java & Backend Interviews
- [ ] Can explain Java internals (HashMap, JVM, GC, concurrency) at depth
- [ ] Can explain Spring Boot internals (DI, Bean lifecycle, transactions, security)
- [ ] Can write production-quality Java without IDE auto-complete
- [ ] Can discuss design patterns with real-world examples

### System Design Interviews
- [ ] Can design these systems end-to-end in 45 minutes:
  - [ ] URL Shortener
  - [ ] Rate Limiter
  - [ ] Notification Service
  - [ ] Inventory Service
  - [ ] Payment System
- [ ] Can explain trade-offs (CAP, consistency vs availability, SQL vs NoSQL)
- [ ] Can discuss Kafka, Redis, caching, and messaging in design context

### Behavioral / Career
- [ ] Resume updated and tailored for international roles
- [ ] LinkedIn optimized for Netherlands/EU visibility
- [ ] Can articulate "why this company" and "why me" for each target
- [ ] Can discuss past projects with STAR format

---

## Weekly Review

Every Sunday, review and plan:

### DSA
- Patterns mastered this week
- Weak patterns identified
- Problems requiring revision (failed spaced repetition)
- Next week's target problems

### Java & Backend
- Topics understood deeply
- Topics requiring coding practice
- Interview notebook entries added
- Coding projects completed

### System Design
- Concepts mastered
- Concepts requiring revision
- HLD designs practiced
- DDIA chapters completed

### Career
- Resume updates made
- LinkedIn updates / posts
- Applications sent
- Networking connections made

**Plan the following week based on weaknesses, not strengths.**

---

## Aligned Weekly Plan (9 Weeks — July 18 to September 19, 2026)

> Every track reinforces every other track. Java topics are chosen because the DSA pattern that week uses them. System Design topics build on DDIA chapters that explain the same distributed primitives. Nothing is studied in isolation.

### Daily Structure (Weekday — 4–5 hrs)

| Block | Time | What |
|-------|------|------|
| DSA | 2 hrs | 2–3 new problems from current pattern + code in Java |
| Java Internals | 1 hr | Paired Java topic — read internals + code examples |
| System Design / DDIA | 45 min | Read chapter or practice one HLD |
| DSA Revision | 30 min | Spaced repetition re-solves |
| Reflection | 15 min | Interview notes, postmortem, explain out loud |

### Daily Structure (Weekend — 8 hrs)

| Block | Time | What |
|-------|------|------|
| DSA | 3 hrs | 3–4 problems (include 1 Hard) |
| Java Deep Dive | 2 hrs | Build something: Custom HashMap, Thread Pool, LRU Cache |
| System Design | 1.5 hrs | Full HLD practice or DDIA deep read |
| Kafka / Redis | 1 hr | One focused topic with hands-on |
| Career | 30 min | Resume, LinkedIn, or 1 application |

---

### Week 0 (Jul 10–17) — Arrays & Hashing + HashMap Internals (DONE)

> Completed: 9 DSA problems, HashMap internals, equals/hashCode notes.

---

### Week 1 (Jul 18–24) — Two Pointers + Sliding Window Start

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Two Pointers finish (3 remaining) + Sliding Window start (8 problems) — target 3/day | Two Pointers + Sliding Window both use pointer manipulation on arrays/strings |
| **Java** | equals/hashCode coding practice (close it) + String internals (pool, immutability, compact strings, `StringBuilder`) | Sliding window on strings requires understanding `char[]` and String internals |
| **System Design** | DDIA Ch 1 (close it) + DDIA Ch 2 start | Reliability, scalability, data models |
| **Kafka/Redis** | Kafka fundamentals: topics, partitions, brokers | Kafka partition key = hashing |
| **Career** | Update resume with Red Hat projects using STAR format | |
| **Blog** | Stripe API design blog | |

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Sliding Window finish (3 remaining) + Binary Search start (6 problems) — target 3/day | Binary search on answer space needs overflow awareness |
| **Java** | Autoboxing, `Integer` caching (-128 to 127), `Comparable`/`Comparator`, `int` overflow | Binary search `(lo + hi) / 2` overflow trap. Comparator contract for sorting. |
| **System Design** | DDIA Ch 2 finish + DDIA Ch 3 start | Data models, storage and retrieval |
| **Kafka/Redis** | Kafka consumers: consumer groups, rebalancing, offset management | Consumer group = sliding window over event stream |
| **Career** | LinkedIn headline + summary optimized for EU/international | |
| **Blog** | Netflix resilience engineering blog | |

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Binary Search finish (4 remaining) + Bit Manipulation (4) + Stack start (4 problems) — target 3/day | Bit manipulation requires understanding Java's signed integers |
| **Java** | Primitives vs wrappers, `PriorityQueue` internals (binary heap), `ArrayDeque` vs `Stack` | Stack problems use `Deque`. Heap problems use `PriorityQueue`. |
| **System Design** | DDIA Ch 3 finish + **URL Shortener HLD** | LSM-trees, B-trees, base62 encoding |
| **Kafka/Redis** | Kafka reliability: idempotency, acks, exactly-once semantics | |
| **Career** | Identify 10 target companies + research interview formats | |
| **Blog** | Uber engineering: real-time systems at scale | |

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Stack finish (4) + Heap (7) + Linked List start (3) — target 3/day | Data structure-heavy problems |
| **Java** | Collections deep dive: `Comparator` contract (transitivity), `TreeMap`, Generics type erasure, PECS | Heap problems use `PriorityQueue`. Interval problems sort `List<int[]>`. |
| **System Design** | DDIA Ch 4 — Encoding & Evolution + **Rate Limiter HLD** | Rate limiter = token bucket. Schema evolution = backward/forward compatibility. |
| **Kafka/Redis** | Redis fundamentals: data types, TTL, cache-aside pattern | Rate limiter commonly implemented with Redis |
| **Career** | Send first 3 applications | |
| **Blog** | Cloudflare: edge computing and rate limiting | |

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Linked List finish (4) + Intervals (4) + Trees start (6) — target 3/day | Pointer manipulation, sorting-based patterns, recursion begins |
| **Java** | `ArrayList` vs `LinkedList` internals, recursion internals, stack frames, `Queue`/`Deque` for BFS | Tree DFS = call stack. Tree BFS = Queue. |
| **System Design** | DDIA Ch 5 — Replication + **Notification System HLD** | Leader-follower replication. Notification fanout = pub-sub. |
| **Kafka/Redis** | Redis distributed locking: Redlock, SETNX + TTL, fencing tokens | Distributed lock = DDIA replication consistency |
| **Career** | Mock behavioral interview: prepare 5 STAR stories | |
| **Blog** | LinkedIn engineering: distributed systems at scale | |

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Trees finish (9) + Graphs start (5) — target 3/day | DFS, BFS, BST properties, LCA, topological sort begins |
| **Java** | `StackOverflowError`, immutability patterns, `Map<K, List<V>>` for adjacency lists | Graph algorithms use maps, sets, and queues |
| **System Design** | DDIA Ch 6 — Partitioning + **Inventory Service HLD** | Hash vs range partitioning. Inventory = consistency under partition. |
| **Kafka/Redis** | Kafka partitioning strategy: key-based routing, partition count tradeoffs | Kafka partitioning = DDIA Ch 6 partitioning |
| **Career** | Send 5 more applications. Follow up on Week 4 applications. | |
| **Blog** | Confluent: Kafka partitioning best practices | |

### Week 7 (Aug 29–Sep 4) — Graphs Finish

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Graphs finish (15) — BFS, DFS, topological sort, Union-Find, Dijkstra — target 3/day | Adjacency list = `Map<Integer, List<Integer>>`. Union-Find = array-backed. Dijkstra = PriorityQueue. |
| **Java** | `HashSet` internals, `ConcurrentHashMap` basics, thread safety overview | `ConcurrentHashMap` is #1 asked concurrent collection |
| **System Design** | DDIA Ch 7 — Transactions + **Payment System HLD** | ACID, isolation levels, 2PC. Payment = exactly-once. |
| **Kafka/Redis** | Kafka transactions: transactional producer, EOS guarantees | Kafka EOS = DDIA transactions applied to event streaming |
| **Career** | Mock coding interview (timed, 2 problems, 45 min) | |
| **Blog** | Stripe: payment system reliability | |

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | DP (22) + Greedy (5) — target 3/day | DP = arrays + memoization. Greedy = sorting + comparator. |
| **Java** | `int[]` vs `Integer[]` memory, 2D array allocation, `Comparator` sorting, Streams + lambdas | DP arrays need memory awareness. Greedy needs custom sorting. |
| **System Design** | DDIA Ch 8 — Distributed Systems Trouble + **Distributed Cache HLD** | Partial failures, unreliable clocks |
| **Kafka/Redis** | End-to-end: design Kafka-backed event-driven system with Redis caching | Integration of all Kafka + Redis knowledge |
| **Career** | Mock coding interview (timed, 2 problems, 45 min) | |
| **Blog** | Review notes from previous weeks | |

### Week 9 (Sep 12–19) — Backtracking + Design + Full Review

| Track | Focus | Why It Connects |
|-------|-------|-----------------|
| **DSA** | Backtracking (6) + Design (11) + full revision of weak patterns | Design problems ARE Java internals questions. LRU = `LinkedHashMap`. |
| **Java** | `LinkedHashMap` (LRU), Trie implementation, OOP design patterns, concurrency: `synchronized`, `volatile`, `ExecutorService` basics | LRU Cache is a Java internals question. Concurrency basics appear in Senior Backend rounds. |
| **System Design** | DDIA Ch 9 — Consensus + review all previous HLD designs | Linearizability, Raft/Paxos, total order broadcast |
| **Kafka/Redis** | Review all Kafka + Redis topics | |
| **Career** | Mock system design interview (45 min). Mock Java backend interview (30 min). Final resume review. | |
| **Blog** | Review all blog notes | |

---

### Weekly Progress Log

| Week | Dates | DSA Done | Java Topic | System Design | Kafka/Redis | Career | Status |
|------|-------|----------|------------|---------------|-------------|--------|--------|
| 0 | Jul 10–17 | 9 problems | HashMap, equals/hashCode | — | — | — | Foundation |
| 1 | Jul 18–24 | | | | | | |
| 2 | Jul 25–31 | | | | | | |
| 3 | Aug 1–7 | | | | | | |
| 4 | Aug 8–14 | | | | | | |
| 5 | Aug 15–21 | | | | | | |
| 6 | Aug 22–28 | | | | | | |
| 7 | Aug 29–Sep 4 | | | | | | |
| 8 | Sep 5–11 | | | | | | |
| 9 | Sep 12–19 | | | | | | |

---

## The Golden Rule

> For every technology, learn:
>
> 1. **Why it exists** — what problem does it solve?
> 2. **How it works internally** — not just the API surface
> 3. **How it scales** — what happens at 10x, 100x, 1000x?
> 4. **How it fails** — failure modes, blast radius, recovery
> 5. **How to monitor it** — metrics, alerts, dashboards
> 6. **When NOT to use it** — alternatives, anti-patterns, over-engineering
>
> *That mindset is what separates Senior Engineers from developers who only know frameworks.*

---

*This roadmap pairs with the [DSA Master Tracker](dsa-patterns/DSA-PATTERNS-ROADMAP.md) for the complete interview preparation system.*

---

## AI Mentor Instructions

Act as my **FAANG and International Career Mentor**.

Do NOT behave like a generic tutor.

### Your Responsibilities
- Review weekly progress and identify gaps
- Adjust study plan based on actual performance
- Increase difficulty gradually as patterns are mastered
- Keep me accountable — call out procrastination
- Focus on deep understanding, not surface-level coverage
- Prioritize interview readiness above all else

### Never Optimize For
- Course completion percentage
- Number of videos watched
- Number of LeetCode problems solved
- Finishing books cover-to-cover

### Always Optimize For
- Interview offers
- Interview success rate
- Backend engineering depth
- Pattern mastery and recognition speed
- Java expertise at staff-level depth
- System design excellence

### Adaptive Rules
- If I fall behind → create a recovery plan
- If I finish early → increase difficulty
- If I become interview-ready → tell me to begin applications immediately
- Never let me procrastinate waiting for "perfect preparation"

> *Perfect preparation doesn't exist. Interview-ready preparation does.*
