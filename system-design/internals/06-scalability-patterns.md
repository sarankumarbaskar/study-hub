# Phase 6 — Scalability Patterns: Making Systems Handle 1000x More Load

> Scalability is not "buy a bigger server." It's applying the right pattern at the right layer to remove the specific bottleneck your system has right now.

Every system has a bottleneck. At 100 users, it might be a slow database query. At 10,000 users, it might be a single server's CPU. At 1,000,000 users, it might be the network, the database write throughput, or a hot partition in your cache. Scalability is the discipline of identifying bottlenecks and applying patterns that remove them — systematically, one at a time.

This phase covers the patterns you'll use (and be asked about in interviews) to scale systems from prototype to planet-scale.

---

## 1. Load Balancing — Distributing Traffic

### What Load Balancers Do

A load balancer sits between clients and a group of servers, distributing incoming requests across the servers. This achieves: **higher throughput** (N servers handle N× the requests), **fault tolerance** (if one server dies, traffic shifts to others), and **zero-downtime deployments** (take servers out of rotation one at a time).

### Layer 4 vs Layer 7 Load Balancing

```
LAYER 4 (Transport Layer — TCP/UDP):
  Sees: source IP, destination IP, source port, destination port
  Decides: based on IP and port only (fast, simple)
  Does NOT understand: HTTP, URLs, cookies, headers
  
  Use when: raw TCP balancing, non-HTTP protocols, maximum performance
  Examples: AWS NLB, HAProxy in TCP mode, Linux IPVS

LAYER 7 (Application Layer — HTTP/gRPC):
  Sees: full HTTP request (URL, headers, cookies, body)
  Decides: based on URL path, headers, cookies, content type
  Can do: /api/users → UserService cluster, /api/orders → OrderService cluster
          Route by cookie (session affinity), A/B testing by header
  
  Use when: HTTP routing, content-based routing, SSL termination
  Examples: AWS ALB, Nginx, Envoy, HAProxy in HTTP mode, Traefik
```

### Load Balancing Algorithms

```
ALGORITHM              HOW IT WORKS                    WHEN TO USE
──────────────────────────────────────────────────────────────────────
Round Robin            Request 1→S1, 2→S2, 3→S3,      Default, servers are identical
                       4→S1, 5→S2, ...

Weighted Round Robin   S1 gets 3x requests of S2       Servers have different capacity
                       (S1 has more CPU/RAM)

Least Connections      Send to server with fewest       Requests have varying duration
                       active connections                (some slow, some fast)

IP Hash                hash(client_IP) % N → server    Session affinity without cookies
                       Same client always → same server (gaming, WebSocket)

Consistent Hashing     Hash ring with virtual nodes     Cache servers, stateful services
                       Minimizes redistribution         (covered in detail below)
                       when servers added/removed

Random                 Random server selection          Simple, surprisingly effective
                       with load feedback               for large server counts

HEALTH CHECKS:
  Active: LB periodically sends requests to each server (/health endpoint)
    If 3 consecutive failures → mark as unhealthy → stop sending traffic
    If health check succeeds → mark as healthy → resume traffic
    
  Passive: LB monitors actual traffic responses
    5xx responses → increment failure count → eventually mark unhealthy
    
  ALWAYS configure health checks. Without them, the LB sends traffic to dead servers.
```

---

## 2. Horizontal vs Vertical Scaling

```
VERTICAL SCALING (Scale Up):
  Get a BIGGER machine: more CPU, more RAM, more disk
  
  Current: 4 CPU, 16GB RAM → Upgrade to: 32 CPU, 128GB RAM
  
  Pros: simple (no code changes), no distribution complexity
  Cons: physical limits (can't buy a 10,000 CPU machine), single point of failure,
        expensive (2x CPU ≠ 2x price, it's 4x price), downtime for upgrade
  
  Limit: AWS largest instance r6i.metal = 128 vCPU, 1TB RAM (~$30/hour)
  After that, you MUST scale horizontally.

HORIZONTAL SCALING (Scale Out):
  Add MORE machines, distribute the load
  
  Current: 1 server → Scale to: 10 servers behind a load balancer
  
  Pros: virtually unlimited scaling, no single point of failure, commodity hardware
  Cons: distributed systems complexity (data consistency, service discovery,
        network overhead, debugging difficulty)

THE SCALING PLAYBOOK (in order):
  1. Optimize code and queries      → 10x improvement, $0 cost
  2. Add caching (Redis)            → 10-100x for read-heavy workloads
  3. Vertical scaling               → 2-4x, simple
  4. Read replicas (database)       → 5x read capacity
  5. Horizontal scaling (app tier)  → N× capacity with load balancer
  6. Database sharding              → unlimited writes (but complex)
  7. CDN                            → global latency reduction

  MOST SYSTEMS NEVER NEED STEP 6.
  Steps 1-5 can handle millions of users for most applications.
```

---

## 3. Rate Limiting — Protecting Your System

### Why Rate Limiting Exists

Rate limiting protects your system from: **abuse** (attacker sends 1M requests/sec), **bugs** (client in a retry loop), **fair usage** (one user consuming all capacity), and **cost control** (each request costs money if you're on serverless/cloud).

### Rate Limiting Algorithms

```
1. TOKEN BUCKET:
   A bucket holds tokens. Each request consumes a token.
   Tokens are added at a fixed rate (e.g., 10 tokens/second).
   If bucket is empty → request rejected (429 Too Many Requests).
   
   Bucket capacity: 100 tokens (max burst)
   Refill rate: 10 tokens/second (sustained rate)
   
   t=0:  bucket=100. User sends 50 requests → bucket=50 (all allowed)
   t=1:  10 tokens added → bucket=60
   t=1:  User sends 70 requests → 60 allowed, 10 rejected → bucket=0
   t=2:  10 tokens added → bucket=10
   
   Pros: allows bursts (up to bucket capacity), smooth rate limiting
   Cons: need to track bucket state per user
   Used by: AWS API Gateway, Stripe, most production systems

2. SLIDING WINDOW:
   Count requests in the last N seconds (sliding time window).
   If count ≥ limit → reject.
   
   Window: 60 seconds, limit: 100 requests
   
   t=30: user has made 80 requests in last 60s → 20 remaining
   t=50: user has made 95 requests in last 60s → 5 remaining
   t=60: old requests from t=0-t=1 fall out of window → count decreases
   
   Pros: accurate, fair, no burst issue
   Cons: memory (must store timestamp of each request per user)

3. FIXED WINDOW:
   Count requests per fixed time window (e.g., per minute).
   Reset at the boundary. If count ≥ limit → reject.
   
   Minute 1 (00:00-00:59): user makes 90/100 requests
   Minute 2 (01:00-01:59): counter resets → user can make 100 more
   
   Problem: at 00:59 user makes 100, at 01:00 makes 100 → 200 in 2 seconds!
   This is the "boundary burst" problem.
   
   Pros: simple, low memory (one counter per window per user)
   Cons: boundary burst allows 2x rate at window edges

IMPLEMENTATION WITH REDIS:
  -- Token bucket (simplified):
  local tokens = redis.call('GET', key)
  if tokens == nil then tokens = bucket_capacity end
  if tonumber(tokens) > 0 then
    redis.call('DECR', key)
    return 1  -- allowed
  else
    return 0  -- rejected
  end
  -- Refill via separate scheduled task or computed on access

WHERE TO RATE LIMIT:
  API Gateway:    first line of defense, before request reaches your services
  Application:    per-user, per-endpoint, business-specific rules
  Database:        connection pool limits (pool size IS a rate limit)
  Infrastructure: cloud provider limits (AWS API throttling)
```

---

## 4. Consistent Hashing — Distributing Data Evenly

### The Problem with Simple Hashing

```
You have 4 cache servers. You hash keys to distribute them:
  server = hash(key) % 4
  
  key="user:42"  → hash=98234  → 98234 % 4 = 2 → Server 2
  key="user:43"  → hash=41253  → 41253 % 4 = 1 → Server 1
  key="user:44"  → hash=67891  → 67891 % 4 = 3 → Server 3

NOW ADD A SERVER (4 → 5):
  key="user:42"  → hash=98234  → 98234 % 5 = 4 → Server 4 (MOVED!)
  key="user:43"  → hash=41253  → 41253 % 5 = 3 → Server 3 (MOVED!)
  key="user:44"  → hash=67891  → 67891 % 5 = 1 → Server 1 (MOVED!)

  ~80% of keys map to DIFFERENT servers!
  All those cache entries = MISS → thundering herd on the database!
```

### Consistent Hashing — The Solution

```
Arrange servers on a RING (0 to 2^32):

         0
        / \
    S3 /   \ S1
      |     |
      |     |
    S4 \   / S2
        \ /
        2^32

Each KEY hashes to a position on the ring.
Walk CLOCKWISE to find the first server → that's where the key lives.

key "user:42" → position 12345 → walk clockwise → hit S1 → stored on S1
key "user:43" → position 89000 → walk clockwise → hit S3 → stored on S3

ADD A NEW SERVER S5 (between S1 and S2):

  Before: keys in range (S1, S2) were on S2
  After:  keys in range (S1, S5) move to S5
          keys in range (S5, S2) stay on S2
          ALL OTHER keys are UNAFFECTED

  Only ~1/N of keys move when adding a server (vs ~(N-1)/N with modulo)!

VIRTUAL NODES:
  Problem: with few servers, distribution is uneven (some servers get more keys)
  Solution: each physical server maps to MULTIPLE positions on the ring (virtual nodes)
  
  Server 1 → positions: 1000, 25000, 48000, 72000 (4 virtual nodes)
  Server 2 → positions: 12000, 38000, 55000, 85000 (4 virtual nodes)
  
  More virtual nodes = more even distribution (typical: 100-200 per server)
  When S1 is removed: its keys spread to S2, S3, S4 proportionally

USED BY: DynamoDB, Cassandra, Memcached clients, CDN routing, Discord
```

---

## 5. Monitoring and Observability — The Three Pillars

### You Can't Fix What You Can't See

In a distributed system, problems are invisible without proper observability. A request that takes 5 seconds might be spending 4 seconds in a database on a different server. A memory leak in one service might cause cascading failures across 10 services. Without observability, you're debugging blind.

```
THE THREE PILLARS:

1. METRICS (numbers over time):
   What: CPU usage, memory, request rate, error rate, latency percentiles
   Tools: Prometheus (collection) + Grafana (visualization)
   Format: time-series data (metric_name{labels} value timestamp)
   
   Key metrics for every service:
     Rate:     requests/second (throughput)
     Errors:   error rate (5xx / total)
     Duration: latency p50, p95, p99 (percentiles, not averages!)
   
   WHY P99 NOT AVERAGE:
     Average latency: 50ms (looks fine!)
     P99 latency: 5000ms (1% of users wait 5 seconds — that's 10,000 users/day!)
     Averages HIDE tail latency. Always monitor percentiles.

2. LOGS (detailed event records):
   What: structured log entries with timestamp, level, message, context
   Tools: ELK stack (Elasticsearch + Logstash + Kibana), Grafana Loki
   Format: structured JSON (not plain text!)
   
   BAD:  logger.info("Processing order")
   GOOD: logger.info("Processing order", Map.of("orderId", orderId, "userId", userId, "amount", amount))
   
   With structured logs + correlation IDs:
     Search: "show me all logs for traceId=abc-123 across all services"
     → complete request flow visible in one query

3. TRACES (request flow across services):
   What: end-to-end request path with timing per service (covered in Phase 5)
   Tools: Jaeger, Zipkin, AWS X-Ray, Datadog APM
   
   Answers: "Why was this request slow? Which service? Which operation?"

SLI / SLO / SLA:
  SLI (Service Level Indicator): the metric you measure
    Example: "percentage of requests completed in <200ms"
  
  SLO (Service Level Objective): your internal target
    Example: "99.9% of requests complete in <200ms" (error budget: 0.1%)
  
  SLA (Service Level Agreement): contractual promise to customers
    Example: "99.95% uptime or we refund you" (more conservative than SLO)
  
  "Error budget": if SLO is 99.9%, you have 0.1% budget for failures
    43.2 minutes of downtime per month. Spend it wisely (deploys, experiments).
    If budget exhausted: freeze features, focus on reliability.
```

---

## 6. Disaster Recovery — Surviving Failures

```
TYPES OF FAILURES:
  Single server crash:    handled by load balancer + health checks
  Availability zone down: handled by multi-AZ deployment
  Entire region down:     handled by multi-region deployment (expensive!)
  Data corruption:        handled by backups + point-in-time recovery
  Human error:            handled by infrastructure-as-code + rollback

RECOVERY OBJECTIVES:
  RPO (Recovery Point Objective): how much DATA can you lose?
    RPO = 0: no data loss (synchronous replication)
    RPO = 1 hour: can lose up to 1 hour of data (hourly backups)
    RPO = 24 hours: can lose a day (daily backups)
  
  RTO (Recovery Time Objective): how long until service is RESTORED?
    RTO = 0: instant failover (active-active)
    RTO = 5 minutes: automated failover (active-passive with health checks)
    RTO = 1 hour: manual intervention needed

DEPLOYMENT STRATEGIES:

  ACTIVE-PASSIVE:
    Region A (active): serves all traffic
    Region B (passive): standby, receives replicated data
    Failover: DNS switch from A to B (RTO: minutes)
    Cost: 2× infrastructure (passive region mostly idle)
  
  ACTIVE-ACTIVE:
    Region A: serves users in Americas
    Region B: serves users in Europe/Asia
    Both regions accept writes → need conflict resolution
    Failover: automatic (traffic shifts to surviving region)
    RTO: near-zero (users already distributed)
    Cost: 2× but fully utilized (no idle resources)

CHAOS ENGINEERING:
  "Don't wait for failures — CREATE them intentionally."
  Netflix Chaos Monkey: randomly kills production servers
  Purpose: verify that your system handles failures gracefully
  
  Start simple:
    1. Kill one server → does the LB route around it?
    2. Slow down one database → does the circuit breaker trip?
    3. Block network between services → do timeouts and retries work?
    4. Fill disk space → does the service degrade gracefully?
```

---

## 7. Scalability Best Practices Summary

```
ARCHITECTURE:
  ✓ Stateless application servers (any server can handle any request)
  ✓ Store state externally (Redis for sessions, DB for data)
  ✓ Horizontal scaling for app tier (behind load balancer)
  ✓ Read replicas for database read scaling
  ✓ CDN for static content and global latency

PERFORMANCE:
  ✓ Cache aggressively (Redis, CDN, browser cache)
  ✓ Use async processing for non-critical paths
  ✓ Batch database operations (reduce round-trips)
  ✓ Use connection pooling everywhere
  ✓ Compress responses (gzip/brotli)

RELIABILITY:
  ✓ Health checks on every service and dependency
  ✓ Circuit breakers on all external calls
  ✓ Timeouts on all network calls (never wait forever)
  ✓ Graceful degradation (serve cached data when services are down)
  ✓ Automated failover (don't rely on humans for 3 AM incidents)

MONITORING:
  ✓ Metrics: rate, errors, duration (RED method)
  ✓ Logs: structured, searchable, with correlation IDs
  ✓ Traces: end-to-end request visibility
  ✓ Alerting: on SLO violations, not on individual metric thresholds
  ✓ Dashboards: one dashboard per service + one overview dashboard
```

---

---

## 7. Bloom Filters — Probabilistic Membership Testing

```
PROBLEM: "Is this username taken?" across 1 billion usernames
  HashSet: stores all 1B strings → ~50GB RAM (expensive!)
  Database query: disk I/O every time → slow
  
BLOOM FILTER: can answer "definitely NOT in set" or "PROBABLY in set"
  Uses: a bit array + multiple hash functions
  Size: ~1.2 GB for 1 billion items at 1% false positive rate
  Lookup: O(1), no disk I/O, fits in memory
  
HOW IT WORKS:
  Insert "alice":
    hash1("alice") = 5    → set bit 5
    hash2("alice") = 23   → set bit 23
    hash3("alice") = 7    → set bit 7
  
  Check "bob":
    hash1("bob") = 5   → bit 5 set? YES
    hash2("bob") = 12  → bit 12 set? NO → "bob" is DEFINITELY NOT in the set
  
  Check "charlie":
    hash1("charlie") = 5    → YES
    hash2("charlie") = 23   → YES
    hash3("charlie") = 7    → YES
    → "charlie" MIGHT be in the set (could be a false positive)
    → verify with actual database lookup

FALSE POSITIVES: "says yes but actually no" (~1% with proper sizing)
FALSE NEGATIVES: NEVER (if it says "no", it's guaranteed "no")

USED BY:
  Google Chrome: "is this URL in the malware list?" (avoid network lookup for safe URLs)
  Cassandra: "does this SSTable contain this key?" (avoid reading SSTables that don't have the key)
  Medium: "has this user seen this article?" (avoid showing duplicates)
  CDN: "is this URL cached?" (avoid checking storage for uncached content)
  Spell checkers, email spam filters, database query optimization
```

---

## 8. Leader Election — Coordinating Distributed Systems

```
PROBLEM: who processes the scheduled jobs? Who's the active in active-passive?
  You have 3 instances of a service. Only ONE should run the cron job.
  If all 3 run it: duplicate emails sent, duplicate charges, duplicate data.
  If none runs it: nothing happens, customers wait forever.
  
SOLUTION: LEADER ELECTION — agree on exactly one leader

APPROACH 1: Database-based (simple but coarse)
  INSERT INTO leaders (name, instance_id, expires_at)
  VALUES ('scheduler', 'instance-1', NOW() + INTERVAL 30 SECOND)
  ON CONFLICT (name) DO NOTHING;
  
  If INSERT succeeds: you're the leader (until expires_at)
  If INSERT fails: someone else is the leader
  Leader renews before expiry. If leader crashes: lock expires → someone else wins.

APPROACH 2: ZooKeeper/etcd (purpose-built for this)
  Ephemeral node: /election/leader → instance-1
  If instance-1 crashes: ephemeral node disappears automatically
  ZooKeeper notifies watchers → new election → instance-2 becomes leader
  
  Used by: Kafka (partition leader), HBase (region master), Hadoop (NameNode HA)

APPROACH 3: Raft consensus (built into etcd, CockroachDB)
  Nodes vote for a leader. Leader must get majority vote.
  Leader sends heartbeats. If heartbeats stop: new election.
  Guarantees: at most ONE leader at any time (even during network partitions)

IN INTERVIEWS: "For leader election, we'd use etcd (or ZooKeeper) with ephemeral nodes.
  The leader acquires a lock with a TTL, renews it periodically.
  If the leader crashes, the TTL expires and another instance acquires the lock."
```

---

## 9. Distributed Locks — Mutual Exclusion Across Machines

```
PROBLEM: two servers process the same payment simultaneously → double charge!
  In a single process: synchronized/mutex prevents this
  Across multiple servers: you need a DISTRIBUTED lock

REDIS-BASED LOCK (Redlock):
  ACQUIRE: SET lock:payment:42 <unique_id> NX EX 30
    NX = only if not exists (atomic check-and-set)
    EX 30 = expires in 30 seconds (prevents deadlock if holder crashes)
    unique_id = UUID to identify the lock holder
    
  RELEASE: only if YOU hold it (Lua script for atomicity):
    if redis.call("get", key) == unique_id then
      redis.call("del", key)
    end
  
  RENEWAL: extend TTL periodically while still processing
    (if processing takes longer than 30 seconds → lock expires → another process enters!)
    FIX: Redisson's watchdog auto-renews every TTL/3

DANGER — WHY DISTRIBUTED LOCKS ARE HARD:
  1. Lock expires while holder is still processing (GC pause, slow I/O)
     → two processes think they hold the lock simultaneously
  2. Clock skew between Redis nodes → different expiry times
  3. Redis master crashes after lock is SET but before replication → lock lost
  
  Martin Kleppmann's analysis: Redis-based distributed locks
  are NOT safe for correctness-critical use cases.
  Use fencing tokens (monotonic sequence number) for additional safety.

WHEN TO USE DISTRIBUTED LOCKS:
  ✓ Preventing duplicate processing (payment, order creation)
  ✓ Exclusive resource access (file writing, report generation)
  ✓ Leader election (simplified version)
  ✗ Don't use for performance optimization (adds latency, complexity)
  ✗ Don't hold locks for long periods (risk of expiry during processing)
```

---

## 10. Geospatial Indexing — Finding Nearby Things

```
PROBLEM: "Find all restaurants within 5km of my location"
  Naive approach: scan ALL restaurants, calculate distance to each → O(n)
  With 10M restaurants: too slow

SOLUTION 1: GEOHASH
  Encode (latitude, longitude) into a string:
  (37.7749, -122.4194) → "9q8yyk8" (7 characters ≈ 150m × 150m)
  
  Nearby locations share the same GEOHASH PREFIX:
  "9q8yyk" → all points in the same ~150m grid cell
  "9q8yy"  → all points in the same ~600m grid cell
  "9q8y"   → all points in the same ~5km grid cell
  
  To find nearby: search for all entries with the same prefix
  Store in database: WHERE geohash LIKE '9q8yy%' → uses B-tree index
  
  Used by: Redis GEO commands, Elasticsearch, DynamoDB

SOLUTION 2: QUADTREE
  Recursively divide 2D space into 4 quadrants
  Continue subdividing until each cell has ≤ N points
  
  To find nearby: find the cell containing the query point
  Expand to neighboring cells → collect candidates → filter by exact distance
  
  Used by: Uber (H3 hexagonal grid, similar concept)

IN INTERVIEWS (Uber, Yelp, Tinder):
  "We'd use geohash-based indexing. Store driver locations in Redis GEO:
   GEOADD drivers <lng> <lat> <driver_id>
   GEORADIUS drivers <lng> <lat> 5 km COUNT 20 ASC
   This returns the 20 nearest drivers within 5km, sorted by distance, in O(log n)."
```

---

*After this phase: you can design systems that scale to millions of users. You can choose the right load balancing algorithm, implement rate limiting, and use consistent hashing for distributed caches. You understand Bloom filters for membership testing, leader election for coordination, distributed locks for mutual exclusion, and geospatial indexing for location queries. You can plan disaster recovery with clear RPO/RTO objectives and build observable systems with the three pillars.*
