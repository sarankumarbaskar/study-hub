# Phase 5 — JDBC and Transactions: The Complete Deep Dive

> This directly impacts your pricing engine, SKU writes, and every DB interaction in production.

Every Java backend application talks to a database, and JDBC (Java Database Connectivity) is the foundation of that communication — whether you use it directly, through Spring JdbcTemplate, through JPA/Hibernate, or through MyBatis. Even if you never write a raw JDBC call, understanding what happens underneath your ORM is essential for diagnosing the performance problems that inevitably appear in production: slow queries, connection pool exhaustion, transaction isolation anomalies, N+1 query explosions, connection leaks, and deadlocks.

This phase covers JDBC at the wire level (what actually happens when you execute a query), transactions at the database level (what isolation levels really mean in terms of MVCC snapshots and lock behavior), connection pooling at the implementation level (why HikariCP is fast and how to size your pool), and batch operations at the performance level (why batching gives you 100x throughput improvement). Every topic is directly applicable to production systems — this is not theoretical database theory but practical engineering knowledge.

---

## 1. JDBC Architecture — What Happens When You Query

Understanding the JDBC stack helps you reason about where time is spent in a database operation. When your monitoring shows a query took 150ms, is that the query execution time on the database, or does it include connection acquisition, network round-trips, SSL handshake, and result set deserialization? The answer depends on which layer you're measuring, and knowing the stack helps you identify the right layer to optimize.

### The JDBC Stack

```
Your Code
    │
    ▼
┌──────────────┐
│  JDBC API    │  java.sql.Connection, PreparedStatement, ResultSet
│  (interface) │  You code against this
├──────────────┤
│  JDBC Driver │  mysql-connector-j, postgresql-jdbc, ojdbc
│  (impl)      │  Translates JDBC calls to database wire protocol
├──────────────┤
│  TCP/IP      │  Socket connection to database
│  (transport) │  Serialized protocol messages (MySQL protocol, PG wire protocol)
├──────────────┤
│  Database    │  Parser → Optimizer → Executor → Storage Engine
│  Server      │  Returns result sets
└──────────────┘
```

### Connection Lifecycle — Why It's Expensive

This is the #1 reason connection pools exist. Creating a database connection is shockingly expensive — not because of any single step, but because of the accumulation of network round-trips: DNS resolution, TCP three-way handshake, TLS negotiation (up to 4 additional round-trips), database authentication, and session initialization. On a local database, this takes 10-50ms. Over a network, it takes 50-200ms. Compare this to borrowing a pooled connection: ~0.001ms (a pointer dereference). The difference is 10,000x to 200,000x — and this cost is paid on EVERY request if you don't pool.

```java
Connection conn = DriverManager.getConnection(url, user, password);
```

```
What actually happens:

1. DNS resolution              (~1-100ms first time, cached after)
2. TCP handshake               (~0.5-1ms local, 1-50ms remote)
   SYN → SYN-ACK → ACK        (3-way handshake)
3. SSL/TLS handshake           (~5-50ms if enabled)
   ClientHello → ServerHello → Certificate → KeyExchange → Finished
4. Database authentication     (~1-10ms)
   Username/password → auth protocol → session created
5. Session initialization      (~1-10ms)
   Set timezone, character set, default schema, session variables
6. Connection metadata setup   (~1-5ms)
   Driver caches DB capabilities, SQL dialect features

TOTAL: 10-200ms per connection creation

Compare to reusing a pooled connection: ~0.001ms (pointer dereference)
That's 10,000x - 200,000x faster.
```

---

## 2. PreparedStatement vs Statement — Parsing and Plan Caching

The difference between `Statement` and `PreparedStatement` is not just about SQL injection prevention (though that alone is reason enough to always use `PreparedStatement`). It's about **performance at the database level**. Every SQL query must be parsed (lexed into tokens, parsed into an abstract syntax tree), validated (tables exist? columns exist? types match?), and optimized (which index to use? which join strategy? which scan order?) before execution. With a plain `Statement`, the database does all of this work for every single execution. With a `PreparedStatement`, the database does it once and caches the execution plan — subsequent executions send only the parameter values and skip directly to execution. For queries executed thousands of times per second (which is normal in a web application), this can be a 2-5x performance improvement.

### Statement — Parsed Every Time

```java
// BAD: SQL injection risk + no plan caching
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM products WHERE id = " + id);

// For every execution:
// 1. Database parses SQL string      (CPU intensive)
// 2. Database creates execution plan  (optimizer work)
// 3. Database executes plan
// 4. SQL injection: id = "1; DROP TABLE products" → disaster
```

### PreparedStatement — Parsed Once, Executed Many

```java
// GOOD: safe + fast
PreparedStatement ps = conn.prepareStatement(
    "SELECT * FROM products WHERE id = ? AND status = ?"
);

ps.setLong(1, productId);
ps.setString(2, "ACTIVE");
ResultSet rs = ps.executeQuery();
```

```
What happens at the database:

First prepare:
  1. Parse SQL → AST (abstract syntax tree)
  2. Validate (table exists, columns exist, types match)
  3. Create execution plan
  4. Cache plan with statement ID
  5. Return statement handle to client

Each execute:
  1. Send statement handle + parameter values
  2. Database looks up cached plan → skip parse + optimize
  3. Bind parameters safely (no SQL injection — parameters are DATA, not SQL)
  4. Execute plan, return results

Server-side prepared statement cache:
  MySQL:   per-connection cache (connection.prepStmtCacheSize)
  PostgreSQL: per-connection, named plans
  Oracle:  shared cursor cache (library cache)
```

### Client-Side Statement Caching

```java
// Connection pool can cache PreparedStatement objects:
// HikariCP, DBCP2, c3p0 all support this

// HikariCP config:
dataSource.addDataSourceProperty("cachePrepStmts", "true");
dataSource.addDataSourceProperty("prepStmtCacheSize", "250");
dataSource.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

// What this does:
// When you call conn.prepareStatement(sql):
//   1. Check cache for this SQL string → found? Return cached PS
//   2. Not found? Create new PS, put in LRU cache
// When you call ps.close():
//   1. Don't actually close — return to cache for reuse
//   2. Only closed when connection is destroyed or cache evicts

// This avoids even the network round-trip for prepare on cache hit
```

---

## 3. Auto-Commit — The Silent Danger

Auto-commit is the default behavior of JDBC connections, and it's responsible for a class of bugs that are almost impossible to catch in testing but devastating in production. With auto-commit enabled, every single SQL statement is wrapped in its own implicit transaction and committed immediately. This means if you execute three statements that should be atomic (insert an order, insert order items, decrement inventory), and the third one fails, the first two are already committed — leaving your database in an inconsistent state where an order exists without the corresponding inventory reduction.

The fix is simple: `conn.setAutoCommit(false)` (or use Spring's `@Transactional`). But the danger of auto-commit is so pervasive that it deserves its own section, because many developers assume that "being inside a `@Transactional` method" automatically disables auto-commit — and it does, but only if the proxy is actually active (self-invocation bypasses it, as explained in Section 12).

```java
// By default, auto-commit is TRUE
Connection conn = dataSource.getConnection();
conn.getAutoCommit();  // true

// This means: every single SQL statement is its own transaction
// Statement 1: INSERT INTO orders (...) → COMMIT
// Statement 2: INSERT INTO order_items (...) → COMMIT
// Statement 3: UPDATE inventory SET qty = qty - 1 → COMMIT

// If statement 3 fails: order exists without inventory reduction!
```

```java
// CORRECT: manual transaction management
conn.setAutoCommit(false);
try {
    insertOrder(conn);
    insertOrderItems(conn);
    updateInventory(conn);
    conn.commit();           // all or nothing
} catch (Exception e) {
    conn.rollback();         // undo everything
    throw e;
}

// Or use Spring's @Transactional (manages this automatically):
@Transactional
public void placeOrder(Order order) {
    orderRepo.save(order);           // same transaction
    inventoryRepo.decrement(order);  // same transaction
}   // commit on success, rollback on exception
```

---

## 4. Transaction Isolation Levels — What the Database Guarantees

Transaction isolation levels are one of the most misunderstood concepts in database programming. Most developers memorize the table of which phenomena each level prevents, but don't understand the underlying mechanism — **MVCC (Multi-Version Concurrency Control)** — which is how modern databases actually implement isolation. Understanding MVCC transforms isolation levels from an abstract spec into a concrete, predictable behavior: each transaction sees a **snapshot** of the database at a specific point in time, and the isolation level determines *when* that snapshot is taken.

Choosing the wrong isolation level has real production consequences. `READ UNCOMMITTED` can show you data that will never exist (if the writing transaction rolls back). `READ COMMITTED` (the default in PostgreSQL and Oracle) can give you different answers for the same query within a single transaction. `REPEATABLE READ` (the default in MySQL) prevents most anomalies but can still allow phantom rows in some databases. `SERIALIZABLE` prevents everything but can cause transaction rollbacks under contention, requiring retry logic. Every application must explicitly choose the right level for its consistency requirements.

### The Phenomena

```
DIRTY READ:      Read data written by an uncommitted transaction
                 → if that tx rolls back, you read data that never existed

NON-REPEATABLE READ:  Read same row twice, get different values
                      → another tx committed an UPDATE between your reads

PHANTOM READ:    Run same query twice, get different ROW COUNT
                 → another tx committed an INSERT/DELETE between your queries
```

### Isolation Levels

```
Level                  Dirty Read   Non-Repeatable   Phantom   Performance
                                    Read             Read
─────────────────────────────────────────────────────────────────────────
READ UNCOMMITTED       Possible     Possible         Possible  Fastest
READ COMMITTED         Prevented    Possible         Possible  Fast (default PG, Oracle)
REPEATABLE READ        Prevented    Prevented        Possible  Medium (default MySQL)
SERIALIZABLE           Prevented    Prevented        Prevented Slowest
```

### How They Work Internally (MVCC)

Most modern databases use **Multi-Version Concurrency Control (MVCC)** — not actual locks for reads:

```
MVCC: each transaction sees a SNAPSHOT of the data

Transaction Timeline:
  t=100: TX1 starts (snapshot at t=100)
  t=101: TX2 starts (snapshot at t=101)
  t=102: TX2 updates row X from 'A' to 'B', commits
  t=103: TX1 reads row X → sees 'A' (its snapshot is from t=100!)

How it works:
  Every row has hidden columns: created_txid, expired_txid
  ┌───────┬────────┬────────────┬─────────────┐
  │ value │  ...   │ created_tx │ expired_tx  │
  ├───────┼────────┼────────────┼─────────────┤
  │  'A'  │  ...   │    50      │    102      │ ← old version
  │  'B'  │  ...   │   102      │   ∞         │ ← new version
  └───────┴────────┴────────────┴─────────────┘

  TX1 (snapshot=100): sees rows where created_tx ≤ 100 AND expired_tx > 100
  → sees 'A' (created at 50, expired at 102 which is > 100)

  TX2 (snapshot=101, committed at 102): sees 'B' after commit

Benefit: readers don't block writers, writers don't block readers
Cost: old row versions accumulate → must be cleaned up (VACUUM in PG, purge in MySQL)
```

### READ COMMITTED — Snapshot Per Statement

```java
conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);

// Each SQL statement gets a FRESH snapshot:
// Statement 1: SELECT balance FROM accounts WHERE id=1  → sees balance = 1000
//   (another tx commits: UPDATE accounts SET balance=500 WHERE id=1)
// Statement 2: SELECT balance FROM accounts WHERE id=1  → sees balance = 500
// NON-REPEATABLE READ! Different value in same transaction.
```

### REPEATABLE READ — Snapshot Per Transaction

```java
conn.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);

// Entire transaction uses ONE snapshot (taken at first read):
// Statement 1: SELECT balance FROM accounts WHERE id=1  → sees balance = 1000
//   (another tx commits: UPDATE accounts SET balance=500 WHERE id=1)
// Statement 2: SELECT balance FROM accounts WHERE id=1  → sees balance = 1000 (same!)
// REPEATABLE READ! Same value throughout transaction.

// BUT: phantom reads are still possible
// Statement 1: SELECT COUNT(*) FROM orders WHERE user_id=1  → 10
//   (another tx commits: INSERT INTO orders (user_id) VALUES (1))
// Statement 2: SELECT COUNT(*) FROM orders WHERE user_id=1  → 11 (phantom!)
// Note: MySQL's InnoDB PREVENTS phantoms even at REPEATABLE READ (gap locking)
```

### SERIALIZABLE — Full Isolation

```java
conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);

// Transactions execute as if they ran one after another
// Implementation varies:
//   PostgreSQL: Serializable Snapshot Isolation (SSI)
//     → detects read-write conflicts at commit, aborts one tx
//   MySQL: gap locks + next-key locks
//     → prevents INSERT in ranges that other tx read
//   Oracle: doesn't have true SERIALIZABLE (it's snapshot isolation)

// Cost: potential for transaction rollbacks under contention
// You MUST retry failed transactions:
while (true) {
    try {
        doTransaction();
        break;
    } catch (SerializationFailureException e) {
        // retry — expected under SERIALIZABLE
    }
}
```

### Real-World Isolation Choice

```
Use Case                              Recommended Level
──────────────────────────────────────────────────────────────
Most web applications                 READ COMMITTED
Financial transactions                REPEATABLE READ or SERIALIZABLE
Reporting / analytics                 READ COMMITTED (or snapshot)
Inventory management (your SKU pricing)  REPEATABLE READ
Account balance updates               SERIALIZABLE (or SELECT FOR UPDATE)
```

---

## 5. Locking — Pessimistic vs Optimistic

Database locking is where the rubber meets the road in concurrent data access. When two users try to update the same SKU price simultaneously, or two transactions try to debit the same bank account, the database must ensure consistency — and locking is how it does it. The choice between pessimistic and optimistic locking is one of the most important architectural decisions in any data-heavy application.

**Pessimistic locking** assumes conflicts are likely: it locks the row at read time, preventing anyone else from modifying it until the transaction commits. This is safe but can cause contention (other transactions wait) and deadlocks (circular waits). **Optimistic locking** assumes conflicts are rare: it reads without locking, and at update time, checks whether the data has changed since it was read (typically via a version column). If it has changed, the update fails and the application must retry. This avoids contention and deadlocks but requires retry logic and can fail repeatedly under high contention.

The guideline: use optimistic locking for web applications with low-to-medium write contention (most CRUD apps). Use pessimistic locking for financial operations, inventory management, and any scenario where concurrent writes to the same row are frequent and correctness is non-negotiable.

### Pessimistic Locking (SELECT ... FOR UPDATE)

```java
// Lock the row — no other transaction can read or modify it
PreparedStatement ps = conn.prepareStatement(
    "SELECT balance FROM accounts WHERE id = ? FOR UPDATE"
);
ps.setLong(1, accountId);
ResultSet rs = ps.executeQuery();
// Row is now LOCKED until this transaction commits/rolls back

rs.next();
int balance = rs.getInt("balance");

if (balance >= amount) {
    PreparedStatement update = conn.prepareStatement(
        "UPDATE accounts SET balance = balance - ? WHERE id = ?"
    );
    update.setInt(1, amount);
    update.setLong(2, accountId);
    update.executeUpdate();
}

conn.commit();  // row lock released
```

```
Database lock types:

SHARED LOCK (S):     Multiple transactions can hold simultaneously
                     Allows reads, prevents writes
                     SELECT ... FOR SHARE (MySQL) / FOR KEY SHARE (PG)

EXCLUSIVE LOCK (X):  Only one transaction can hold
                     Prevents reads and writes
                     SELECT ... FOR UPDATE

ROW LOCK:            Locks individual rows
GAP LOCK:            Locks the GAP between index entries (prevents phantom inserts)
NEXT-KEY LOCK:       Row lock + gap lock (MySQL InnoDB default for REPEATABLE READ)

Lock wait:
  If TX2 tries FOR UPDATE on a row locked by TX1:
  TX2 BLOCKS until TX1 commits/rolls back
  → deadlock possible if circular dependency
  → lock wait timeout: innodb_lock_wait_timeout (default 50s in MySQL)
```

### Optimistic Locking (Version Column)

```java
// No database lock held during "think time"
// Instead: version check at update time

// Read (no lock):
SELECT id, name, price, version FROM products WHERE id = ?
// version = 5

// Update (with version check):
UPDATE products
SET price = ?, version = version + 1
WHERE id = ? AND version = ?    // ← the optimistic check
// Parameters: newPrice, productId, 5

int rowsUpdated = ps.executeUpdate();
if (rowsUpdated == 0) {
    // Version changed! Someone else modified the row.
    // RETRY or report conflict to user
    throw new OptimisticLockException("Concurrent modification detected");
}
```

```
Optimistic vs Pessimistic:

                     Pessimistic              Optimistic
──────────────────────────────────────────────────────────
Lock acquisition     At read time             None (check at write)
Contention handling  Blocks other threads     Fails fast, retry
Read performance     Slower (lock overhead)   Fast (no lock)
Write contention     Handles well             Retry overhead
Use case             High contention          Low-medium contention
DB overhead          Lock manager, wait queue  Version column, CAS-like
Deadlock risk        Yes                      No
```

---

## 6. Connection Pooling — Why and How

Connection pooling is not optional in production Java applications — it's a fundamental requirement. Without a pool, every database operation pays the full connection creation cost (10-200ms of network round-trips). With a pool, you pay that cost once at startup, and every subsequent operation borrows a pre-established connection in microseconds. This is not a minor optimization — it's a 10,000x improvement that transforms database performance from unusable to production-grade.

Beyond raw performance, connection pools provide critical operational features: **connection limiting** (preventing your application from overwhelming the database with too many concurrent connections), **connection validation** (detecting and replacing dead connections before your application uses them), **leak detection** (alerting you when code borrows a connection and never returns it), and **metrics** (exposing pool utilization for monitoring and alerting). Every production Java application should use a connection pool, and HikariCP (the default in Spring Boot) is the current state of the art.

### Why Pools Exist

```
Without pool:
  request → getConnection() → [10-200ms TCP + auth] → query → close
  request → getConnection() → [10-200ms TCP + auth] → query → close
  request → getConnection() → [10-200ms TCP + auth] → query → close

With pool:
  startup → create 10 connections → [10-200ms each, done once]
  request → borrowConnection() → [~0.001ms] → query → returnConnection()
  request → borrowConnection() → [~0.001ms] → query → returnConnection()
  request → borrowConnection() → [~0.001ms] → query → returnConnection()

10,000x faster per request
```

### Pool Internals

```
┌─────────────────────────────────────────────────────────────┐
│  Connection Pool                                             │
│                                                              │
│  ┌────────────────────────────────┐                         │
│  │ Available Connections (idle)    │                         │
│  │  [conn1] [conn2] [conn3]       │ ← threads borrow from  │
│  └────────────────────────────────┘    here                 │
│                                                              │
│  ┌────────────────────────────────┐                         │
│  │ In-Use Connections (active)     │                         │
│  │  [conn4] [conn5]               │ ← returned after use   │
│  └────────────────────────────────┘                         │
│                                                              │
│  Config:                                                     │
│    minimumIdle: 5      (keep at least this many idle)        │
│    maximumPoolSize: 20 (hard cap — NEVER exceed)             │
│    connectionTimeout: 30s (wait time for borrow)             │
│    idleTimeout: 10min  (close idle connections after this)   │
│    maxLifetime: 30min  (close all connections after this)    │
│    leakDetectionThreshold: 60s (log warning if not returned) │
│                                                              │
│  Borrow flow:                                                │
│    1. Any idle connection available? → return it             │
│    2. Pool size < max? → create new connection               │
│    3. Pool at max → WAIT (up to connectionTimeout)           │
│    4. Timeout → throw SQLTransientConnectionException        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. HikariCP — Why It's the Fastest

HikariCP is the default connection pool in Spring Boot, and it's the fastest JDBC connection pool in existence. Understanding why it's fast teaches you general principles of high-performance Java: avoid locks (use thread-local caches and CAS operations), minimize bytecode (smaller code = better JIT inlining), and exploit CPU cache locality (the same connection tends to stay on the same thread, keeping the connection's metadata hot in the CPU cache).

The most counterintuitive lesson from HikariCP is its pool sizing recommendation: for an 8-core server, the optimal pool size is approximately **17 connections** — not 100, not 200. This is because the bottleneck is the database, not the pool. More connections mean more concurrent queries competing for the same database locks, disk I/O, and CPU — which actually makes each query slower. A smaller pool queues excess requests in fast in-memory data structures (at the application layer) instead of queuing them in the database (where they hold locks and consume database resources).

### Architecture

```
HikariCP's key innovations:

1. ConcurrentBag — lock-free connection container
   ┌──────────────────────────────────────────┐
   │ ThreadLocal<List<PoolEntry>> threadList   │ ← each thread has its own list
   │ CopyOnWriteArrayList<PoolEntry> sharedList│ ← fallback shared list
   │ SynchronousQueue<PoolEntry> handoffQueue  │ ← direct handoff
   └──────────────────────────────────────────┘

   Borrow flow:
     1. Check thread-local list (zero contention!)
        → if own thread's previously used connection is idle → return it
     2. Check shared list (CAS to mark as borrowed)
     3. Wait on handoff queue (another thread returning)

   WHY THIS IS FAST:
     Most borrows hit the thread-local cache
     No lock, no CAS, no contention
     Same connection tends to stay on same thread → CPU cache hot

2. Fast path with no locks
   - Connection proxy uses code generation (Javassist)
   - Avoids reflection overhead
   - Method calls on Connection/Statement/ResultSet are near-zero overhead

3. Minimal bytecode
   - Entire library is ~130KB
   - Simple code → JIT can inline aggressively
   - No complex dependency trees

4. Smart defaults
   - maximumPoolSize = 10 (deliberately small!)
   - connectionTimeout = 30,000ms
   - idleTimeout = 600,000ms (10 minutes)
   - maxLifetime = 1,800,000ms (30 minutes)
```

### Pool Sizing — The Counterintuitive Truth

```
HikariCP's recommended formula:

connections = ((core_count * 2) + effective_spindle_count)

For an 8-core server with SSD:
  connections = (8 * 2) + 1 = 17

YES, 17 connections can handle thousands of concurrent requests!

WHY small pools are FASTER:

With 100 connections and 10,000 requests:
  - 100 threads all hitting the same table
  - Database: 100 concurrent locks, massive contention
  - OS: 100 threads context switching
  - DB disk: 100 random I/O operations

With 17 connections and 10,000 requests:
  - 17 threads, less contention on DB rows
  - Requests queue at the POOL level (fast in-memory queue)
  - Database: 17 concurrent queries, manageable
  - Total throughput: HIGHER (less contention = faster per-query)

The bottleneck is the DATABASE, not the pool.
A larger pool doesn't make the database faster — it makes it SLOWER due to contention.
```

### HikariCP Configuration for Spring Boot

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20          # tune based on DB and workload
      minimum-idle: 5                # or set equal to max for fixed pool
      connection-timeout: 30000      # 30s wait for connection
      idle-timeout: 600000           # 10min before idle connection closed
      max-lifetime: 1800000          # 30min max connection age
      leak-detection-threshold: 60000 # warn if connection held > 60s
      data-source-properties:
        cachePrepStmts: true
        prepStmtCacheSize: 250
        prepStmtCacheSqlLimit: 2048
        useServerPrepStmts: true     # server-side prepared statements
```

---

## 8. Batch Operations — 10-100x Faster Writes

Batch operations are the single biggest performance optimization available for write-heavy workloads. The reason is simple: the dominant cost in a database write is not the INSERT itself but the **network round-trip** between your application and the database. Each round-trip takes 0.5-5ms (depending on network distance). If you insert 10,000 rows one at a time, you pay 10,000 round-trips — that's 5-50 seconds of pure network overhead. Batching lets you send thousands of rows in a single round-trip, reducing the network cost to near-zero.

For MySQL specifically, the `rewriteBatchedStatements=true` connection parameter goes further: it rewrites individual INSERT statements into a single multi-row INSERT (`INSERT INTO t VALUES (1), (2), (3)...`), which the MySQL optimizer can execute significantly faster than separate statements. This combination of network batching and SQL rewriting gives you 100-200x throughput improvement for bulk writes — the difference between a 10-minute data load and a 3-second one.

### The Problem with Single Inserts

```java
// SLOW: one network round-trip per insert
for (SkuPrice price : prices) {
    PreparedStatement ps = conn.prepareStatement(
        "INSERT INTO sku_prices (sku_id, price, effective_date) VALUES (?, ?, ?)"
    );
    ps.setString(1, price.getSkuId());
    ps.setBigDecimal(2, price.getPrice());
    ps.setDate(3, price.getEffectiveDate());
    ps.executeUpdate();  // network round-trip: 0.5-5ms
}

// 10,000 inserts × 1ms per round-trip = 10 seconds
```

### Batch INSERT

```java
// FAST: one network round-trip for many inserts
conn.setAutoCommit(false);
PreparedStatement ps = conn.prepareStatement(
    "INSERT INTO sku_prices (sku_id, price, effective_date) VALUES (?, ?, ?)"
);

for (SkuPrice price : prices) {
    ps.setString(1, price.getSkuId());
    ps.setBigDecimal(2, price.getPrice());
    ps.setDate(3, price.getEffectiveDate());
    ps.addBatch();  // accumulate — no network call yet

    if (batchCount % 1000 == 0) {
        ps.executeBatch();  // send 1000 rows in ONE round-trip
        ps.clearBatch();
    }
}
ps.executeBatch();  // remaining rows
conn.commit();

// 10,000 inserts in 10 batches of 1000 = ~10 round-trips = ~50ms
// That's 200x faster!
```

### MySQL Batch Optimization: rewriteBatchedStatements

```
Without rewriteBatchedStatements:
  JDBC sends: INSERT INTO t VALUES (1,'a'); INSERT INTO t VALUES (2,'b'); INSERT INTO t VALUES (3,'c');
  → 3 separate statements in one packet

With rewriteBatchedStatements=true:
  JDBC rewrites to: INSERT INTO t VALUES (1,'a'),(2,'b'),(3,'c');
  → single multi-row INSERT (MySQL-specific optimization)
  → 5-10x faster than even regular batching

Enable: jdbc:mysql://host/db?rewriteBatchedStatements=true
```

### Batch Size Sweet Spot

```
Batch size   Time per 100K rows   Notes
──────────────────────────────────────────
1            ~100 seconds          1 row per round-trip
10           ~12 seconds           10x faster
100          ~2 seconds            100x faster
1,000        ~0.5 seconds          sweet spot for most DBs
10,000       ~0.4 seconds          diminishing returns
100,000      ~0.5 seconds          may cause OOM or timeout

WHY diminishing returns:
  - Network: batch amortizes round-trip cost (main gain)
  - Memory: large batches consume more client + server memory
  - Undo log: large transaction = large undo log = slow rollback if fails
  - Lock duration: large batch holds locks longer = more contention

Recommended: 100-1000 rows per batch
             Commit every 10,000-50,000 rows for very large loads
```

---

## 9. N+1 Query Problem — The Most Common Performance Bug

The N+1 query problem is the single most common performance bug in Java applications using ORMs (JPA/Hibernate). It happens silently: your code looks clean, your unit tests pass, and your application works correctly. But under the hood, instead of one query to fetch your data, the ORM executes N+1 queries — one for the parent entities and one for each parent's child collection. With 100 orders, that's 101 queries instead of 1. With 10,000 orders, it's 10,001 queries. The database round-trip overhead alone can turn a 5ms operation into a 50-second operation.

The insidious part is that the N+1 problem is invisible in your Java code — it's hidden inside Hibernate's lazy loading. When you access `order.getItems()` inside a loop, Hibernate silently executes a SELECT for each order. There's no indication in your code that a database call is happening. This is why every JPA application should enable Hibernate's SQL logging in development (`spring.jpa.show-sql=true` or `hibernate.show_sql=true`) and monitor query counts in production.

```java
// THE BUG: fetch 100 orders, then 100 queries for order items
List<Order> orders = orderRepo.findAll();              // 1 query: SELECT * FROM orders
for (Order order : orders) {
    List<OrderItem> items = itemRepo.findByOrderId(order.getId());
    // 100 queries: SELECT * FROM order_items WHERE order_id = ?
}
// TOTAL: 101 queries! (1 + N)

// FIX 1: JOIN fetch
List<Order> orders = orderRepo.findAllWithItems();
// SELECT o.*, i.* FROM orders o JOIN order_items i ON o.id = i.order_id
// 1 query, all data

// FIX 2: Batch fetch (JPA/Hibernate)
@BatchSize(size = 50)  // Hibernate fetches items in batches of 50
@OneToMany(mappedBy = "order")
private List<OrderItem> items;
// 1 query for orders + 2 queries for items (batched IN clause)
// SELECT * FROM order_items WHERE order_id IN (?, ?, ?, ... 50 ids)

// FIX 3: EntityGraph (JPA)
@EntityGraph(attributePaths = {"items"})
List<Order> findAll();
// Single JOIN query
```

---

## 10. Database Lock Types and Deadlocks

Database deadlocks are the concurrent programming equivalent of a traffic jam where four cars arrive at a four-way intersection simultaneously and each waits for the other to go first — nobody moves forever. In databases, deadlocks occur when two transactions each hold a lock that the other needs, creating a circular wait. Unlike Java-level deadlocks (which the JVM can detect but not resolve), database deadlocks are automatically detected and resolved: the database kills one transaction (the "victim") and allows the other to proceed. The victim receives a rollback exception and must retry.

Understanding the specific lock types your database uses (row locks, gap locks, next-key locks in MySQL InnoDB) is essential for preventing deadlocks and diagnosing unexpected blocking. Gap locks, in particular, are a frequent source of confusion: they lock the "gap" between index entries to prevent phantom inserts, and they can cause deadlocks in scenarios where you wouldn't expect any conflict.

### Row-Level Lock Contention

```
TX1: UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- locks row 1
TX2: UPDATE accounts SET balance = balance - 50 WHERE id = 1;   -- WAITS (row 1 locked)
TX1: COMMIT;  -- releases lock
TX2: proceeds  -- acquires lock

This is NORMAL — serial access to same row.
Impact: TX2 waits ~milliseconds. Usually fine.
```

### Deadlock

```
TX1: UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- locks row 1
TX2: UPDATE accounts SET balance = balance - 50 WHERE id = 2;   -- locks row 2
TX1: UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- WAITS (row 2 locked by TX2)
TX2: UPDATE accounts SET balance = balance + 50 WHERE id = 1;   -- WAITS (row 1 locked by TX1)

DEADLOCK! Both waiting for each other.
Database detects it (wait-for graph), rolls back one transaction.
The victim gets: com.mysql.cj.jdbc.exceptions.MySQLTransactionRollbackException:
                 Deadlock found when trying to get lock; try restarting transaction
```

```java
// PREVENTION: always lock rows in consistent order
void transfer(Connection conn, long fromId, long toId, int amount) {
    long firstId = Math.min(fromId, toId);
    long secondId = Math.max(fromId, toId);

    // Always lock lower ID first — prevents circular wait
    lockAccount(conn, firstId);
    lockAccount(conn, secondId);

    // Now safe to update both
    debit(conn, fromId, amount);
    credit(conn, toId, amount);
    conn.commit();
}
```

### Index Locking and Gap Locks (MySQL InnoDB)

```
Given: index on column 'age' with values [10, 20, 30, 40]

TX1: SELECT * FROM users WHERE age BETWEEN 15 AND 25 FOR UPDATE;

InnoDB locks:
  - Row with age=20 (record lock)
  - Gap (10, 20)     (gap lock — prevents INSERT of age=15)
  - Gap (20, 30)     (gap lock — prevents INSERT of age=25)

This is a NEXT-KEY LOCK: record lock + gap before it

WHY: prevents phantom reads at REPEATABLE READ isolation
  Without gap locks: another TX could INSERT age=18 between your reads
  With gap locks: INSERT age=18 is BLOCKED until TX1 commits

PROBLEM: gap locks can cause unexpected deadlocks
  TX1 locks gap (10,20) and TX2 locks gap (20,30)
  If both try to insert into each other's gaps → deadlock
```

---

## 11. Connection Leak Detection and Prevention

A connection leak is one of the most common and most dangerous bugs in production Java applications. It happens when code borrows a connection from the pool but never returns it — typically because an exception is thrown between `getConnection()` and `close()`, and the connection is not in a try-with-resources block. Over minutes to hours, leaked connections accumulate until the pool is exhausted. New requests can't get a connection and time out. The application appears to hang, but there's no error in the logs (the leaked connections are just sitting idle, held by code that already finished or failed). The only fix is to restart the application — and the leak starts again.

HikariCP's `leakDetectionThreshold` is your first line of defense: it logs a warning with the full stack trace when a connection is held longer than the threshold (typically 60 seconds). This tells you exactly which line of code borrowed the connection that was never returned.

### What a Leak Looks Like

```
Application starts: pool has 20 connections
After 1 hour: pool exhausted, all 20 connections "in use"
New requests: java.sql.SQLTransientConnectionException:
              Connection is not available, request timed out after 30000ms.

Cause: code path that borrows connection but never returns it
  try {
      Connection conn = dataSource.getConnection();
      PreparedStatement ps = conn.prepareStatement(sql);
      ResultSet rs = ps.executeQuery();
      // process results
      // EXCEPTION THROWN HERE → conn never closed!
  } catch (Exception e) {
      log.error("Error", e);
      // conn is leaked — not in pool, not closed
  }
```

### Prevention

```java
// ALWAYS use try-with-resources:
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql);
     ResultSet rs = ps.executeQuery()) {

    while (rs.next()) {
        // process
    }
}   // conn, ps, rs ALL closed automatically — even on exception

// HikariCP leak detection:
// hikari.leak-detection-threshold=60000
// If connection not returned within 60s → log warning with stack trace:
// "Connection leak detection triggered for connection <conn>, on thread <thread>,
//  stack trace follows"
// This tells you exactly WHERE the leak is.
```

---

## 12. Spring @Transactional — What Happens Under the Hood

`@Transactional` is the most used annotation in Spring applications, and it's also the most misunderstood. Most developers treat it as magic: "put `@Transactional` on a method, and the database will handle the rest." But understanding what Spring actually does — creating a proxy, managing a ThreadLocal-bound connection, controlling auto-commit and isolation level, and committing or rolling back based on exception type — is essential for avoiding the bugs that `@Transactional` silently introduces.

The most dangerous pitfall is **self-invocation**: when a method in a class calls another `@Transactional` method in the same class, the proxy is bypassed and the transaction annotation is completely ignored. This is because Spring's AOP proxy wraps the class from the outside — internal method calls go directly to the target object, not through the proxy. This bug is silent (no exception, no warning) and causes data inconsistency because operations that should be transactional execute in auto-commit mode.

```java
@Service
public class PricingService {

    @Transactional(
        isolation = Isolation.REPEATABLE_READ,
        propagation = Propagation.REQUIRED,
        timeout = 30,
        rollbackFor = Exception.class
    )
    public void updateSkuPrice(String skuId, BigDecimal newPrice) {
        skuRepo.updatePrice(skuId, newPrice);
        auditRepo.logPriceChange(skuId, newPrice);
    }
}
```

```
What Spring actually does:

1. PROXY CREATION (at startup):
   Spring creates a dynamic proxy around PricingService
   All calls to @Transactional methods go through the proxy

2. BEFORE METHOD (proxy interceptor):
   a. Get Connection from DataSource (HikariCP pool)
   b. conn.setAutoCommit(false)
   c. conn.setTransactionIsolation(REPEATABLE_READ)
   d. Bind connection to current thread (TransactionSynchronizationManager)
      → stored in ThreadLocal<Map<DataSource, ConnectionHolder>>

3. METHOD EXECUTION:
   All repository calls use the SAME connection (from ThreadLocal)
   skuRepo.updatePrice → uses thread-bound connection
   auditRepo.logPriceChange → uses SAME thread-bound connection

4. AFTER METHOD:
   Success: conn.commit()
   Exception: conn.rollback() (if rollbackFor matches)
   Always: conn.setAutoCommit(true), return conn to pool, clear ThreadLocal

CRITICAL GOTCHA — self-invocation:
@Transactional
public void methodA() { ... }

public void methodB() {
    this.methodA();  // BYPASSES PROXY — no transaction!
}
// Fix: inject self, or use TransactionTemplate, or restructure
```

### Propagation Levels

```
Propagation         Behavior
─────────────────────────────────────────────────────────────────────────
REQUIRED (default)  Join existing TX, or create new if none exists
REQUIRES_NEW        Suspend existing TX, always create new TX
NESTED              Create savepoint within existing TX
SUPPORTS            Join existing TX, or run without TX if none
NOT_SUPPORTED       Suspend existing TX, run without TX
MANDATORY           Must have existing TX, throw if none
NEVER               Must NOT have existing TX, throw if one exists
```

```java
@Transactional(propagation = Propagation.REQUIRED)
public void placeOrder(Order order) {
    orderRepo.save(order);
    inventoryService.decrementStock(order);  // joins same TX

    notificationService.sendEmail(order);    // should NOT fail the order
}

@Service
public class NotificationService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendEmail(Order order) {
        // Runs in its OWN transaction
        // If email fails, order TX is NOT rolled back
        emailLogRepo.save(new EmailLog(order));
        emailSender.send(order);
    }
}
```

---

## 13. Monitoring and Diagnostics

### HikariCP Metrics

```java
// Expose via JMX or Micrometer:
HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();

poolMXBean.getActiveConnections();    // currently borrowed
poolMXBean.getIdleConnections();      // available in pool
poolMXBean.getTotalConnections();     // total (active + idle)
poolMXBean.getThreadsAwaitingConnection(); // waiting for a connection

// Key alerts:
// threadsAwaitingConnection > 0 for sustained period → pool too small or leak
// activeConnections == maximumPoolSize → pool exhausted
// connection acquire time > 100ms → pool contention
```

### Slow Query Detection

```yaml
# Spring Boot:
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 100  # log queries > 100ms

# MySQL slow query log:
# slow_query_log = 1
# long_query_time = 0.1  # 100ms

# PostgreSQL:
# log_min_duration_statement = 100  # ms
```

### Decision Table

```
Symptom                               Likely Cause              Fix
─────────────────────────────────────────────────────────────────────────
Connection timeout                    Pool exhausted            Increase pool / fix leak
Slow queries after deploy             Missing index / N+1       EXPLAIN plan, add index
Deadlock exceptions                   Lock ordering             Consistent lock order
Stale data                            Wrong isolation level     Use REPEATABLE_READ
Intermittent constraint violations    Race condition            SELECT FOR UPDATE or SERIALIZABLE
High DB CPU                           Too many connections       Reduce pool size
Slow batch inserts                    Auto-commit ON / no batch  Batch + rewrite
Connection reset                      maxLifetime < DB timeout   Align timeouts
```

---

*After this phase: you can size a connection pool correctly (and explain why smaller is faster). You can choose the right isolation level for your SKU pricing writes. You can spot an N+1 query in a Hibernate log. You can debug a connection leak with HikariCP metrics. You understand the database as deeply as the JVM.*
