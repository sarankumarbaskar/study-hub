# Phase 7 — System Design Interviews: The Framework and 10 Classic Problems

> If you've internalized Phases 0-6, interviews become applying what you know. This chapter gives you the structure to demonstrate that knowledge under pressure.

A system design interview is a 45-60 minute conversation where you design a large-scale system from scratch. The interviewer evaluates: your ability to gather requirements, your knowledge of building blocks (databases, caches, queues, load balancers), your reasoning about trade-offs, and your communication skills. There is no single "correct" answer — the interviewer wants to see HOW you think, not WHAT you memorize.

---

## 1. The Framework — 4 Steps for Every Problem

### Step 1: Requirements and Scope (5 minutes)

**Never jump to architecture.** The first 5 minutes determine the entire direction. Ask:

```
FUNCTIONAL REQUIREMENTS (what the system does):
  "What are the core features?"
  "Who are the users? How many?"
  "What are the most important use cases?"
  "What does the API look like?"

NON-FUNCTIONAL REQUIREMENTS (quality attributes):
  "What's the expected scale? (users, QPS, data volume)"
  "What latency is acceptable? (p99 < 200ms?)"
  "What availability is required? (99.9%? 99.99%?)"
  "Is consistency critical or is eventual consistency acceptable?"
  "Are there any geographic distribution requirements?"

THINGS TO EXPLICITLY CLARIFY:
  "Should I focus on the read path or write path?"
  "Do we need real-time features (notifications, live updates)?"
  "What's the budget/infrastructure? (cloud-native? on-prem?)"
  "What's the time horizon? (MVP vs 5-year platform)"
```

### Step 2: Back-of-Envelope Estimation (5 minutes)

```
STANDARD NUMBERS TO KNOW:
  Daily Active Users (DAU) → QPS:
    100M DAU × 10 requests/user/day = 1B requests/day
    1B / 86,400 seconds = ~12,000 QPS average
    Peak = 2-3× average = ~30,000 QPS

  Storage:
    1 tweet (280 chars) = ~500 bytes
    1 image = ~500KB
    1 video = ~50MB
    100M users × 2 tweets/day × 500B = 100GB/day text
    100M users × 0.5 images/day × 500KB = 25TB/day images

  Bandwidth:
    12,000 QPS × 1KB average response = 12 MB/s = 96 Mbps
    With images: 12,000 QPS × 500KB = 6 GB/s = 48 Gbps (need CDN!)

  Memory (for caching):
    Cache 20% of daily data in Redis
    100GB/day × 20% = 20GB → fits in one Redis node

COMMON CONVERSIONS:
  1 day = 86,400 seconds ≈ 100,000 seconds (for mental math)
  1 million seconds ≈ 12 days
  1 billion seconds ≈ 32 years
  
  QPS TO SERVERS:
  1 web server handles ~1,000-10,000 QPS (depends on complexity)
  30,000 QPS ÷ 5,000 QPS/server = 6 servers (+ redundancy = 8-10)
```

### Step 3: High-Level Design (15-20 minutes)

```
DRAW THE ARCHITECTURE:
  1. Client/User
  2. Load Balancer / API Gateway
  3. Application servers (stateless)
  4. Cache layer (Redis)
  5. Database(s) (primary + read replicas)
  6. Message queue (if async needed)
  7. CDN (if media content)
  8. External services (payment, notification)

DEFINE:
  - API endpoints (REST)
  - Database schema (tables, key columns, indexes)
  - Data flow for each key operation (read path, write path)
```

### Step 4: Deep Dive (15-20 minutes)

The interviewer picks 1-2 areas to go deep. Common deep dives:
- Database design and scaling
- Caching strategy and invalidation
- Handling edge cases and failure modes
- Real-time features
- Search and filtering
- Consistency vs availability trade-offs

---

## 2. The 10 Classic Problems — Solved From First Principles

### Problem 1: URL Shortener (TinyURL)

```
REQUIREMENTS:
  - Shorten URL: long URL → short URL (https://tiny.url/abc123)
  - Redirect: short URL → 301 redirect to original
  - Scale: 100M URLs/month created, 10B redirects/month
  - Custom aliases optional
  - Analytics (click counts)

ESTIMATION:
  Writes: 100M/month ÷ 2.6M sec/month ≈ 40 writes/sec
  Reads: 10B/month ÷ 2.6M ≈ 4,000 reads/sec (100:1 read:write ratio)
  Storage: 100M × 500 bytes/record × 12 months × 5 years = 3TB
  Key length: 7 characters from [a-zA-Z0-9] = 62^7 = 3.5 trillion combinations (enough)

HIGH-LEVEL DESIGN:
  Client → API Gateway → App Server → DB
                                   → Cache (Redis for hot URLs)

SHORT KEY GENERATION:
  Option 1: Hash (MD5/SHA256) of long URL → take first 7 chars
    Pros: same URL always gets same short key (dedup)
    Cons: collision handling needed (rare but possible)
  
  Option 2: Counter-based with Base62 encoding
    Auto-increment ID → Base62 encode → short key
    ID=1000000 → Base62 → "4c92" (always unique, no collision)
    Cons: IDs are sequential (predictable)
  
  Option 3: Pre-generated keys in a KGS (Key Generation Service)
    Generate keys in advance, store in DB. App takes next available.
    Pros: fast, unique, non-sequential
    Cons: need synchronization for KGS

DATABASE:
  Table: urls (id, short_key, long_url, created_at, user_id, click_count)
  Index on short_key (lookups by short key)
  
  Read path: GET /abc123 → Redis cache → if miss → DB lookup → 301 redirect
  Write path: POST /shorten → generate key → write DB → write cache

SCALING:
  Cache: 20% of URLs (Pareto) in Redis → 95%+ cache hit rate
  DB: start single, add read replicas for read scaling
  If >3TB: shard by short_key hash
```

### Problem 2: Rate Limiter

```
REQUIREMENTS:
  - Limit API requests per user/IP
  - Different limits for different endpoints
  - Low latency (< 1ms overhead per request)
  - Distributed (works across multiple servers)

DESIGN:
  Request → Rate Limiter (middleware) → if allowed → Application
                                     → if blocked → 429 Response

ALGORITHM: Sliding Window Counter in Redis
  Key: rate_limit:{user_id}:{window}
  Example: rate_limit:user_42:2025-01-15T10:30
  
  INCR rate_limit:user_42:2025-01-15T10:30
  EXPIRE rate_limit:user_42:2025-01-15T10:30 60  (auto-cleanup)
  
  If count > limit → reject with 429 + Retry-After header

DISTRIBUTED:
  Redis is shared across all app servers → consistent counting
  Race condition: two servers check simultaneously → both allow
  Fix: Lua script (atomic increment + check in one Redis operation)

EDGE CASES:
  What if Redis is down? → allow all requests (fail open) or reject all (fail closed)
  Recommendation: fail open (don't block legitimate users because Redis is down)
```

### Problem 3: Chat System (WhatsApp)

```
REQUIREMENTS:
  - 1:1 messaging, group chat (up to 500 members)
  - Online/offline status, typing indicators
  - Message delivery status (sent, delivered, read)
  - 50M DAU, 500M messages/day

ESTIMATION:
  Messages: 500M/day ÷ 86,400 = ~6,000 messages/sec
  Storage: 500M × 200 bytes = 100GB/day
  Connections: 50M concurrent WebSocket connections (peak)

DESIGN:
  Client ──WebSocket──► Chat Server ──► Message Queue ──► Chat Server ──► Recipient

  WEBSOCKET for real-time bidirectional communication
  Each user maintains ONE persistent WebSocket connection
  
  Chat Server: stateful (knows which users are connected to it)
  Message routing: if recipient on same server → send directly
                   if on different server → route via message queue

  Message flow:
    1. Alice sends message to Bob
    2. Chat server receives via WebSocket
    3. Store in database (messages table)
    4. Check: is Bob online? Which server?
    5. If online: push via Bob's WebSocket connection → "delivered" status
    6. If offline: store for later delivery → push notification via APNs/FCM
    7. When Bob reads: send "read" receipt back to Alice

DATABASE:
  messages (id, sender_id, recipient_id, group_id, content, sent_at, status)
  Partition by: conversation_id (all messages in a conversation on same shard)
  
  Cassandra is a good fit: write-heavy, time-series-like, partition by conversation

GROUP CHAT:
  Group members table: (group_id, user_id)
  When message sent to group: fan-out to all members
  Small groups (< 500): fan-out on write (send to each member's queue)
  Large groups (> 500): fan-out on read (members pull from group feed)
```

### Problem 4: News Feed (Twitter/Instagram)

```
REQUIREMENTS:
  - Post content (text, images, videos)
  - Follow users
  - View chronological/algorithmic feed
  - 300M DAU, average user follows 200 people

ESTIMATION:
  Feed reads: 300M × 10 refreshes/day = 3B reads/day ≈ 35,000 QPS
  Posts: 300M × 0.5 posts/day = 150M posts/day ≈ 1,700 writes/sec

THE CORE CHALLENGE: Fan-out

  PUSH (Fan-out on write):
    When Alice posts: write to ALL her followers' feeds immediately
    Alice has 1000 followers → 1000 writes to 1000 feed caches
    
    Read is FAST: just read your pre-built feed from cache
    Write is EXPENSIVE: celebrity with 10M followers → 10M writes per post
    
    Good for: users with < 10,000 followers (the majority)

  PULL (Fan-out on read):
    When Bob opens app: query all 200 people he follows, merge, sort
    
    Write is FAST: just write one post record
    Read is EXPENSIVE: 200 queries per feed load → slow
    
    Good for: celebrities (avoid 10M fan-out writes)

  HYBRID (what Twitter/Instagram actually does):
    Regular users: push (pre-build followers' feeds)
    Celebrities (> 10K followers): pull (merged on read)
    
    When you open your feed:
    1. Read your pre-built feed (from push) — contains posts from non-celebrities
    2. Query celebrity feeds separately (pull) — merge into your feed
    3. Cache the merged result for subsequent views

FEED STORAGE:
  Redis sorted set per user: ZADD feed:user_42 <timestamp> <post_id>
  ZREVRANGE feed:user_42 0 19 → latest 20 posts for user 42
  
  Trim old entries: ZREMRANGEBYRANK feed:user_42 0 -1001 (keep last 1000)
```

### Problem 5: Notification System

```
REQUIREMENTS:
  - Push notifications (iOS, Android), email, SMS, in-app
  - Millions of notifications/day
  - Template-based, personalized, scheduled
  - Priority levels (critical: OTP, normal: marketing)

DESIGN:
  Event Source → Notification Service → Channel Routers → Delivery Services

  1. Event arrives (order placed, OTP requested, marketing campaign)
  2. Notification Service:
     - Template rendering (personalize with user data)
     - Preference check (user opted out of marketing?)
     - Rate limiting (max 5 notifications/hour per user)
     - Priority routing (OTP → immediate, marketing → batched)
  3. Push to channel-specific queues (Kafka topics)
  4. Channel workers:
     - Push: APNs (iOS) / FCM (Android) / Web Push
     - Email: SES / SendGrid / Mailgun
     - SMS: Twilio / SNS
     - In-app: WebSocket to connected clients

  Message Queue absorbs spikes (Black Friday: 100x normal volume)
  Each channel scales independently
  Dead-letter queue for failed deliveries → retry with backoff

CRITICAL: make idempotent (don't send OTP twice!)
  Track: notification_id + channel → delivered? → skip if yes
```

### Problem 6: Distributed Cache (Redis Cluster Design)

```
REQUIREMENTS:
  - Key-value store, sub-millisecond reads
  - Horizontal scaling (add nodes for more capacity)
  - Fault tolerance (node failure doesn't lose data)
  - 1M QPS read, 100K QPS write

DESIGN:
  Consistent hashing ring with virtual nodes
  Each key → hash to ring position → assigned to node
  Replication factor: 3 (each key stored on 3 consecutive nodes)

  WRITE: client → hash(key) → node A (primary) → replicate to B, C
  READ: client → hash(key) → node A (or any replica)

  Node failure: A dies → B and C still have data → serve reads
                Ring rebalances → A's range split between neighbors

  Adding a node: only ~1/N keys migrate (consistent hashing)
```

### Problem 7: Search Autocomplete

```
REQUIREMENTS:
  - As user types, show top 10 suggestions
  - Ranked by popularity/relevance
  - Response time < 100ms
  - 10B queries/day, 5M unique search terms

DESIGN:
  Trie (prefix tree) stored in memory across multiple nodes
  
  "app" → [apple, application, app store, apparel, appetizer]
  Each node stores: top 10 suggestions for that prefix (pre-computed)
  
  Data flow:
    1. User types "app" → frontend sends to autocomplete service
    2. Service looks up "app" in trie → returns pre-computed top 10
    3. Response in < 10ms (in-memory lookup)

  Updating rankings:
    Background job collects search logs → counts frequency → rebuilds trie
    Updated trie deployed to servers (not real-time — slight delay is OK)

  Optimization:
    Browser caches results for each prefix typed (cache "app" results)
    Don't query on every keystroke — debounce 200ms
    Frontend filters locally as user continues typing
```

### Problem 8: Video Streaming (YouTube/Netflix)

```
REQUIREMENTS:
  - Upload, transcode, and stream video
  - Multiple resolutions (360p, 720p, 1080p, 4K)
  - Adaptive bitrate streaming
  - 1B videos, 100M daily viewers

DESIGN:
  Upload → Transcode → Store → CDN → Stream

  Upload: chunked upload to blob storage (S3)
  Transcode: convert to multiple resolutions + formats
    Queue-based: upload event → Kafka → transcoding workers
    Output: 360p.mp4, 720p.mp4, 1080p.mp4, 4K.mp4 (each in HLS/DASH segments)
  Store: S3/GCS for video files (cheap, durable)
  CDN: cache popular videos at edge locations worldwide
    80% of views are for 20% of videos → very high CDN hit rate
  Stream: HLS/DASH protocol — video split into 2-10 second segments
    Player requests segments one at a time
    Adaptive bitrate: if bandwidth drops → switch to lower resolution segment
                      if bandwidth improves → switch to higher resolution

DATABASE:
  videos (id, title, description, uploader_id, status, upload_date)
  video_segments (video_id, resolution, segment_num, cdn_url)
  views (video_id, user_id, watched_seconds, timestamp) — write-heavy → Cassandra
```

### Problem 9: Ride Sharing (Uber)

```
REQUIREMENTS:
  - Rider requests ride, matched with nearby driver
  - Real-time driver location tracking
  - ETA calculation
  - 15M rides/day, 5M concurrent drivers

CORE CHALLENGE: Location matching (find nearby drivers fast)

DESIGN:
  Rider App → API Gateway → Matching Service → Driver App

  Driver location:
    Drivers send GPS coordinates every 3 seconds
    3M drivers × 1 update/3sec = 1M location updates/sec!
    
    Storage: NOT a regular database (too many writes)
    Solution: in-memory geospatial index (Redis GEO or custom QuadTree/Geohash)
    
    GEOHASH: encode (lat, lng) into a string
      (37.7749, -122.4194) → "9q8yyk" (6-char precision ≈ 600m × 600m)
      Nearby drivers = same geohash prefix
      Redis: GEOADD drivers 37.7749 -122.4194 driver_42
             GEORADIUSBYMEMBER drivers driver_42 5 km COUNT 20 → 20 nearest drivers

  Matching:
    1. Rider requests ride → send (pickup, destination)
    2. Find 10 nearest available drivers (GEORADIUS)
    3. Calculate ETA for each (routing service)
    4. Send ride request to nearest driver
    5. Driver accepts → match confirmed → start ride
    
  Real-time updates:
    WebSocket connection between app and server
    Driver location → streamed to rider's app during ride
    ETA updated every 30 seconds
```

### Problem 10: Payment System

```
REQUIREMENTS:
  - Process payments (charge, refund)
  - ACID transactions (never double-charge, never lose a payment)
  - Reconciliation with payment providers (Stripe, PayPal)
  - PCI compliance
  - 10M transactions/day

CORE CHALLENGE: Exactly-once processing (critical — money is involved!)

DESIGN:
  Client → API → Payment Service → Payment Gateway (Stripe/PayPal)
                        ↓
                  Payment DB (source of truth)

  Payment flow (idempotent):
    1. Client sends: POST /payments {order_id, amount, idempotency_key}
    2. Check idempotency_key: already processed? → return existing result
    3. Create payment record: status=PENDING
    4. Call payment gateway (Stripe): charge card
    5. Gateway responds: success → update status=COMPLETED
                         failure → update status=FAILED
    6. Return result to client

  IDEMPOTENCY KEY:
    Client generates a unique key per payment attempt
    If client retries (network timeout): same key → same result
    Prevents double-charging (the #1 fear in payment systems)

  DATABASE: PostgreSQL with SERIALIZABLE isolation for payment records
    Strict ACID: payment deducted from balance + recorded in ledger atomically
    
  RECONCILIATION:
    Daily job: compare our payment records with Stripe/PayPal records
    Flag discrepancies (charged but not recorded, recorded but not charged)
    Alert for manual review

  LEDGER (double-entry bookkeeping):
    Every transaction creates TWO entries:
      DEBIT: customer account -$100
      CREDIT: merchant account +$100
    Total debits ALWAYS equals total credits (invariant check)
    Provides complete audit trail
```

---

## 3. Interview Tips and Common Mistakes

```
DO:
  ✓ Ask clarifying questions first (never assume scope)
  ✓ Start with high-level design, then go deep where asked
  ✓ Discuss trade-offs explicitly ("I chose X over Y because...")
  ✓ Give concrete numbers (QPS, storage, servers) — shows you can estimate
  ✓ Mention failure modes ("What if this service goes down?")
  ✓ Draw clearly (boxes for services, arrows for data flow, labels)
  ✓ Drive the conversation (don't wait for the interviewer to lead)

DON'T:
  ✗ Jump to architecture without understanding requirements
  ✗ Over-engineer (YAGNI — design for current scale, mention future scaling)
  ✗ Ignore non-functional requirements (latency, availability, consistency)
  ✗ Use buzzwords without understanding ("let's add Kafka" — why?)
  ✗ Design in silence (think out loud — the interviewer evaluates your reasoning)
  ✗ Forget about data (database schema, data flow, data volume)
  ✗ Ignore the read/write ratio (it determines your caching and scaling strategy)
```

---

---

## 4. The RESHADED Framework — Structured Delivery (from Educative/Grokking)

The RESHADED framework ensures you cover all critical areas systematically. Use it as a checklist during your interview:

```
R — REQUIREMENTS:       Functional + non-functional requirements
E — ESTIMATION:         QPS, storage, bandwidth, server count
S — STORAGE SCHEMA:     Database choice, table design, indexes
H — HIGH-LEVEL DESIGN:  Architecture diagram, data flow
A — API DESIGN:         Endpoints, request/response format
D — DETAILED DESIGN:    Deep dive into 1-2 components (caching, messaging, etc.)
E — EVALUATION:         Trade-offs, bottlenecks, failure modes, future scaling
D — DISTINCTIVE:        What makes YOUR design unique? Mention edge cases, optimizations

This maps to a 45-minute interview as:
  Minutes 0-5:   R + E (requirements + estimation)
  Minutes 5-10:  S + A (storage schema + API design)
  Minutes 10-25: H (high-level design — draw the architecture)
  Minutes 25-40: D (detailed design — deep dive)
  Minutes 40-45: E + D (evaluation + distinctive points)
```

---

## 5. Staff-Level Expectations — What Distinguishes Senior from Staff

```
SENIOR ENGINEER (expected):
  ✓ Complete design satisfying all requirements
  ✓ Appropriate technology choices with basic reasoning
  ✓ Identifies obvious bottlenecks and scaling issues
  ✓ Good communication, draws clear diagrams

STAFF ENGINEER (distinguishing):
  ✓ Everything above PLUS:
  ✓ Proactively discusses failure modes WITHOUT being asked
    "What happens if Redis goes down? We fall back to DB with a circuit breaker."
  ✓ Mentions operational concerns
    "We'd need alerting on cache hit rate drops and queue consumer lag."
  ✓ Discusses data consistency models explicitly
    "We can tolerate eventual consistency for the feed, but payments need strong consistency."
  ✓ Brings up real-world trade-offs from experience
    "In my experience, fan-out on write works well up to ~10K followers. Beyond that, hybrid."
  ✓ Considers multi-region deployment
    "For global users, we'd replicate to 3 regions with active-active using CRDTs for conflict resolution."
  ✓ Discusses cost and organizational impact
    "This adds operational complexity. Before splitting into microservices, I'd ensure we have
     distributed tracing, centralized logging, and a team structure that matches the service boundaries."

THE #1 DIFFERENTIATOR:
  Senior: "Here's what I'd build"
  Staff: "Here's what I'd build, here's what could go wrong, here's how I'd detect it,
          and here's why I chose this over the alternative"
```

---

## 6. Ten MORE Classic Problems — Quick Sketches

### Problem 11: Distributed File Storage (Google Drive/Dropbox)

```
KEY INSIGHT: chunk files into blocks (4MB each), store blocks in blob storage (S3)
  Metadata service: file → list of block IDs, permissions, sharing
  Sync: client computes diff of blocks → uploads only changed blocks
  Conflict resolution: last-writer-wins OR keep both versions
  Deduplication: same block content → same hash → store once
```

### Problem 12: Web Crawler (Google)

```
KEY INSIGHT: BFS with a priority URL queue, politeness (don't overload one domain)
  Frontier queue: URLs to visit (priority by page rank, freshness)
  Fetcher: download page (respect robots.txt, rate limit per domain)
  Parser: extract links → add to frontier, extract content → indexer
  Dedup: URL hash → already visited? Skip.
  Scale: distribute by domain hash across crawler instances
```

### Problem 13: Metrics Monitoring (Datadog/Prometheus)

```
KEY INSIGHT: time-series database + alerting rules
  Agents on each server → push metrics to ingestion service
  Write to time-series DB (InfluxDB/Prometheus) → retention policy (downsample old data)
  Dashboard service: query time-series DB → render Grafana charts
  Alerting: rules engine evaluates conditions → notifies via PagerDuty/Slack
  Scale: shard by metric name or time window
```

### Problem 14: Ticket Booking (Ticketmaster)

```
KEY INSIGHT: inventory management with race conditions
  Seat inventory: exactly-once booking under massive concurrency
  Approach: optimistic locking (version column) or SELECT FOR UPDATE
  Temporary hold: user clicks seat → 5-minute reservation → expires if not paid
  Queue: during high demand (concert release), virtual waiting room → process in order
  Scale: shard by event_id (each event is independent)
```

### Problem 15: Email System (Gmail)

```
KEY INSIGHT: store + forward architecture, eventual delivery
  SMTP for sending, IMAP/POP for receiving
  Inbox: blob storage for email bodies, metadata in database
  Search: Elasticsearch index on sender, subject, body
  Spam filtering: ML classifier on email features
  Scale: shard by user_id (each user's mailbox is independent)
```

### Problem 16: Social Graph (Facebook Friends)

```
KEY INSIGHT: graph database or adjacency list in relational DB
  Friends: bidirectional edge (both users store the relationship)
  Friends-of-friends: 2-hop BFS on graph → requires efficient graph traversal
  "People you may know": intersection of friend lists + ML ranking
  Graph DB (Neo4j): native graph storage, efficient traversals
  Scale: partition by user_id, replicate hot users (celebrities)
```

### Problem 17: Online Code Judge (LeetCode)

```
KEY INSIGHT: sandboxed code execution with resource limits
  User submits code → queue (Kafka) → worker picks up
  Worker: Docker container with CPU/memory/time limits
  Run code against test cases → compare output → return verdict
  Security: sandbox MUST prevent: network access, file system escape, fork bombs
  Scale: horizontal worker scaling, cache test case results
```

### Problem 18: Collaborative Editing (Google Docs)

```
KEY INSIGHT: Operational Transform (OT) or CRDT for conflict resolution
  Multiple users edit simultaneously → each edit = operation (insert char at position 5)
  OT: transform concurrent operations against each other to maintain consistency
  CRDT: conflict-free replicated data type — mathematically guaranteed convergence
  WebSocket for real-time sync between all editors
  Cursor positions: broadcast to all users (presence awareness)
```

### Problem 19: Content Moderation System

```
KEY INSIGHT: async ML pipeline + human review
  User posts content → queue → ML classifier (text, image, video)
  Confidence > 95% harmful → auto-remove + notify user
  Confidence 50-95% → human review queue (content moderators)
  Confidence < 50% → approve (with periodic spot-checking)
  Appeals: user requests review → escalated to senior moderator
  Scale: ML inference on GPU instances, horizontal scaling of classifiers
```

### Problem 20: Distributed Configuration Service (Feature Flags)

```
KEY INSIGHT: eventually consistent key-value store with push updates
  Admin sets flag: enable_dark_mode=true for 10% of users
  Config service stores in database + broadcasts via Kafka event
  Application instances: subscribe to events → update local cache
  Evaluation: user_id → hash → if hash % 100 < 10 → dark mode enabled
  Gradual rollout: 1% → 5% → 10% → 50% → 100% (with rollback at each step)
  Tools: LaunchDarkly, Unleash, Flagsmith, or custom-built
```

---

## 7. Spectacular Failures — What Went Wrong at Scale

```
FACEBOOK OUTAGE (October 2021):
  Duration: 6 hours. 3.5 billion users affected.
  Cause: BGP configuration change withdrew Facebook's routes from the internet
  Effect: Facebook's DNS servers became unreachable → facebook.com resolved to NOTHING
  Cascading: internal tools also depended on Facebook's network → engineers couldn't fix remotely
  Lesson: don't make your recovery tools depend on the system that's down

AMAZON PRIME DAY OUTAGE (2018):
  Duration: ~1 hour at the start of Prime Day
  Cause: auto-scaling couldn't keep up with the traffic spike
  Effect: millions of users saw error pages → $100M+ estimated lost sales
  Lesson: load test with REALISTIC traffic patterns, including the initial spike

KNIGHT CAPITAL (2012):
  Duration: 45 minutes. $440 million lost.
  Cause: deployment error activated old code that made random trades
  Effect: the software bought high and sold low, 6 million trades in 45 minutes
  Lesson: feature flags, canary deployments, automatic kill switches
  
GITHUB (2018):
  Duration: 24+ hours of degraded service
  Cause: database failover to a secondary → 5 seconds of writes lost
  Effect: data inconsistency between primary and replica
  Lesson: test your disaster recovery. Automatic failover can cause data loss
          if replication lag > 0 at the moment of failure.
```

---

*After this phase: system design interviews become conversations where you apply what you know, not tests where you recite what you memorized. You have the RESHADED framework for structured delivery, staff-level differentiation strategies, 20 solved problems, and real-world failure case studies. You can design any system from first principles because you understand every building block deeply.*
