# Phase 1 — Protocols Deep Dive: The Languages of the Internet

> HTTP is how browsers talk to servers. TLS is why nobody can eavesdrop. gRPC is why microservices are fast. Understanding protocols means understanding the trade-offs behind every API decision you'll ever make.

A protocol is an agreement between two computers about how to format, send, and interpret data. Choosing the right protocol is one of the most impactful architectural decisions you'll make: REST over HTTP/1.1 vs gRPC over HTTP/2 vs WebSocket vs GraphQL — each optimizes for different use cases, and picking wrong means either unnecessary complexity or fundamental performance limitations that can't be fixed without a rewrite.

---

## 1. HTTP/1.1 — The Foundation of the Web

### What HTTP Is

HTTP (HyperText Transfer Protocol) is a **request-response** protocol: the client sends a request, the server sends a response. It's **stateless** — each request is independent; the server doesn't remember previous requests (cookies and sessions are application-layer workarounds for this). It's **text-based** — headers and methods are human-readable ASCII strings.

HTTP/1.1 (1997) is the version most developers learned and is still widely deployed. Understanding its limitations is essential for understanding why HTTP/2 and HTTP/3 exist.

### The Request-Response Cycle

```
REQUEST:
  GET /api/users?page=1&limit=20 HTTP/1.1     ← method, path, version
  Host: api.example.com                         ← required in HTTP/1.1
  Accept: application/json                      ← what content types client accepts
  Authorization: Bearer eyJhbGciOi...           ← authentication token
  Connection: keep-alive                        ← keep TCP connection open
  User-Agent: Mozilla/5.0 ...                   ← client identification

RESPONSE:
  HTTP/1.1 200 OK                               ← version, status code, reason
  Content-Type: application/json                 ← body format
  Content-Length: 1234                           ← body size in bytes
  Cache-Control: max-age=3600                    ← caching instructions
  X-Request-Id: abc-123-def                      ← custom header for tracing

  {"users": [...], "total": 100, "page": 1}     ← body
```

### HTTP Methods — When to Use Each

```
Method    Idempotent?  Safe?   Body?    Use When
──────────────────────────────────────────────────────────────
GET       Yes          Yes     No       Retrieve data. NEVER use for mutations.
POST      No           No      Yes      Create a resource, trigger an action.
PUT       Yes          No      Yes      Replace an entire resource (full update).
PATCH     No*          No      Yes      Partial update (modify specific fields).
DELETE    Yes          No      Optional Remove a resource.
HEAD      Yes          Yes     No       Like GET but response has no body (check if exists).
OPTIONS   Yes          Yes     No       CORS preflight, discover allowed methods.

IDEMPOTENT = calling it 2x has the same effect as 1x
  GET /users/42    → same result every time
  PUT /users/42    → replaces with same data every time
  DELETE /users/42 → deleted (calling again: still deleted)
  POST /users      → creates ANOTHER user each time (NOT idempotent!)

SAFE = doesn't change server state
  GET, HEAD, OPTIONS are safe — they only read

WHY THIS MATTERS:
  Idempotent methods can be SAFELY RETRIED on network failure
  POST cannot — retrying a payment POST might charge twice!
  This is why retry logic treats GET and POST differently
```

### HTTP Status Codes — What They Mean

```
1xx: Informational (rare in APIs)
  100 Continue         Client can proceed with request body

2xx: Success
  200 OK               Standard success (GET, PUT, PATCH, DELETE)
  201 Created          Resource created (POST) — include Location header
  204 No Content       Success, no body to return (DELETE)
  202 Accepted         Request received, processing async (background job)

3xx: Redirection
  301 Moved Permanently  URL changed forever (SEO: tells search engines)
  302 Found              Temporary redirect (login → dashboard)
  304 Not Modified       Cached version is still valid (ETag/If-Modified-Since)

4xx: Client Error (YOUR fault)
  400 Bad Request        Malformed request, validation failure
  401 Unauthorized       Not authenticated (no token, or token expired)
  403 Forbidden          Authenticated but not authorized (no permission)
  404 Not Found          Resource doesn't exist
  405 Method Not Allowed POST on a GET-only endpoint
  409 Conflict           Update conflict (optimistic locking failure)
  422 Unprocessable      Syntactically valid but semantically wrong
  429 Too Many Requests  Rate limited — slow down

5xx: Server Error (SERVER's fault)
  500 Internal Error     Unhandled exception, bug in server code
  502 Bad Gateway        Upstream server returned invalid response (nginx → app crashed)
  503 Service Unavailable Server overloaded or in maintenance
  504 Gateway Timeout    Upstream server didn't respond in time
```

### HTTP/1.1's Fatal Flaw — Head-of-Line Blocking

```
HTTP/1.1 sends requests SEQUENTIALLY on a single connection:

Client          Server
  │── GET /style.css ──────►│
  │   (wait for response)    │
  │◄── 200 OK + CSS ────────│  ← must finish before next request
  │── GET /app.js ─────────►│
  │   (wait for response)    │
  │◄── 200 OK + JS ─────────│  ← blocked behind CSS response
  │── GET /logo.png ────────►│
  │◄── 200 OK + PNG ────────│

If style.css takes 500ms, app.js and logo.png WAIT even though
the server could send them simultaneously.

WORKAROUND: browsers open 6 parallel TCP connections per domain
  Connection 1: GET /style.css
  Connection 2: GET /app.js
  Connection 3: GET /logo.png
  
  But each connection: TCP handshake + TLS handshake = 2-3 RTTs overhead
  And 6 connections × per domain = lots of sockets, server memory, slow start
  
  Hacks: domain sharding (img1.example.com, img2.example.com)
         sprite sheets, CSS bundling, JS concatenation
         → all of these are workarounds for HTTP/1.1's limitation
```

---

## 2. HTTP/2 — Multiplexing and Binary Framing

### Why HTTP/2 Exists

HTTP/2 (2015) was created specifically to solve HTTP/1.1's head-of-line blocking. Its key innovation: **multiplexing** — multiple requests and responses flow simultaneously over a SINGLE TCP connection, interleaved as binary frames. No more waiting for one request to finish before sending the next.

### How HTTP/2 Works

```
HTTP/1.1: Text-based, sequential
  "GET /style.css HTTP/1.1\r\nHost: example.com\r\n\r\n"
  → entire response must complete before next request starts

HTTP/2: Binary-framed, multiplexed
  Single TCP connection carries MULTIPLE "streams" simultaneously
  Each stream = one request-response pair
  Data is split into small FRAMES that are interleaved:

  Connection (one TCP socket):
  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
  │ CSS  │ JS   │ CSS  │ PNG  │ JS   │ CSS  │ PNG  │
  │frame1│frame1│frame2│frame1│frame2│frame3│frame2│
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘
   Stream 1  Stream 2  Stream 1  Stream 3  ...

  All three resources download SIMULTANEOUSLY on ONE connection.
  No head-of-line blocking at the HTTP level.
  No need for 6 parallel connections.
  No need for domain sharding, sprite sheets, or bundling hacks.
```

### HTTP/2 Key Features

```
1. MULTIPLEXING
   Multiple requests in parallel on one connection
   → fewer TCP connections, faster page loads

2. HEADER COMPRESSION (HPACK)
   HTTP/1.1 sends full headers with EVERY request (often 500-800 bytes)
   HTTP/2 compresses headers using a shared dictionary
   Repeated headers (Host, Cookie, User-Agent) sent as tiny references
   → 80-90% header size reduction

3. STREAM PRIORITIZATION
   Client can indicate which resources are more important
   Server delivers critical CSS/JS before less important images
   → faster perceived page load

4. SERVER PUSH (rarely used in practice)
   Server proactively sends resources before client requests them
   Example: client requests index.html → server pushes style.css automatically
   → mostly abandoned because caching interactions are complex

5. BINARY PROTOCOL
   HTTP/1.1 is text (easy to read with telnet)
   HTTP/2 is binary (more efficient to parse, less error-prone)
   → you can't manually type HTTP/2 requests, but tools handle this
```

### HTTP/2's Remaining Problem — TCP Head-of-Line Blocking

```
HTTP/2 solved HTTP-level HOL blocking but introduced TCP-level HOL blocking:

If a TCP packet is lost, ALL streams on that connection stall
until the lost packet is retransmitted and received.

Stream 1 (CSS): frames [1] [2] [3]
Stream 2 (JS):  frames [1] [2] [3]
Stream 3 (PNG): frames [1] [2]

If Stream 2, frame 1's TCP segment is lost:
  TCP retransmits it. Meanwhile, Stream 1 and Stream 3
  have all their data ready but TCP won't deliver them
  (TCP guarantees ordering — it holds back ALL data until the gap is filled).

On lossy networks (mobile, Wi-Fi): HTTP/2 can be SLOWER than HTTP/1.1
  because HTTP/1.1's 6 connections means one lost packet affects only 1/6 of streams.

This is why HTTP/3 was created.
```

---

## 3. HTTP/3 and QUIC — UDP to the Rescue

HTTP/3 (2022) replaces TCP with **QUIC** — a transport protocol built on UDP that provides TCP's reliability WITHOUT TCP's head-of-line blocking. Each QUIC stream is independently reliable: a lost packet on one stream doesn't block other streams.

```
HTTP/1.1:  HTTP over TCP
HTTP/2:    HTTP over TCP (multiplexed, but TCP HOL blocking)
HTTP/3:    HTTP over QUIC over UDP (multiplexed, NO HOL blocking)

QUIC advantages:
  1. NO head-of-line blocking between streams
     Lost packet on stream 2 → only stream 2 waits. Streams 1, 3 continue.

  2. FASTER connection setup
     TCP + TLS = 2-3 RTTs before data
     QUIC: 1 RTT (TLS baked into the protocol)
     0-RTT for resumed connections (returning visitors)

  3. CONNECTION MIGRATION
     TCP connection = (src IP, src port, dst IP, dst port)
     If your phone switches from Wi-Fi to cellular: IP changes → TCP breaks → reconnect
     QUIC uses a CONNECTION ID instead of IP tuple
     Switch networks → same QUIC connection continues seamlessly

  4. IMPROVED congestion control
     QUIC implements congestion control at the application level
     Can be updated independently of the OS kernel
     Currently uses Cubic or BBR algorithms
```

### When to Use Which HTTP Version

```
Version    Best For                            Trade-off
──────────────────────────────────────────────────────────────
HTTP/1.1   Simple APIs, legacy systems,         HOL blocking, 6 connections
           clients that don't support H2
           
HTTP/2     Web apps, REST APIs, most use cases  TCP HOL blocking on lossy networks
           Default choice for new services
           
HTTP/3     Mobile apps, lossy networks,         Newer, less tooling support
           global users, latency-sensitive       UDP may be blocked by firewalls
```

---

## 4. TLS/HTTPS — Why Security Is Non-Negotiable

### What TLS Does

TLS (Transport Layer Security) provides three guarantees:
1. **Confidentiality:** Data is encrypted — nobody between client and server can read it
2. **Integrity:** Data can't be modified in transit without detection
3. **Authentication:** The server is who it claims to be (verified by certificates)

Without TLS: anyone on the same Wi-Fi network can read your passwords, API tokens, and personal data. ISPs can inject ads into your pages. Governments can modify content. Coffee shop hackers can steal session cookies.

### The TLS 1.3 Handshake — Step by Step

```
Client                                          Server
  │                                                │
  │── ClientHello ────────────────────────────────►│
  │   Supported TLS versions: [1.3]                │
  │   Supported cipher suites: [AES_256_GCM, ...]  │
  │   Key share: (client's DH public key)          │
  │   SNI: api.example.com                         │
  │                                                │
  │◄── ServerHello + EncryptedExtensions ──────────│
  │   Chosen cipher: AES_256_GCM_SHA384            │
  │   Key share: (server's DH public key)          │
  │   Certificate: (server's X.509 cert)           │
  │   CertificateVerify: (signature proving key)   │
  │   Finished: (HMAC of handshake transcript)     │
  │                                                │
  │  ← Both derive shared secret from DH exchange → │
  │  ← ALL subsequent data is encrypted →           │
  │                                                │
  │── Finished ────────────────────────────────────►│
  │   (HMAC proving client has the shared secret)   │
  │                                                │
  │── Encrypted Application Data ──────────────────►│
  │◄── Encrypted Application Data ─────────────────│

TLS 1.3: 1 RTT to establish encrypted connection
TLS 1.2: 2 RTTs (extra round-trip for key exchange)
0-RTT (session resumption): client sends data WITH ClientHello
  using a pre-shared key from a previous session
  → data arrives on FIRST packet (but vulnerable to replay attacks)
```

### Certificates — The Trust Chain

```
How your browser trusts a server:

1. Server presents its certificate:
   Subject: api.example.com
   Issued by: Let's Encrypt Authority X3
   Valid: 2025-01-01 to 2025-04-01
   Public key: (RSA 2048 or ECDSA P-256)

2. Browser checks: is the issuer trusted?
   Let's Encrypt Authority X3 is signed by → ISRG Root X1
   ISRG Root X1 is in the browser's TRUST STORE (pre-installed root CAs)
   → chain is complete: server cert → intermediate CA → trusted root CA

3. Browser checks: is the certificate valid for this domain?
   Subject Alternative Names include: api.example.com ✓

4. Browser checks: is the certificate expired? Revoked?
   Valid dates ✓, OCSP/CRL check ✓

5. TLS handshake proves the server has the PRIVATE KEY
   matching the certificate's PUBLIC KEY
   → the server IS who the certificate says it is

MUTUAL TLS (mTLS):
  Normal TLS: only the SERVER presents a certificate
  mTLS: BOTH client and server present certificates
  Used in: microservice-to-microservice communication (zero-trust networks)
  Kubernetes: Istio/Linkerd service mesh uses mTLS automatically
```

---

## 5. REST API Design — Best Practices

### What REST Really Is

REST (Representational State Transfer) is an architectural style, not a protocol. A REST API models your domain as **resources** (nouns) and uses HTTP methods (verbs) to operate on them. The key constraints: stateless (each request contains everything needed), uniform interface (consistent URL patterns), and resource-based (URLs identify resources, not actions).

### URL Design — Resources, Not Actions

```
GOOD (resource-oriented):
  GET    /users              → list users
  GET    /users/42           → get user 42
  POST   /users              → create user
  PUT    /users/42           → replace user 42
  PATCH  /users/42           → update user 42 partially
  DELETE /users/42           → delete user 42
  GET    /users/42/orders    → list user 42's orders
  POST   /users/42/orders    → create order for user 42

BAD (action-oriented):
  POST /getUser              → don't use POST for retrieval
  POST /createUser           → the method IS the verb
  GET  /deleteUser?id=42     → GET must not have side effects
  POST /user/42/activate     → PATCH /users/42 with {"active": true}

COLLECTIONS vs ITEMS:
  /users        → collection (plural noun)
  /users/42     → item (specific resource)
  /users/42/orders → nested collection (user 42's orders)
  
FILTERING, SORTING, PAGINATION:
  GET /users?status=active&sort=name&order=asc&page=2&limit=20
  
  Return pagination metadata:
  {
    "data": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
```

### API Versioning — When and How

```
STRATEGY 1: URL versioning (most common, easiest)
  GET /v1/users
  GET /v2/users
  Pros: explicit, easy to route, easy to deprecate
  Cons: URL pollution, hard to share code between versions
  Used by: Twitter, GitHub, Stripe

STRATEGY 2: Header versioning
  GET /users
  Accept: application/vnd.myapi.v2+json
  Pros: clean URLs
  Cons: harder to test (need custom headers), less discoverable
  Used by: GitHub (also supports URL versioning)

STRATEGY 3: Query parameter
  GET /users?version=2
  Pros: easy to implement, easy to test
  Cons: messy, version is not part of the resource identity

RECOMMENDATION: Start with URL versioning (/v1/). It's the simplest,
most widely understood, and easiest to manage. Only change if you have
a specific reason.
```

---

## 6. WebSocket — Real-Time Bidirectional Communication

### When REST Isn't Enough

REST is request-response: the client asks, the server answers. But what about: chat messages that arrive without the client asking? Stock prices that update every millisecond? Collaborative editing where changes appear in real-time? Notifications that push to the client immediately?

These use cases need **server-initiated** communication. WebSocket provides a persistent, bidirectional connection where both client and server can send messages at any time.

### How WebSocket Works

```
Step 1: HTTP Upgrade Handshake (over existing HTTP connection)

  Client → Server:
    GET /chat HTTP/1.1
    Host: example.com
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
    Sec-WebSocket-Version: 13

  Server → Client:
    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

Step 2: Bidirectional Communication (binary frames, no HTTP overhead)

  Client ──── "Hello server!" ──────────► Server
  Client ◄──── "Hello client!" ────────── Server
  Client ◄──── "New message from Alice" ── Server (server-initiated!)
  Client ──── "typing..." ─────────────► Server
  Client ◄──── "Bob is typing..." ──────── Server (broadcast to other clients)

Step 3: Close (either side can initiate)
  Client ──── Close Frame ──────────────► Server
  Client ◄──── Close Frame ──────────────── Server

AFTER THE UPGRADE:
  - No HTTP headers per message (vs ~500 bytes/request for HTTP)
  - No request-response restriction (either side sends anytime)
  - Connection stays open for minutes, hours, or days
  - Frames are tiny: 2-10 bytes overhead per message
```

### WebSocket vs Alternatives — When to Use What

```
Need                              Best Choice          Why
─────────────────────────────────────────────────────────────────
Occasional data fetch             REST (HTTP)          Simple, cacheable, stateless
Real-time bidirectional           WebSocket            Low latency, server push
Server → client push (rare)       SSE (Server-Sent     Simpler than WS, auto-reconnect
                                  Events)
Microservice-to-microservice      gRPC                 Binary, typed, multiplexed
High-throughput streaming         gRPC streaming       Protobuf + HTTP/2 streams
Mobile with unreliable network    MQTT                 Lightweight, designed for IoT
```

---

## 7. gRPC — High-Performance Microservice Communication

### Why gRPC Exists

REST over HTTP/1.1 is simple but has overhead: text-based JSON (verbose, slow to parse), HTTP headers per request (500+ bytes), no streaming, and no built-in schema enforcement. For microservice-to-microservice communication where you control both ends, gRPC offers: **binary serialization** (Protocol Buffers — 3-10x smaller than JSON), **HTTP/2 multiplexing** (many calls on one connection), **streaming** (server-stream, client-stream, bidirectional), and **strong typing** (schema defined in `.proto` files, code generated for any language).

### How gRPC Works

```
1. Define service in .proto file (schema):
   service UserService {
     rpc GetUser (UserRequest) returns (UserResponse);
     rpc ListUsers (ListRequest) returns (stream UserResponse);  // server streaming
     rpc Upload (stream DataChunk) returns (UploadResult);        // client streaming
     rpc Chat (stream Message) returns (stream Message);          // bidirectional
   }

   message UserRequest {
     int64 user_id = 1;
   }

   message UserResponse {
     int64 id = 1;
     string name = 2;
     string email = 3;
   }

2. Generate code (protoc compiler):
   protoc --java_out=. --grpc-java_out=. user.proto
   → generates: UserServiceGrpc.java, UserRequest.java, UserResponse.java

3. Implement server:
   class UserServiceImpl extends UserServiceGrpc.UserServiceImplBase {
     public void getUser(UserRequest req, StreamObserver<UserResponse> observer) {
       UserResponse response = UserResponse.newBuilder()
         .setId(req.getUserId()).setName("Alice").build();
       observer.onNext(response);
       observer.onCompleted();
     }
   }

4. Client calls:
   UserResponse user = stub.getUser(
     UserRequest.newBuilder().setUserId(42).build()
   );
```

### REST vs gRPC — Decision Framework

```
Factor               REST                    gRPC
────────────────────────────────────────────────────────────
Format               JSON (text, ~3-10x)     Protobuf (binary, compact)
Transport            HTTP/1.1 or HTTP/2      HTTP/2 only
Streaming            No (SSE workaround)     Native (4 patterns)
Schema               Optional (OpenAPI)      Required (.proto)
Code generation      Optional                Built-in (any language)
Browser support      Native                  Requires grpc-web proxy
Human readable       Yes (curl-friendly)     No (binary, needs tools)
Caching              Built-in (HTTP cache)   No built-in caching
Ecosystem            Massive                 Growing

USE REST when:
  ✓ Public APIs (browser clients, third-party consumers)
  ✓ Simple CRUD operations
  ✓ You need HTTP caching
  ✓ Human readability matters (debugging with curl)
  ✓ Team is more familiar with REST

USE gRPC when:
  ✓ Internal microservice-to-microservice calls
  ✓ High throughput, low latency requirements
  ✓ Streaming data (real-time feeds, file uploads)
  ✓ Polyglot environment (Java ↔ Go ↔ Python services)
  ✓ Strong schema enforcement across teams
```

---

## 8. GraphQL — Client-Driven API Design

### What Problem GraphQL Solves

REST APIs often return too much data (overfetching) or require multiple requests to get related data (underfetching). GraphQL lets the **client specify exactly what data it needs** in a single request.

```
REST: 3 requests, with overfetching
  GET /users/42              → {id, name, email, phone, address, bio, avatar, ...}
  GET /users/42/posts        → [{id, title, body, created, updated, ...}, ...]
  GET /users/42/followers    → [{id, name, avatar, bio, ...}, ...]
  Problem: you only needed name, post titles, and follower count
  
GraphQL: 1 request, exact data
  query {
    user(id: 42) {
      name
      posts { title }
      followers { count }
    }
  }
  Response: exactly what you asked for, nothing more
```

### When to Use GraphQL vs REST

```
USE GraphQL when:
  ✓ Multiple clients need different views of the same data (mobile vs web)
  ✓ Frontend team wants autonomy to fetch exactly what they need
  ✓ Complex, deeply nested data relationships
  ✓ You're building a BFF (Backend for Frontend) layer
  
USE REST when:
  ✓ Simple CRUD (GraphQL adds complexity for no benefit)
  ✓ File uploads (GraphQL's support for files is awkward)
  ✓ Caching matters (REST has HTTP caching; GraphQL doesn't)
  ✓ Public APIs (REST is universally understood; GraphQL has a learning curve)
  ✓ Team doesn't want to learn a new paradigm

GRAPHQL PITFALLS:
  - N+1 queries: naive resolvers hit the DB once per field per object
    → fix with DataLoader (batching and caching)
  - No HTTP caching: every query is a POST → CDN can't cache
  - Complexity: schema management, resolver code, query cost analysis
  - Security: malicious clients can request deeply nested data → DoS
    → fix with query depth limits and query cost analysis
```

---

## 9. API Gateway — The Front Door to Your Services

An API Gateway sits between clients and your backend services. It handles cross-cutting concerns so your services don't have to.

```
What an API Gateway does:
  ┌──────────┐
  │  Client   │
  └─────┬────┘
        │
  ┌─────▼────────────────┐
  │     API Gateway       │
  │  ┌─────────────────┐ │
  │  │ Authentication  │ │  Verify tokens, reject unauthorized requests
  │  │ Rate Limiting   │ │  Throttle excessive requests (429 Too Many)
  │  │ Request Routing │ │  /users → User Service, /orders → Order Service
  │  │ Load Balancing  │ │  Distribute across service instances
  │  │ TLS Termination │ │  Handle HTTPS, forward HTTP internally
  │  │ Caching         │ │  Cache GET responses at the edge
  │  │ Logging/Metrics │ │  Request logging, latency tracking
  │  │ Transformation  │ │  Translate protocols, aggregate responses
  │  └─────────────────┘ │
  └──┬────────┬──────┬───┘
     │        │      │
  ┌──▼──┐ ┌──▼──┐ ┌─▼────┐
  │User │ │Order│ │Payment│
  │Svc  │ │Svc  │ │Svc   │
  └─────┘ └─────┘ └──────┘

Popular API Gateways:
  Kong: open-source, Lua plugins, battle-tested
  AWS API Gateway: managed, Lambda integration, pay-per-request
  NGINX: high-performance reverse proxy, widely used
  Envoy: service mesh sidecar, gRPC-native
  Spring Cloud Gateway: Java-native, reactive
```

---

## 10. Protocol Best Practices Summary

```
RULE                                    WHY
──────────────────────────────────────────────────────────────
Use HTTPS everywhere                    Even internal services (zero trust)
Prefer HTTP/2 for new services          Multiplexing, header compression
Use REST for public APIs                Universal, cacheable, understood
Use gRPC for internal service calls     Fast, typed, streaming
Use WebSocket for real-time             Chat, live feeds, collaborative editing
Version your APIs from day one          You WILL need to change them
Use proper status codes                 Clients depend on them for error handling
Set timeouts on all HTTP clients        Don't wait forever for dead services
Enable keep-alive / connection reuse    TCP + TLS handshake is expensive
Compress responses (gzip/brotli)        50-80% size reduction for text
Use pagination for list endpoints       Don't return 10 million records
Include request IDs for tracing         Correlate logs across services
```

---

---

## 11. Server-Sent Events (SSE) — The Simpler Alternative to WebSocket

Many developers reach for WebSocket when they only need server-to-client push. SSE is simpler, built on plain HTTP, and automatically handles reconnection.

```
SSE vs WebSocket:
  SSE:       Server → Client only (one-directional)
             Built on regular HTTP (works through proxies, CDNs, firewalls)
             Auto-reconnect (browser handles it)
             Text-only (UTF-8)
             
  WebSocket: Bidirectional (both sides send anytime)
             Custom protocol (upgrade from HTTP)
             Manual reconnect logic needed
             Binary and text
             
USE SSE when:
  ✓ Server pushes updates to client (stock prices, notifications, live scores)
  ✓ Client doesn't need to send data back (or uses REST for that)
  ✓ You want simplicity (no WebSocket library needed — works with EventSource API)
  
USE WebSocket when:
  ✓ Both sides need to send data (chat, collaborative editing, gaming)
  ✓ Binary data transfer needed
  ✓ Very low latency bidirectional communication
```

---

## 12. Real-World API Design — Lessons from Production

### How Stripe Designs APIs (The Gold Standard)

```
Stripe is widely considered the best-designed API in the industry. Key principles:

1. CONSISTENT RESOURCE NAMING:
   POST /v1/customers                    → create customer
   GET  /v1/customers/cus_123            → retrieve customer
   POST /v1/customers/cus_123            → update customer
   DELETE /v1/customers/cus_123           → delete customer
   GET  /v1/customers/cus_123/charges     → list customer's charges

2. IDEMPOTENCY KEYS (for safe retries):
   POST /v1/charges
   Idempotency-Key: unique-uuid-per-request
   → if network fails and client retries, server returns same response (no double-charge)

3. EXPANDABLE RESOURCES (avoid N+1 at the API level):
   GET /v1/charges/ch_123                → { customer: "cus_456" }  (just the ID)
   GET /v1/charges/ch_123?expand=customer → { customer: { id: "cus_456", name: "Alice", ... } }
   Client controls how much data to fetch

4. PAGINATION WITH CURSORS (not page numbers):
   GET /v1/charges?limit=10&starting_after=ch_100
   → returns next 10 charges after ch_100
   Cursor-based: stable across concurrent writes (page numbers shift when data changes)

5. VERSIONED BY DATE:
   Stripe-Version: 2024-01-01
   Each API version is a snapshot of behavior on that date
   Old versions continue working indefinitely

LESSON: study Stripe's API docs (stripe.com/docs/api) for the best-in-class API design.
```

### Authentication Patterns — OAuth 2.0 and JWT

```
MOST COMMON PATTERN: JWT (JSON Web Token)

  1. User logs in: POST /auth/login { username, password }
  2. Server validates → creates JWT:
     Header: { "alg": "RS256", "typ": "JWT" }
     Payload: { "sub": "user_42", "role": "admin", "exp": 1706745600 }
     Signature: RS256(header + payload, server_private_key)
  3. Server returns: { "access_token": "eyJhbG...", "refresh_token": "abc123" }
  4. Client includes in every request:
     Authorization: Bearer eyJhbGciOi...
  5. Server verifies signature (no database lookup needed!) and extracts user info

  Access token: short-lived (15 min - 1 hour)
  Refresh token: long-lived (days - weeks), used to get new access tokens

WHY JWT:
  Stateless: server doesn't store sessions (scales horizontally)
  Self-contained: token carries user info (no DB lookup per request)
  Verifiable: any service with the public key can verify the signature

JWT PITFALLS:
  Can't revoke a JWT before expiration (it's self-contained — no server check)
  FIX: short expiration + token blocklist for logout, or use refresh token rotation
  
  JWTs can be LARGE (1-2KB) — sent with every request
  FIX: keep payload minimal (user ID + role, not entire user profile)
```

---

## 13. Protocols in System Design Interviews

```
When the interviewer asks "how will clients communicate with your service?"

FOR MOST SYSTEMS: REST over HTTPS with JSON
  Simple, universally understood, cacheable
  "Clients hit our REST API through an API gateway over HTTPS.
   We version with /v1/ prefix. Pagination uses cursor-based approach.
   Authentication via JWT in the Authorization header."

FOR REAL-TIME: WebSocket or SSE
  "For live chat messages, we upgrade to WebSocket after initial HTTP handshake.
   Each user maintains a persistent connection to the chat server.
   For simpler one-way push (notifications), we'd use SSE."

FOR INTERNAL SERVICES: gRPC
  "Between our microservices, we use gRPC over HTTP/2.
   Protobuf schema gives us strong typing and smaller payloads.
   Bidirectional streaming for the recommendation feed."

FOR HIGH-WRITE INGESTION: Kafka producer API
  "Sensors send events to our Kafka cluster.
   We use the Kafka producer with batching for throughput.
   Schema Registry with Avro for message format evolution."

ALWAYS MENTION: timeouts, retries with backoff, circuit breakers, idempotency keys
These show you think about failure modes — which is what interviewers want.
```

---

*After this phase: you can choose between HTTP/1.1, HTTP/2, and HTTP/3 with real reasoning. You can explain TLS handshakes to a junior developer. You can design REST APIs that Stripe would approve of. You know when WebSocket, SSE, gRPC, or GraphQL is the right tool — and when it's not. You can design authentication with JWT and explain its trade-offs.*
