# Phase 3 — Caching: The Single Most Impactful Performance Optimization

> Caching is not just "put it in Redis." It's understanding access patterns, consistency trade-offs, and failure modes. A well-designed cache reduces database load by 99%. A poorly designed cache causes stale data and outages.

A cache stores frequently accessed data in a faster storage layer so future requests are served without hitting the slower origin. The entire internet runs on caching — your browser caches images, CDNs cache web pages, Redis caches database results, CPUs cache memory. Understanding caching at every level is arguably the most valuable skill in system design, because a single well-placed cache can transform a system's performance characteristics more than any other optimization.

---

## 1. Why Caching Works — The Mathematics of Access Patterns

Caching works because of two fundamental observations about real-world data access:

**Temporal locality:** Data accessed recently is likely to be accessed again soon. A user who views a product page will likely view it again. A configuration value read once per request is read millions of times.

**The Pareto Principle (80/20 rule):** Roughly 20% of data accounts for 80% of reads. On Twitter, 1% of tweets generate 99% of views. On e-commerce sites, 5% of products account for 80% of page views. If you cache just the hottest 20% of your data, you eliminate 80% of database reads.

```
Latency comparison — why caching is transformative:

Source                  Latency         Relative
──────────────────────────────────────────────────
L1 CPU cache            ~1 ns           1x
L2 CPU cache            ~4 ns           4x
L3 CPU cache            ~12 ns          12x
Redis (local)           ~100 μs         100,000x
Redis (network)         ~500 μs         500,000x
PostgreSQL (indexed)    ~2-10 ms        2,000,000x
PostgreSQL (complex)    ~50-500 ms      50,000,000x
External API call       ~100-1000 ms    100,000,000x

Moving a frequently-accessed query from PostgreSQL (5ms) to Redis (0.5ms)
= 10x latency reduction for that request
= database CPU freed for other work
= higher overall throughput
```

---

## 2. Cache Levels — Where to Cache for Maximum Impact

```
Request flows through MULTIPLE cache layers:

Browser                    ┌─────────────────────┐
  │                        │   Browser Cache      │  HTTP cache headers (max-age, ETag)
  │ if miss                │   (images, CSS, JS)  │  Eliminates network request entirely
  ▼                        └─────────────────────┘
CDN Edge Server            ┌─────────────────────┐
  │                        │   CDN Cache          │  Cloudflare, CloudFront, Akamai
  │ if miss                │   (static + dynamic) │  Serves from nearest edge location
  ▼                        └─────────────────────┘
API Gateway / Load Balancer┌─────────────────────┐
  │                        │   Gateway Cache      │  Nginx proxy_cache, Varnish
  │ if miss                │   (API responses)    │  Full response caching for GET requests
  ▼                        └─────────────────────┘
Application Server         ┌─────────────────────┐
  │                        │   Application Cache  │  Redis, Memcached, in-process cache
  │ if miss                │   (business data)    │  Query results, computed values, sessions
  ▼                        └─────────────────────┘
Database                   ┌─────────────────────┐
                           │   DB Query Cache     │  MySQL query cache (deprecated), PG shared_buffers
                           │   OS Page Cache      │  Kernel caches file pages in RAM
                           └─────────────────────┘

RULE: Cache as CLOSE to the user as possible.
  Browser cache: 0 latency (no network at all!)
  CDN: 5-20ms (nearest edge, continent-level)
  Application cache: 0.1-1ms (in-datacenter Redis)
  Database cache: eliminates disk I/O but still query overhead

In practice, most teams focus on APPLICATION CACHE (Redis) because:
  - You control it completely
  - It handles business-specific invalidation
  - It's shared across all application instances
  - It persists across deployments (unlike in-process caches)
```

---

## 3. Redis — The Universal Caching Tool

### Why Redis Dominates

Redis (Remote Dictionary Server) is an **in-memory data structure store** that can be used as a cache, database, message broker, and more. It's the default caching tool for good reason: sub-millisecond latency, rich data structures (not just key-value), built-in persistence, replication, and clustering. Almost every production system you'll encounter uses Redis somewhere.

### Data Structures and Use Cases

```
STRUCTURE      OPERATIONS              REAL-WORLD USE CASE
──────────────────────────────────────────────────────────────────────
String         GET, SET, INCR, DECR    Session storage, simple caching, counters
               SETEX (with TTL)        Rate limiting (INCR + EXPIRE)
               SETNX (if not exists)   Distributed locks

List           LPUSH, RPUSH, LPOP      Message queues, recent activity feeds
               LRANGE, LLEN            "Latest 10 notifications" = LRANGE 0 9

Set            SADD, SMEMBERS,         Unique visitors tracking, tags
               SINTER, SUNION          "Users who liked BOTH posts" = SINTER

Sorted Set     ZADD, ZRANGE,           Leaderboards, priority queues
               ZRANGEBYSCORE           "Top 10 players" = ZREVRANGE 0 9 WITHSCORES
               ZRANK                   "Player rank" = ZRANK leaderboard player_id

Hash           HSET, HGET, HGETALL     Object storage (user profile as hash fields)
               HINCRBY                 Counters per object (views per article)

Stream         XADD, XREAD,            Event streaming, message broker (like Kafka-lite)
               XREADGROUP              Consumer groups for parallel processing

HyperLogLog    PFADD, PFCOUNT          Approximate unique count (1.6KB for billions of items!)
                                       "How many unique visitors today?" with 0.81% error

Bitmap         SETBIT, GETBIT,         Feature flags, daily active users
               BITCOUNT                "Was user 42 active on Jan 15?" = GETBIT active:20250115 42

Geo            GEOADD, GEODIST,        "Find restaurants within 5km" = GEORADIUSBYMEMBER
               GEORADIUS               Location-based services
```

### Redis Persistence — RDB vs AOF

```
RDB (Snapshotting):
  Periodically dumps entire dataset to disk as a binary file
  save 900 1      # snapshot if 1+ keys changed in 900 seconds
  save 300 100    # snapshot if 100+ keys changed in 300 seconds
  
  Pros: compact file, fast restarts, good for backups
  Cons: data loss between snapshots (up to minutes of data lost on crash)
  
AOF (Append-Only File):
  Logs every write command to a file
  appendfsync always    # fsync after every command (safest, slowest)
  appendfsync everysec  # fsync every second (good compromise)
  appendfsync no        # let OS decide when to flush (fastest, least safe)
  
  Pros: minimal data loss (at most 1 second with everysec)
  Cons: larger files, slower restarts (must replay all commands)

RECOMMENDATION: Use BOTH
  AOF for durability (minimal data loss)
  RDB for fast restarts and backups
  Redis can use AOF for recovery + RDB for periodic snapshots
```

### Redis Replication, Sentinel, and Cluster

```
REPLICATION (Master-Replica):
  One master handles writes
  Replicas copy data from master (async by default)
  Reads can go to replicas (read scaling)
  
  Master ───replication──► Replica 1
         ───replication──► Replica 2
  
  If master dies: manual failover (promote a replica)

SENTINEL (Automatic Failover):
  Sentinel processes monitor master and replicas
  If master is unreachable: automatically promote a replica to master
  Clients connect to Sentinel, which redirects to current master
  
  Sentinel 1 ──monitor──► Master
  Sentinel 2 ──monitor──► Master     Master dies → Sentinel promotes Replica 1
  Sentinel 3 ──monitor──► Master

CLUSTER (Horizontal Sharding):
  Data split across multiple masters (16,384 hash slots)
  Each master has its own replicas
  
  Master 1 (slots 0-5460)     → Replica 1a
  Master 2 (slots 5461-10922) → Replica 2a
  Master 3 (slots 10923-16383)→ Replica 3a
  
  Client sends command → cluster redirects to correct master (MOVED response)
  Use when: data doesn't fit in one machine's memory
```

---

## 4. Caching Strategies — How Cache Interacts with Database

### Cache-Aside (Lazy Loading) — The Most Common Strategy

This is the default strategy for most applications. The application manages both the cache and the database directly.

```
READ PATH:
  1. App checks cache: GET user:42
  2. CACHE HIT → return cached data (fast!)
  3. CACHE MISS → query database
  4. Store result in cache: SET user:42 {data} EX 3600
  5. Return data

  App ──GET──► Cache
  App ◄──HIT── Cache     (done)
  App ◄──MISS─ Cache
  App ──SELECT──► Database
  App ◄──data─── Database
  App ──SET──► Cache     (populate for next time)

WRITE PATH:
  1. App writes to database
  2. App invalidates cache: DEL user:42
  (next read will miss cache → fetch fresh from DB → repopulate cache)

Pros: simple, only caches data that's actually requested, cache failure doesn't break reads (just slower)
Cons: cache miss penalty (first request is slow), stale data possible if invalidation fails

WHEN TO USE: most web applications, APIs, microservices — this is your default choice.
```

### Read-Through — Cache Manages the Load

```
The CACHE itself is responsible for loading data on a miss.
App always talks to cache. Cache talks to DB.

  App ──GET──► Cache
  Cache ◄──MISS──► Database  (cache fetches from DB automatically)
  Cache ──SET──► itself     (cache stores the result)
  App ◄──data── Cache

Pros: simpler application code (no DB read logic), consistent cache population
Cons: initial request still slow (cache miss + DB query), need cache library support
WHEN TO USE: when using a cache provider that supports it (e.g., NCache, Hazelcast)
```

### Write-Through — Write to Cache AND Database

```
Every write goes to BOTH cache and database (synchronously).

  App ──WRITE──► Cache ──WRITE──► Database
  App ◄──ACK──── Cache ◄──ACK──── Database

Pros: cache is always up to date, no stale data
Cons: higher write latency (must wait for both), caches data that may never be read
WHEN TO USE: data that's read immediately after write (user profile update → display updated profile)
```

### Write-Behind (Write-Back) — Async Database Writes

```
Write to cache immediately. Flush to database ASYNCHRONOUSLY in the background.

  App ──WRITE──► Cache ──ACK──► App  (fast! just wrote to memory)
  Cache ──async──► Database  (background flush, batched)

Pros: extremely fast writes, can batch DB writes for efficiency
Cons: data loss risk if cache crashes before flush, complexity
WHEN TO USE: write-heavy workloads where some data loss is acceptable (analytics, metrics, activity logs)
```

### Strategy Decision Framework

```
Access Pattern                          Best Strategy
──────────────────────────────────────────────────────────────
Read-heavy, writes are rare            Cache-aside + TTL
Read immediately after write           Write-through
Write-heavy, reads can be stale        Write-behind
Read-heavy, cache controls loading     Read-through
Real-time data, staleness = bad        Short TTL + event-driven invalidation
```

---

## 5. Cache Invalidation — The Hardest Problem in Computer Science

Phil Karlton's famous quote: "There are only two hard things in Computer Science: cache invalidation and naming things." Cache invalidation is hard because you need the cache to reflect changes in the source data, but the cache and the source are separate systems that can get out of sync.

### Invalidation Strategies

```
1. TTL-BASED (Time To Live):
   SET user:42 {data} EX 3600  → expires after 1 hour
   
   Simple, predictable, no coordination needed.
   Staleness window = up to TTL duration.
   Good for: data that changes infrequently (product catalog, config, reference data)
   Bad for: data where staleness is unacceptable (account balance, inventory)
   
   CHOOSING TTL:
     30 seconds:  near real-time, high DB load (cache misses frequently)
     5 minutes:   good balance for most applications
     1 hour:      configuration data, reference data
     24 hours:    truly static data (country codes, language lists)

2. EVENT-DRIVEN INVALIDATION:
   When data changes in DB → publish event → cache subscriber deletes/updates cache
   
   DB write → Kafka event → Cache consumer → DEL user:42
   
   Near real-time invalidation, minimal staleness.
   Good for: data that changes unpredictably and must be fresh
   Complexity: need event infrastructure (Kafka, RabbitMQ)

3. VERSIONED KEYS:
   Instead of caching user:42, cache user:42:v7
   When data changes, increment version → user:42:v8
   Old versions expire via TTL, new version is a cache miss → fresh data
   
   Good for: avoiding race conditions between write and invalidation

4. TAG-BASED INVALIDATION:
   Tag cached entries: product:42 tagged with [catalog, pricing]
   When pricing changes: invalidate all entries tagged "pricing"
   
   Good for: complex dependency graphs (product price depends on catalog, tax, promotion)
```

### The Stale Data Problem

```
SCENARIO: user updates their name from "Alice" to "Bob"

  t=0:   Cache has user:42 = {name: "Alice"}
  t=1:   App writes {name: "Bob"} to database
  t=2:   App deletes user:42 from cache
  t=2.5: ANOTHER request reads user:42 → cache MISS → reads DB → gets "Bob" → caches "Bob"
  
  Works correctly! But what if step 2 fails (network blip)?
  
  t=0:   Cache has user:42 = {name: "Alice"}
  t=1:   App writes {name: "Bob"} to database
  t=2:   DEL user:42 FAILS (Redis briefly unreachable)
  t=3:   Cache still has {name: "Alice"} → STALE for up to TTL duration!
  
DEFENSES:
  - Use TTL as a safety net (even with event-driven invalidation, TTL eventually expires stale data)
  - Retry invalidation with exponential backoff
  - Use write-through (cache is always updated on write)
  - Accept bounded staleness (many use cases tolerate minutes of stale data)
```

---

## 6. CDN — Caching at the Edge of the Network

### How CDN Works

A CDN (Content Delivery Network) is a globally distributed network of servers (called **edge locations** or **Points of Presence / PoPs**) that cache content close to end users. Instead of every user hitting your origin server in us-east-1, users hit the nearest CDN edge (50-100 locations worldwide), which is typically 5-20ms away instead of 100-300ms.

```
WITHOUT CDN:
  User in Tokyo ──── 200ms RTT ────► Origin in Virginia
  Every request: 200ms network + server processing
  
WITH CDN:
  User in Tokyo ──── 5ms RTT ────► CDN Edge in Tokyo
  CDN Edge ──── 200ms (only on MISS) ────► Origin in Virginia
  
  First request: 205ms (miss, fetch from origin)
  Subsequent requests: 5ms (served from edge cache!)
  
  For static content (images, CSS, JS): 95%+ hit rate at CDN
  For API responses (GET /products): 50-80% hit rate with proper cache headers
```

### Cache-Control Headers

```
Cache-Control: max-age=3600
  Browser + CDN: cache for 1 hour. Don't even ask the server.
  
Cache-Control: s-maxage=3600, max-age=0
  CDN: cache for 1 hour. Browser: don't cache (always ask CDN).
  Useful: CDN serves fast, but user always gets CDN-fresh version.

Cache-Control: no-cache
  MISLEADING NAME: it DOES allow caching, but MUST revalidate with server before using.
  Browser sends: If-None-Match: "etag-abc123"
  Server responds: 304 Not Modified (use your cached copy) — or 200 with new data.

Cache-Control: no-store
  Do NOT cache at all. Not in browser, not in CDN, not anywhere.
  Use for: sensitive data (bank balances, personal info, auth tokens).

Cache-Control: stale-while-revalidate=60
  Serve stale content while fetching fresh content in the background.
  User gets instant response (stale but fast), next user gets fresh.
  Excellent for: API responses where slight staleness is acceptable.

ETag (Entity Tag):
  Server sends: ETag: "abc123" (hash of content)
  Browser caches content + ETag
  Next request: If-None-Match: "abc123"
  If content unchanged: 304 Not Modified (no body sent, saves bandwidth)
  If changed: 200 OK with new content + new ETag
```

---

## 7. Cache Stampede and Thundering Herd

### The Problem

When a popular cached item expires, and hundreds of concurrent requests arrive simultaneously, ALL of them see a cache miss and ALL of them query the database at the same time. This is a **cache stampede** (or **thundering herd**), and it can overwhelm the database and cause cascading failures.

```
t=0:  Cache entry "popular_product" expires (TTL reached)
t=0:  500 concurrent requests arrive for "popular_product"
t=0:  ALL 500 check cache → MISS
t=0:  ALL 500 query database simultaneously
t=0:  Database: 500 identical queries → CPU spike → slow response → timeout
t=1:  Cascading failure: other queries also slow → more timeouts → system down

This is NOT a theoretical problem. It happens in production at scale.
```

### Solutions

```
1. LOCKING (Mutex/Lock):
   First request that misses: acquire lock, fetch from DB, populate cache, release lock
   Other requests: wait for lock (or return stale data)
   
   Thread 1: MISS → SETNX lock:product:42 → acquired → query DB → SET cache → DEL lock
   Thread 2: MISS → SETNX lock:product:42 → NOT acquired → wait/retry → HIT
   
   Pros: only ONE request hits the database
   Cons: all other requests wait (latency spike for waiting requests)

2. PROBABILISTIC EARLY EXPIRATION:
   Each request computes: should I refresh before TTL expires?
   Probability increases as TTL approaches expiration.
   By the time TTL expires, someone has ALREADY refreshed it.
   
   Pros: no coordination, no locks, graceful
   Cons: slight over-fetching from DB

3. STALE-WHILE-REVALIDATE:
   Serve the stale cached value while refreshing in the background.
   Users get instant (slightly stale) response.
   One background thread refreshes the cache.
   
   Pros: zero latency impact, users always get a response
   Cons: brief period of stale data

4. BACKGROUND REFRESH:
   A background job refreshes popular cache entries BEFORE they expire.
   Cache never expires for hot data — always fresh.
   
   Pros: eliminates cache misses for hot data entirely
   Cons: complexity, must know which keys are "hot"

RECOMMENDATION: Use stale-while-revalidate for most cases.
  Use locking for data where staleness is completely unacceptable.
```

---

## 8. Cache Eviction Policies

When the cache is full, which entry do you remove to make room for new data?

```
POLICY    HOW IT WORKS                          WHEN TO USE
──────────────────────────────────────────────────────────────────
LRU       Remove Least Recently Used            Default choice. Works well for most workloads.
          (the entry accessed longest ago)       Assumes: recently accessed = likely accessed again.

LFU       Remove Least Frequently Used          When some items are always hot (product pages).
          (the entry with fewest accesses)       Better than LRU for skewed access patterns.

FIFO      Remove oldest entry (First In)        Simple, predictable. Good for time-based data.

TTL       Remove expired entries                 Always use TTL as a baseline (safety net for staleness).

Random    Remove a random entry                 Surprisingly effective! O(1), no tracking overhead.
          (no bookkeeping needed)               Good for large caches where LRU overhead matters.

Redis eviction policies:
  volatile-lru:   LRU among keys with TTL set
  allkeys-lru:    LRU among ALL keys (recommended for pure cache)
  volatile-ttl:   evict keys with shortest TTL first
  noeviction:     reject writes when full (for Redis as a database, not cache)
  
  SET: maxmemory 2gb
  SET: maxmemory-policy allkeys-lru
```

---

## 9. Caching Best Practices

```
ARCHITECTURE:
  ✓ Cache at the RIGHT level (browser > CDN > gateway > app > DB)
  ✓ Use Redis for application caching (proven, fast, rich features)
  ✓ Set TTL on EVERY cached entry (prevent unbounded stale data)
  ✓ Use cache-aside as your default strategy
  ✓ Design for cache failure (app must work without cache, just slower)

KEYS:
  ✓ Use structured key names: user:{id}:profile, product:{sku}:price
  ✓ Include version in keys when needed: user:{id}:v{version}
  ✓ Avoid very long keys (wastes memory, slower lookups)
  ✗ Don't cache by user input directly (injection risk, unbounded key space)

MONITORING:
  ✓ Track hit rate (target: >95% for warm cache)
  ✓ Track miss rate and miss penalty (DB query time on miss)
  ✓ Track memory usage (approaching maxmemory? evictions happening?)
  ✓ Track latency p99 (should be <1ms for Redis)
  ✓ Alert on hit rate drops (may indicate invalidation bug or traffic pattern change)

DATA:
  ✓ Cache COMPUTED results, not raw DB rows (save computation time too)
  ✓ Cache serialized responses (JSON/Protobuf) if the endpoint always returns same format
  ✓ Use appropriate serialization (MessagePack/Protobuf smaller than JSON)
  ✗ Don't cache sensitive data without encryption (PII, tokens, passwords)
  ✗ Don't cache enormous values (>1MB in Redis slows down due to single-threaded model)

INVALIDATION:
  ✓ TTL as a safety net for EVERY cached entry
  ✓ Event-driven invalidation for critical data (balance, inventory)
  ✓ Invalidate on WRITE, not on READ (don't serve stale data)
  ✓ Handle invalidation failures gracefully (retry, TTL catches it eventually)
```

---

---

## 10. Redis Behind the Scenes — How It's Actually Fast

```
WHY REDIS IS FAST (the real reasons):

1. EVERYTHING IS IN MEMORY
   RAM access: ~100 ns. SSD access: ~16,000 ns. That's 160x faster.
   Redis keeps ALL data in RAM. Disk is only for persistence.

2. SINGLE-THREADED EVENT LOOP (for command processing)
   No locks, no context switches, no race conditions.
   One thread processes ALL commands sequentially.
   This sounds slow but: one thread can process 100K-1M commands/sec
   because each command is microseconds (memory access + simple operation).
   Bottleneck is network I/O, not CPU — which leads to:

3. I/O MULTIPLEXING (epoll/kqueue)
   One thread handles thousands of client connections using epoll.
   Same pattern as NIO/Netty — one thread, many connections.
   Redis 6+ added I/O threads for reading/writing to network sockets
   (command processing is still single-threaded).

4. EFFICIENT DATA STRUCTURES:
   Sorted Set = Skip List (O(log n) insert/search, simpler than red-black tree)
   Small Hash = ziplist (compact array, cache-friendly for <128 entries)
   Small List = listpack (ultra-compact sequential storage)
   Small Set = intset (sorted integer array for pure-number sets)
   Large data → transitions to hash table / skip list / linked list

SKIP LIST (how Sorted Sets work):
  Level 3:  HEAD ─────────────────────────► 50 ──────────────► NIL
  Level 2:  HEAD ──────────► 20 ──────────► 50 ──────────────► NIL
  Level 1:  HEAD ─► 10 ─► 20 ─► 30 ─► 40 ─► 50 ─► 60 ─► 70 ─► NIL
  
  Insert/Search: start at top level, skip forward until overshoot, drop down a level
  Average O(log n) — probabilistic (levels assigned randomly, like a coin flip)
  Simpler to implement than balanced trees, comparable performance.
```

### Real-World Cache Architecture — How Twitter Caches Timelines

```
TWITTER'S TIMELINE CACHE (simplified):

  User opens app → GET /home_timeline
  
  1. Check Redis: ZREVRANGE timeline:user_42 0 19  (latest 20 tweet IDs)
  2. If HIT: fetch tweet content by IDs (also cached in Redis)
  3. If MISS: fan-out service rebuilds timeline from follows
  
  WRITE PATH (when someone tweets):
    Tweeter has 1000 followers
    For each follower: ZADD timeline:follower_id <timestamp> <tweet_id>
    This is "fan-out on write" — timeline is PRE-BUILT in cache
    
  CACHE SIZE:
    300M active users × 1000 tweet IDs × 8 bytes = ~2.4 TB of timeline data
    Stored across thousands of Redis instances (Twitter's custom Twemproxy for sharding)
    
  CELEBRITIES (>10K followers):
    Don't fan-out on write (too expensive: 10M writes per tweet)
    Instead: fan-out on read (merge celebrity tweets into timeline at read time)
    This is the HYBRID approach — most systems design interviews expect this answer.
```

---

*After this phase: you can design a caching layer that reduces database load by 99%. You can explain cache-aside vs write-through to your team. You can solve the cache stampede problem. You know how Redis is actually fast (single-threaded event loop + skip lists + in-memory). You can describe how Twitter caches timelines. You understand that cache invalidation is hard — and you know the strategies to manage it.*
