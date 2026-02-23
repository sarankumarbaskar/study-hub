# Phase 2 — Databases: Where Your Data Lives and Why It Matters

> The database is almost always the bottleneck. Understanding how databases store, index, replicate, and partition data is the single most impactful system design skill.

Every system design question eventually comes down to: "Where do you store the data, and how do you access it at scale?" Choosing between SQL and NoSQL, designing the right index, deciding when to shard, and understanding replication trade-offs — these decisions determine whether your system handles 100 queries per second or 100,000. This phase gives you the deep understanding to make those decisions from first principles.

---

## 1. SQL Databases — How They Actually Work

### Why Relational Databases Dominate

Relational databases (PostgreSQL, MySQL, Oracle) have dominated data storage for 40+ years because they provide something no other storage system matches: **ACID transactions** (Atomicity, Consistency, Isolation, Durability) with a **declarative query language** (SQL). You describe WHAT data you want, and the database figures out HOW to get it efficiently. You wrap multiple operations in a transaction, and the database guarantees all-or-nothing execution even during crashes and concurrent access.

This is why most applications start with a relational database — and why many stay there forever. Unless you have a specific reason to choose NoSQL (extreme write throughput, schema flexibility, graph traversals), a well-tuned PostgreSQL or MySQL instance can handle far more than most developers think.

### How Data Is Stored — Pages and B-Trees

```
FUNDAMENTAL UNIT: PAGE (typically 8KB in PostgreSQL, 16KB in MySQL InnoDB)
  The database reads and writes data in PAGES, not individual rows.
  Even if you need one row, the entire page (8-16KB) is loaded into memory.
  This is because disk I/O is done in blocks, and pages align with disk blocks.

TABLE STORAGE (Heap):
  Rows are stored in pages, roughly in insertion order.
  Each page holds multiple rows (depends on row size).
  
  Page 1: [Row 1][Row 2][Row 3][Row 4]...[free space]
  Page 2: [Row 5][Row 6][Row 7]...[free space]
  Page 3: [Row 8][Row 9]...[free space]

  To find a specific row WITHOUT an index:
    FULL TABLE SCAN — read EVERY page, check every row
    1 million rows × 100 bytes/row = 100MB of data to scan
    At 500MB/s sequential disk read: ~200ms
    This is why SELECT without WHERE on a large table is slow.

INDEX STORAGE (B-Tree):
  An index is a separate data structure that maps column values to row locations.
  Almost all databases use B-TREES for indexes.

  B-Tree for column 'email' (simplified):
                    [M]
                   /    \
              [D, H]    [P, T]
             / | \     / | \
  [A,B,C] [D,E,F] [H,I,J] [M,N,O] [P,Q,R] [T,U,V]
  
  Each leaf node contains: (email_value → page_id, row_offset)
  
  To find email = 'N':
    Root: N > M → go right
    Branch: N >= P? No, N < P → go left
    Leaf: scan [M, N, O] → found N → pointer to page 15, row 3
    Read page 15, get row 3 → done

  DEPTH: B-trees are wide and shallow
    1 million rows: ~3 levels deep
    1 billion rows: ~4 levels deep
    Each level = 1 page read = 1 disk I/O
    Index lookup: 3-4 random disk reads vs scanning millions of rows
    With buffer pool caching: upper levels cached in memory → 1-2 actual reads
```

### B-Tree vs LSM-Tree — Two Philosophies

```
B-TREE (PostgreSQL, MySQL InnoDB, Oracle):
  Philosophy: "Optimize for READS — keep data sorted on disk"
  Write: find the right page, modify it IN PLACE, write it back
  Read: traverse tree (3-4 I/Os), find the data
  
  Pros: fast reads, fast range queries, mature, battle-tested
  Cons: random writes (updating pages in place), write amplification
  
  Best for: read-heavy workloads, transactional systems, OLTP
  Used by: most traditional databases

LSM-TREE (Cassandra, RocksDB, LevelDB, HBase):
  Philosophy: "Optimize for WRITES — buffer in memory, flush sequentially"
  Write: append to in-memory buffer (memtable) → O(1)!
         When full, flush to disk as sorted file (SSTable)
  Read: check memtable → check SSTables (merge results)
  
  Pros: incredibly fast writes (sequential I/O only), high write throughput
  Cons: slower reads (must check multiple SSTables), space amplification
        compaction overhead (background merging of SSTables)
  
  Best for: write-heavy workloads, time-series data, event logs
  Used by: Cassandra, RocksDB, LevelDB, Google Bigtable

Decision:
  Write-heavy (logging, metrics, events)  → LSM-Tree (Cassandra, ScyllaDB)
  Read-heavy (web apps, APIs, reports)    → B-Tree (PostgreSQL, MySQL)
  Balanced                                → B-Tree (still the default choice)
```

### Indexing — The #1 Performance Tool

```
WHY INDEXES MATTER:
  Without index: SELECT * FROM users WHERE email = 'alice@example.com'
    → full table scan: read ALL rows, check each one
    → 1M rows: ~200ms

  With index on email: same query
    → B-tree lookup: 3-4 page reads
    → 1M rows: ~0.5ms (400x faster!)

TYPES OF INDEXES:

1. PRIMARY INDEX (clustered):
   Rows are physically SORTED by this index on disk
   Only ONE per table (the primary key)
   Range queries on PK are very fast (consecutive pages)
   
   InnoDB: rows stored IN the B-tree leaves (clustered index IS the table)
   PostgreSQL: separate heap + B-tree index

2. SECONDARY INDEX:
   Separate B-tree that points to the primary key (InnoDB) or row location (PG)
   Can have MANY per table
   Each adds overhead to writes (must update every index on INSERT/UPDATE)

3. COMPOSITE INDEX:
   Index on multiple columns: CREATE INDEX idx ON orders(user_id, created_at)
   Leftmost prefix rule: this index supports:
     WHERE user_id = 42                     ✓ (uses first column)
     WHERE user_id = 42 AND created_at > X  ✓ (uses both columns)
     WHERE created_at > X                   ✗ (can't skip first column!)

4. COVERING INDEX:
   Index contains ALL columns needed for the query
   The database never reads the actual table row — answers from the index alone
   CREATE INDEX idx ON orders(user_id, created_at) INCLUDE (total, status)
   → "index-only scan" — fastest possible query

5. PARTIAL INDEX (PostgreSQL):
   Index only a SUBSET of rows
   CREATE INDEX idx ON orders(created_at) WHERE status = 'PENDING'
   → smaller index, faster lookups for common queries on pending orders

HOW TO USE EXPLAIN:
  EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';
  
  Look for:
    Seq Scan          → no index used (BAD for large tables)
    Index Scan        → index used, then fetched row from table
    Index Only Scan   → answered entirely from index (BEST)
    Bitmap Index Scan → index used to find matching pages, then scan pages
    Nested Loop       → for each row in outer, scan inner (OK for small inner)
    Hash Join         → build hash table from one side, probe with other (good for large joins)
    Merge Join        → both sides sorted, merge (good for sorted data)
```

### Query Optimization — Why Queries Are Slow

```
THE QUERY OPTIMIZER:
  When you write SQL, you describe WHAT you want.
  The optimizer decides HOW to get it (which indexes, which join order, which algorithm).
  It uses STATISTICS (row counts, value distributions, index selectivity) to estimate costs.

COMMON REASONS QUERIES ARE SLOW:

1. MISSING INDEX
   SELECT * FROM orders WHERE customer_id = 42;
   If no index on customer_id → full table scan
   FIX: CREATE INDEX idx_orders_customer ON orders(customer_id);

2. INDEX NOT USED (common traps):
   WHERE LOWER(email) = 'alice@example.com'  → function on column prevents index use
   FIX: CREATE INDEX idx ON users(LOWER(email))  — functional index
   
   WHERE age + 1 = 30                        → expression prevents index use
   FIX: WHERE age = 29                       — restructure to bare column
   
   WHERE name LIKE '%alice%'                 → leading wildcard can't use index
   FIX: full-text search index, or LIKE 'alice%' (trailing wildcard is OK)

3. N+1 QUERIES (from ORM lazy loading):
   for order in orders:
       items = query("SELECT * FROM items WHERE order_id = ?", order.id)
   → 1 + N queries instead of 1 JOIN query
   FIX: JOIN or batch fetch (see JDBC phase)

4. SELECTING TOO MANY COLUMNS:
   SELECT * FROM users WHERE id = 42
   → reads ALL columns even if you need only name and email
   → prevents index-only scan
   FIX: SELECT name, email FROM users WHERE id = 42

5. POOR JOIN ORDER:
   The optimizer usually gets this right, but with many tables or complex
   queries, it can choose a suboptimal plan.
   FIX: EXPLAIN ANALYZE, check join order, add hints if needed
```

---

## 2. NoSQL Databases — When Relational Isn't Enough

### Why NoSQL Exists

Relational databases are excellent, but they have fundamental limitations at extreme scale:
- **Schema rigidity:** every row in a table has the same columns. Schema changes on billion-row tables can take hours.
- **Join scalability:** JOINs across sharded tables are expensive or impossible.
- **Write throughput:** a single-master architecture limits write scalability.
- **Data model mismatch:** some data (graphs, time-series, documents) doesn't fit neatly into tables.

NoSQL databases sacrifice some of SQL's guarantees (ACID transactions, JOINs, schema enforcement) to gain: horizontal scalability, schema flexibility, specialized data models, and extreme performance for specific access patterns.

### The Four Categories

```
CATEGORY        EXAMPLES              DATA MODEL           BEST FOR
─────────────────────────────────────────────────────────────────────
Key-Value       Redis, DynamoDB,      key → value          Caching, sessions, simple lookups
                Memcached                                  O(1) get/put, highest throughput

Document        MongoDB, Couchbase,   key → JSON document  Content management, user profiles,
                Firestore                                  product catalogs, flexible schemas

Column-Family   Cassandra, HBase,     row key → columns    Time-series, IoT, event logging,
                ScyllaDB              (sparse, wide)       write-heavy analytics

Graph           Neo4j, Amazon         nodes + edges +      Social networks, recommendations,
                Neptune, JanusGraph   properties           fraud detection, knowledge graphs
```

### Key-Value Stores — When You Know Your Access Pattern

```
WHAT IT IS:
  The simplest possible database: put(key, value), get(key), delete(key)
  Like a giant HashMap, but distributed and persistent

REDIS:
  In-memory key-value store with optional persistence
  Data structures: strings, lists, sets, sorted sets, hashes, streams
  Use cases:
    Caching: cache database query results, API responses
    Sessions: store user session data (fast, expirable)
    Rate limiting: INCR + EXPIRE for sliding window counters
    Leaderboards: sorted sets for ranking
    Pub/Sub: real-time messaging between services
    Distributed locks: SETNX with TTL for mutual exclusion
  
  Limitations: data must fit in memory, limited query capabilities

DYNAMODB (AWS):
  Managed, serverless key-value + document store
  Partition key → hash-based distribution across nodes
  Sort key → range queries within a partition
  
  Example table design:
    PK: USER#42           SK: PROFILE         → user profile data
    PK: USER#42           SK: ORDER#2024-001  → user's order
    PK: USER#42           SK: ORDER#2024-002  → user's another order
    PK: ORDER#2024-001    SK: ITEM#1          → order item
    
  This "single table design" avoids JOINs by co-locating related data
  All data for USER#42 can be fetched in ONE query (Query on PK)
```

### Document Stores — Flexible Schemas

```
WHAT IT IS:
  Each record is a JSON/BSON document with any structure
  No fixed schema — documents in the same collection can have different fields
  Documents can be nested (embedded sub-documents and arrays)

MONGODB:
  {
    "_id": ObjectId("64a7c..."),
    "name": "Alice",
    "email": "alice@example.com",
    "address": {
      "street": "123 Main St",
      "city": "Springfield"
    },
    "orders": [
      { "id": "ORD-001", "total": 99.99, "items": [...] },
      { "id": "ORD-002", "total": 149.50, "items": [...] }
    ]
  }

  ADVANTAGES:
    Flexible schema: add fields without ALTER TABLE
    Embedded data: related data in one document (no JOINs needed)
    Developer-friendly: JSON maps naturally to application objects
    Horizontal scaling: built-in sharding
    
  DISADVANTAGES:
    No JOINs (must denormalize or use $lookup which is slow)
    No multi-document ACID (added in MongoDB 4.0, but with overhead)
    Data duplication (denormalization = same data in multiple places)
    Schema enforcement is your responsibility (no constraints)

WHEN TO USE:
  ✓ Rapidly evolving schema (startup, MVP, prototyping)
  ✓ Content management (articles, products — each unique)
  ✓ User profiles (each user has different preferences)
  ✓ Event logging (each event type has different fields)
  ✗ Financial transactions (need strong ACID)
  ✗ Highly relational data (many-to-many relationships)
  ✗ Complex reporting with JOINs
```

### Column-Family Stores — Write-Optimized at Scale

```
CASSANDRA:
  Designed for: massive write throughput, global distribution, no single point of failure
  Used by: Apple (400K+ nodes), Netflix, Discord, Instagram
  
  Data model: rows with flexible columns, grouped by partition key
    Partition key determines WHICH NODE stores the data
    Clustering columns determine ORDER within a partition
  
  Example: time-series sensor data
    Partition key: sensor_id
    Clustering key: timestamp (descending)
    
    sensor_001 | 2024-01-01 12:00:00 | temp=22.5 | humidity=45
    sensor_001 | 2024-01-01 11:59:00 | temp=22.3 | humidity=46
    sensor_001 | 2024-01-01 11:58:00 | temp=22.1 | humidity=44
    
    Query: SELECT * FROM readings WHERE sensor_id = 'sensor_001'
           AND timestamp > '2024-01-01 11:00:00'
    → reads ONE partition, data sorted by time → extremely fast
  
  ADVANTAGES:
    Linear scalability (add nodes → throughput increases linearly)
    No single point of failure (masterless — any node can serve any request)
    Tunable consistency (ONE, QUORUM, ALL per query)
    Optimized for writes (LSM-tree storage engine)
    
  DISADVANTAGES:
    No JOINs, no subqueries, very limited WHERE clauses
    Must design tables around your query patterns (denormalize aggressively)
    Eventual consistency by default (can be tuned)
    Complex operational model (compaction, repair, tombstones)
```

---

## 3. Sharding — Scaling Beyond One Machine

### Why Sharding Exists

A single database server has limits: CPU cores, RAM, disk I/O, and network bandwidth. When your data or traffic exceeds what one machine can handle, you must split the data across multiple machines. This is **sharding** (also called **partitioning**).

```
BEFORE SHARDING (single node):
  All data on one server: 1TB data, 10K QPS, 1 master
  Problem: disk is full, CPU is maxed, queries are slow

AFTER SHARDING (4 shards):
  Shard 1: users A-F    (250GB, 2.5K QPS)
  Shard 2: users G-L    (250GB, 2.5K QPS)
  Shard 3: users M-R    (250GB, 2.5K QPS)
  Shard 4: users S-Z    (250GB, 2.5K QPS)
  
  Each shard is a separate database instance on its own hardware.
  Total capacity: 4x storage, 4x throughput
```

### Sharding Strategies

```
1. HASH-BASED SHARDING:
   shard_id = hash(user_id) % num_shards
   
   Pros: even data distribution, simple
   Cons: adding a shard changes EVERY key's shard → massive data migration
         range queries across shards are expensive
   
   Example: user_id=42, 4 shards → hash(42) % 4 = 2 → shard 2
            Adding shard 5: hash(42) % 5 = 2 → still shard 2 (lucky)
            But hash(43) % 4 = 3, hash(43) % 5 = 3... many keys DO move

2. RANGE-BASED SHARDING:
   Shard by value ranges: users 1-1M → shard 1, 1M-2M → shard 2
   
   Pros: range queries are efficient (scan one shard)
   Cons: hot spots (new users all go to the last shard)
         uneven distribution (some ranges may have more data)
   
   Good for: time-series data (shard by month/year)
   Bad for: user IDs (latest users cluster on one shard)

3. CONSISTENT HASHING:
   Distribute keys around a virtual ring with virtual nodes
   Adding/removing a shard only moves ~1/N of the data (not all of it!)
   
   Used by: DynamoDB, Cassandra, most distributed caches
   Details in Phase 6 (Scalability Patterns)

4. DIRECTORY-BASED SHARDING:
   A lookup table maps each key to its shard
   Most flexible but adds a single point of failure (the directory)
```

### The Pain Points of Sharding

```
CROSS-SHARD QUERIES:
  "Show me all orders across all users" → query EVERY shard, merge results
  This is slow, expensive, and complex. Design your shard key to avoid it.

CROSS-SHARD TRANSACTIONS:
  "Transfer $100 from user A (shard 1) to user B (shard 3)"
  Requires distributed transactions (2PC or saga pattern) — complex and slow.

RESHARDING (adding/removing shards):
  Hash-based: most keys move → massive data migration
  Consistent hashing: only ~1/N keys move → much better
  Still requires careful planning and execution

HOT SPOTS:
  Celebrity user gets 1M followers → their shard is overloaded
  FIX: add randomness to shard key, or use dedicated shards for hot keys

JOIN ACROSS SHARDS:
  Impossible in the traditional sense
  FIX: denormalize (store related data together), or use application-level joins
```

---

## 4. Replication — Fault Tolerance and Read Scaling

### Why Replication Exists

Replication keeps copies of data on multiple machines for two reasons: **fault tolerance** (if one machine dies, another has the data) and **read scaling** (spread read traffic across multiple copies). The fundamental challenge: when data changes on one copy, how and when do the other copies get updated?

### Replication Architectures

```
1. LEADER-FOLLOWER (Master-Slave):
   One LEADER handles all writes
   Multiple FOLLOWERS replicate from the leader (async or sync)
   Reads can go to any follower (read scaling)
   
   ┌──────────┐
   │  Leader   │◄── all writes go here
   │ (primary) │
   └────┬──┬───┘
        │  │  replication stream
   ┌────▼──┘────┐  ┌────────────┐
   │ Follower 1 │  │ Follower 2 │ ← reads can go here
   └────────────┘  └────────────┘
   
   SYNC replication: leader waits for follower ACK before confirming write
     → guaranteed no data loss, but slower writes
   ASYNC replication: leader confirms write immediately, follower catches up later
     → faster writes, but follower may have stale data (replication lag)
   
   Used by: PostgreSQL (streaming replication), MySQL (binlog replication)

2. MULTI-LEADER (Master-Master):
   Multiple nodes accept writes
   Each leader replicates to all other leaders
   
   ┌──────────┐     ┌──────────┐
   │ Leader A  │◄───►│ Leader B  │  ← both accept writes
   └──────────┘     └──────────┘
   
   PROBLEM: write conflicts (both leaders modify the same row)
   Conflict resolution: last-write-wins (data loss!), merge, custom logic
   
   Use case: multi-region deployment (one leader per region for low latency)
   Used by: MySQL Group Replication, CockroachDB, Cassandra (technically leaderless)

3. LEADERLESS (Quorum-based):
   NO designated leader. ANY node accepts reads and writes.
   Writes go to W nodes, reads from R nodes.
   If W + R > N: guaranteed to read the latest write (quorum overlap)
   
   Example: N=3 nodes, W=2, R=2
   Write to nodes 1,2 (ack when 2 confirm)
   Read from nodes 2,3 (at least one has the latest)
   
   Used by: Cassandra, DynamoDB, Riak
```

### Replication Lag — The Read Consistency Problem

```
With async replication, a follower may be SECONDS behind the leader.

Timeline:
  t=0: User writes "name=Alice" to Leader
  t=0: Leader confirms write to user
  t=1: User reads from Follower → gets OLD name (follower hasn't caught up)
  t=3: Follower receives replication update → now has "name=Alice"

This is STALE READ — the user sees their own write as not applied!

SOLUTIONS:
  1. Read-your-own-writes: route reads to LEADER for data the user just wrote
     → application tracks "which user wrote what" (session-based routing)
  
  2. Monotonic reads: always read from the SAME follower
     → prevents seeing data go "backward" across reads
  
  3. Synchronous replication: leader waits for follower to confirm
     → no stale reads, but higher write latency
  
  4. Causal consistency: track happens-before relationships
     → if write A happened before read B, B sees A
```

---

## 5. CAP Theorem — The Fundamental Trade-Off

### What CAP Actually Means

The CAP theorem states that in a distributed system experiencing a **network partition** (some nodes can't communicate), you must choose between **Consistency** (every read returns the most recent write) and **Availability** (every request gets a response, even if some nodes are down).

```
C = Consistency:    Every read gets the latest write or an error
A = Availability:   Every request gets a response (possibly stale)
P = Partition Tolerance: System works despite network failures between nodes

THE THEOREM: During a network partition, you can have C or A, not both.
  When all nodes are reachable (no partition): you get both C and A.
  When a partition occurs: you must CHOOSE.

CP SYSTEM (choose Consistency, sacrifice Availability):
  During partition: refuse requests to nodes that might have stale data
  Example: banking system — better to return an error than a wrong balance
  Technologies: ZooKeeper, HBase, MongoDB (default), PostgreSQL

AP SYSTEM (choose Availability, sacrifice Consistency):
  During partition: serve requests from any node, even with stale data
  Example: social media feed — showing a slightly old feed is better than no feed
  Technologies: Cassandra, DynamoDB, CouchDB

COMMON MISCONCEPTION:
  "CAP means you can only ever have 2 out of 3"
  WRONG. P is not a choice — partitions WILL happen in distributed systems.
  The real choice is between C and A DURING a partition.
  During normal operation, you get all three.
```

### CAP in Practice — Real-World Examples

```
SYSTEM              CAP CHOICE    WHY
──────────────────────────────────────────────────────────────────
Banking (balance)   CP            Wrong balance = money lost. Reject stale.
Shopping cart       AP            Merge carts later. Availability > consistency.
Social media feed   AP            Stale feed is fine. Unavailable feed = user leaves.
Inventory count     CP (or AP)    "Sold out" shown falsely = bad UX. But overselling = worse.
DNS                 AP            Stale DNS record is fine. No DNS = nothing works.
Leader election     CP            Must agree on ONE leader. Wrong answer = split brain.
User sessions       AP            Let user stay logged in. Reconcile later.
```

---

## 6. ACID vs BASE — Transaction Guarantees

```
ACID (traditional SQL databases):
  Atomicity:    All or nothing. Transaction either fully commits or fully rolls back.
  Consistency:  Database moves from one valid state to another. Constraints enforced.
  Isolation:    Concurrent transactions don't interfere with each other.
  Durability:   Committed data survives crashes (written to disk/WAL).
  
  Cost: lower throughput, harder to distribute, but STRONG guarantees
  Use when: money, orders, inventory — anything where correctness is critical

BASE (many NoSQL databases):
  Basically Available:  System guarantees availability (but maybe stale data)
  Soft state:           State may change over time (even without input, due to replication)
  Eventually consistent: Given enough time, all replicas converge to the same value
  
  Cost: weaker guarantees, but higher throughput and availability
  Use when: social feeds, analytics, logging — where temporary inconsistency is acceptable

In practice, most systems use BOTH:
  ACID for: payment processing, order creation, account management
  BASE for: activity feeds, search indices, recommendations, analytics
```

---

## 7. Database Selection — Decision Framework

```
QUESTION                                    ANSWER → DATABASE
──────────────────────────────────────────────────────────────────────
Structured data with relationships?         → PostgreSQL / MySQL
Need ACID transactions?                     → PostgreSQL / MySQL
Schema changes frequently?                  → MongoDB
Write-heavy, time-series data?              → Cassandra / TimescaleDB
Need sub-millisecond reads?                 → Redis (in-memory)
Simple key-value lookups at scale?          → DynamoDB / Redis
Full-text search?                           → Elasticsearch
Graph traversals (friends-of-friends)?      → Neo4j / Neptune
Analytics on large datasets?                → ClickHouse / BigQuery / Redshift
Need global distribution?                   → CockroachDB / Spanner / Cassandra
Just starting a project?                    → PostgreSQL (always a safe default)

THE DEFAULT ANSWER: PostgreSQL
  Unless you have a SPECIFIC reason to choose something else.
  PostgreSQL handles: relational data, JSON documents, full-text search,
  time-series (TimescaleDB extension), geospatial (PostGIS), and more.
  It scales to hundreds of thousands of QPS with proper indexing and read replicas.
  Don't reach for NoSQL until PostgreSQL can't handle your workload.
```

---

## 8. Database Best Practices

```
INDEXING:
  ✓ Create indexes for ALL columns used in WHERE, JOIN, ORDER BY
  ✓ Use composite indexes for multi-column queries (respect leftmost prefix)
  ✓ Use EXPLAIN ANALYZE to verify index usage
  ✓ Monitor slow query logs
  ✗ Don't index everything (each index slows writes)
  ✗ Don't use SELECT * (prevents index-only scans)

SCHEMA DESIGN:
  ✓ Normalize for write-heavy workloads (reduce duplication)
  ✓ Denormalize for read-heavy workloads (avoid JOINs)
  ✓ Use appropriate data types (INT not VARCHAR for IDs)
  ✓ Add constraints (NOT NULL, UNIQUE, FOREIGN KEY, CHECK)
  ✓ Use UUIDs for distributed systems (no central sequence needed)

SCALING:
  Step 1: Optimize queries (indexes, EXPLAIN)        → 10x improvement
  Step 2: Add read replicas                            → 5x read capacity
  Step 3: Add caching (Redis)                          → 10-100x for hot data
  Step 4: Vertical scaling (bigger machine)            → 2-4x
  Step 5: Shard (last resort — adds massive complexity) → unlimited

CONNECTION MANAGEMENT:
  ✓ Use connection pooling (HikariCP, PgBouncer)
  ✓ Size pool correctly: connections = (cores × 2) + spindles
  ✓ Set statement timeout (don't let queries run forever)
  ✓ Monitor connection count and wait time

BACKUP AND RECOVERY:
  ✓ Automated backups (daily full + continuous WAL archiving)
  ✓ Test restores regularly (untested backup = no backup)
  ✓ Point-in-time recovery capability
  ✓ Cross-region backup replication
```

---

---

## 9. Elasticsearch — Full-Text Search at Scale

### When SQL LIKE '%query%' Isn't Enough

Regular databases find exact matches fast (B-tree index) but text search is different. Searching "best coffee near downtown" across millions of product descriptions requires: **tokenization** (split text into words), **stemming** (reduce "running" to "run"), **scoring** (rank by relevance), and **inverted indexes** (map each word to the documents containing it).

```
INVERTED INDEX (how Elasticsearch actually works):

Documents:
  doc1: "Redis is an in-memory cache"
  doc2: "Memcached is a distributed cache"
  doc3: "Redis supports data structures"

Inverted Index:
  "redis"       → [doc1, doc3]
  "in-memory"   → [doc1]
  "cache"       → [doc1, doc2]
  "memcached"   → [doc2]
  "distributed" → [doc2]
  "data"        → [doc3]
  "structures"  → [doc3]

Query: "redis cache"
  "redis" → [doc1, doc3]
  "cache" → [doc1, doc2]
  Intersection + scoring → doc1 ranks highest (matches both terms)

This is FUNDAMENTALLY different from B-tree.
B-tree: find exact key → O(log n)
Inverted index: find all documents containing a word → O(1) per word, then merge

USE ELASTICSEARCH WHEN:
  ✓ Full-text search (product search, log search, article search)
  ✓ Aggregations on large datasets (analytics, dashboards)
  ✓ Log management (ELK stack: Elasticsearch + Logstash + Kibana)
  ✓ Geospatial search (find restaurants within 5km)
  
DO NOT USE AS PRIMARY DATABASE:
  ✗ Not ACID compliant (eventual consistency)
  ✗ Not good for transactional writes
  ✗ Data should live in PostgreSQL/MySQL → replicated to Elasticsearch for search
```

### DynamoDB — Single Table Design Pattern

```
TRADITIONAL SQL: multiple tables, JOINs to combine
  users table + orders table + order_items table
  SELECT * FROM users JOIN orders JOIN order_items WHERE user_id = 42

DYNAMODB SINGLE TABLE: everything in ONE table, no JOINs
  
  PK              SK                   Data
  ──────────────────────────────────────────────
  USER#42         PROFILE              {name: "Alice", email: "..."}
  USER#42         ORDER#2024-001       {total: 99.99, status: "shipped"}
  USER#42         ORDER#2024-002       {total: 149.50, status: "pending"}
  ORDER#2024-001  ITEM#1               {product: "Widget", qty: 2}
  ORDER#2024-001  ITEM#2               {product: "Gadget", qty: 1}
  
  Get user profile:     Query PK=USER#42, SK=PROFILE
  Get user's orders:    Query PK=USER#42, SK begins_with "ORDER#"
  Get order items:      Query PK=ORDER#2024-001, SK begins_with "ITEM#"
  
  ALL of these are single-partition queries — extremely fast, O(1)
  No JOINs needed — related data is co-located by design

WHY: DynamoDB charges by read/write capacity units.
  A JOIN across tables = multiple queries = multiple capacity units = expensive.
  Single table = one query = one capacity unit = cheap and fast.
```

---

## 10. Time-Series Databases — When Data Has a Timestamp

```
Time-series data: metrics, IoT sensor readings, stock prices, logs
  Every data point has a timestamp, and queries are always time-ranged.

WHY REGULAR DATABASES STRUGGLE:
  INSERT rate: millions of data points per second
  Query pattern: always "WHERE timestamp BETWEEN X AND Y"
  Data is append-only (never updated, just new inserts)
  Old data needs downsampling/aggregation (keep hourly averages, delete per-second)

SPECIALIZED DATABASES:
  TimescaleDB:   PostgreSQL extension (SQL interface, familiar tools)
  InfluxDB:      Purpose-built, its own query language (Flux)
  Prometheus:    Pull-based metrics (scrapes targets at intervals)
  ClickHouse:    Column-oriented analytical database (extremely fast aggregations)
  
  Common optimization: store data in time-ordered chunks on disk
  Recent data: in memory (hot, frequently queried)
  Old data: compressed on disk (cold, aggregated)

USE WHEN:
  ✓ Application metrics (CPU usage, request latency, error rates)
  ✓ IoT data (sensor readings, GPS coordinates, temperature)
  ✓ Financial data (stock prices, trade volume)
  ✓ Event logging (user actions, system events)
```

---

*After this phase: you can choose the right database for any use case and explain why. You can design indexes that make queries 100x faster. You can explain sharding trade-offs, replication consistency models, and the CAP theorem from first principles. You know when to use Elasticsearch for search, DynamoDB for serverless, and time-series databases for metrics. You understand that "just use PostgreSQL" is usually the right answer — and you know when it's not.*
