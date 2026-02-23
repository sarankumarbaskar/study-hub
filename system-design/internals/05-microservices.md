# Phase 5 — Microservices Architecture: Building Distributed Systems

> The question isn't "should we use microservices?" It's "do we have the problems that microservices solve, and can we afford the problems they create?"

Microservices architecture splits a monolithic application into independently deployable services, each owning a specific business capability. The promise is: independent deployment, technology diversity, independent scaling, and team autonomy. The reality is: distributed systems are hard — you trade the complexity of a large codebase for the complexity of a distributed network of services that can fail in hundreds of new ways.

This phase gives you the honest trade-offs, the patterns that make microservices work, and the tools for handling the failure modes that come with distribution.

---

## 1. Monolith vs Microservices — The Honest Truth

### When Monolith Is Better (More Often Than You Think)

```
MONOLITH ADVANTAGES:
  Simple to develop:     one codebase, one IDE, one debug session
  Simple to deploy:      one artifact, one deploy pipeline
  Simple to test:        one test suite, no service mocking
  Simple to debug:       one log file, stack traces work, step-through debugging
  No network overhead:   method calls, not HTTP/gRPC calls
  Strong consistency:    single database, ACID transactions
  Easy refactoring:      rename a class → IDE updates all references
  
  A well-structured monolith with clear module boundaries can scale
  to millions of users. GitHub ran on a Rails monolith for YEARS.
  Shopify runs on a monolith. Stack Overflow runs on a monolith.

MICROSERVICE ADVANTAGES:
  Independent deployment: deploy UserService without touching OrderService
  Independent scaling:    scale PaymentService to 50 instances during Black Friday
  Technology diversity:   ML team uses Python, backend uses Java, search uses Go
  Team autonomy:          each team owns their service end-to-end
  Fault isolation:        if RecommendationService crashes, checkout still works
  
  But ONLY if your organization actually needs these advantages.

THE DECISION:
  Start with a monolith. Split into microservices WHEN:
  ✓ Different parts need different scaling (compute-heavy vs I/O-heavy)
  ✓ Teams are stepping on each other (merge conflicts, deployment coupling)
  ✓ Deployment of one feature blocks deployment of another
  ✓ Different parts genuinely need different technologies
  ✗ NOT because "Netflix does it" (they have 2000+ engineers)
  ✗ NOT because "microservices are modern" (complexity is not modern)
```

---

## 2. Service Communication — Sync vs Async

```
SYNCHRONOUS (REST / gRPC):
  Service A ──HTTP──► Service B ──HTTP──► Service C
  
  A waits for B, B waits for C
  If C is slow: A and B are both slow (cascading latency)
  If C is down: A fails (cascading failure)
  
  Use when: you need the response to continue (get user profile, validate payment)

ASYNCHRONOUS (Events / Message Queue):
  Service A ──publish──► Kafka ──subscribe──► Service B
                                ──subscribe──► Service C
  
  A doesn't wait for B or C
  If C is slow: A doesn't care (already returned to user)
  If C is down: message waits in queue until C recovers
  
  Use when: you don't need the response immediately (send email, update analytics)

DECISION FRAMEWORK:
  Need response to serve the user?  → Sync (REST/gRPC)
  Fire-and-forget side effects?     → Async (Kafka/RabbitMQ)
  Need data from another service?   → Sync, but with timeout + circuit breaker
  Notifying multiple services?      → Async event (pub/sub)
```

---

## 3. Service Discovery — How Services Find Each Other

In a microservices world, services are ephemeral — containers start, stop, scale up, scale down. Hardcoding IP addresses is impossible. Service discovery is the mechanism by which services find the current network location of other services.

```
CLIENT-SIDE DISCOVERY:
  Service registers itself with a registry (Consul, Eureka, ZooKeeper)
  Client queries registry: "Where is UserService?" → [10.0.1.5:8080, 10.0.1.6:8080]
  Client picks one (round-robin, random, least connections)
  Client makes request directly to the chosen instance
  
  Pros: client can load-balance intelligently, no single proxy bottleneck
  Cons: client needs discovery library in every language
  Used by: Netflix Eureka + Ribbon, Consul + client library

SERVER-SIDE DISCOVERY:
  Client sends request to a load balancer or API gateway
  Gateway queries registry and routes request to an available instance
  Client doesn't know about individual instances
  
  Pros: client is simple (just call the gateway), language-agnostic
  Cons: gateway is a single point of failure/bottleneck
  Used by: Kubernetes (kube-proxy + CoreDNS), AWS ALB + ECS, Nginx + Consul

KUBERNETES DNS (most common in modern systems):
  Every Service gets a DNS name: user-service.default.svc.cluster.local
  Kubernetes DNS resolves to ClusterIP → kube-proxy routes to a healthy pod
  No external registry needed — Kubernetes IS the registry
  
  This is why "service discovery" is mostly a solved problem in Kubernetes.
```

---

## 4. API Gateway — The Front Door

```
WHY AN API GATEWAY:
  Without gateway: clients call 20 different service URLs
  With gateway: clients call ONE URL, gateway routes internally

  Client → api.example.com/users    → Gateway → UserService
  Client → api.example.com/orders   → Gateway → OrderService
  Client → api.example.com/payments → Gateway → PaymentService

WHAT THE GATEWAY HANDLES:
  Authentication:    Verify JWT tokens, reject unauthorized requests
  Rate Limiting:     100 requests/min per user (protect backend services)
  Routing:           /users → UserService, /orders → OrderService
  Load Balancing:    Distribute across multiple instances
  TLS Termination:   Handle HTTPS, forward HTTP internally
  Request Transform: Add headers, modify body, aggregate multiple service calls
  Circuit Breaking:  Stop calling a dead service
  Monitoring:        Log all requests, track latency, count errors

POPULAR OPTIONS:
  Kong:                Open-source, Lua plugins, database-backed config
  AWS API Gateway:     Managed, Lambda integration, pay-per-request
  NGINX/Envoy:         High-performance reverse proxy
  Spring Cloud Gateway: Java-native, reactive, Spring ecosystem
  Traefik:             Container-native, auto-discovery from Docker/K8s
```

---

## 5. Circuit Breaker — Preventing Cascading Failures

This is one of the most important patterns in microservices. Without it, one failing service can bring down your entire system.

```
THE PROBLEM — CASCADING FAILURE:
  UserService → PaymentService (down!)
  
  UserService keeps calling PaymentService
  Each call: 30 second timeout → thread blocked for 30s
  100 concurrent requests × 30s timeout = 100 threads blocked
  UserService thread pool exhausted → UserService ALSO goes down
  OrderService calls UserService → OrderService thread pool fills → down
  The entire system collapses because ONE service is slow.

THE SOLUTION — CIRCUIT BREAKER:
  Like an electrical circuit breaker: if too many failures, STOP trying.

  States:
    CLOSED (normal):
      All requests pass through to the downstream service
      Track failure count

    OPEN (tripped):
      After N failures (e.g., 5 in 10 seconds): OPEN the circuit
      All requests IMMEDIATELY fail with a fallback response
      No calls to the downstream service (it gets time to recover)
      Timer starts (e.g., 30 seconds)

    HALF-OPEN (testing recovery):
      After timer expires: allow ONE test request through
      If it succeeds: CLOSE circuit (service recovered!)
      If it fails: OPEN circuit again (still down)

  CLOSED ──(failures exceed threshold)──► OPEN
    ▲                                        │
    │                                    (timeout)
    │                                        ▼
    └──(test request succeeds)──── HALF-OPEN
                                        │
                                  (test fails)
                                        │
                                        ▼
                                      OPEN

IMPLEMENTATION (Resilience4j in Java):
  CircuitBreaker cb = CircuitBreaker.ofDefaults("paymentService");
  
  String result = cb.executeSupplier(() -> {
      return paymentService.charge(amount);  // may throw
  });
  
  // If circuit is OPEN: immediately throws CallNotPermittedException
  // → your code returns a FALLBACK response to the user
  // → no thread is blocked, no timeout, instant fail
  
FALLBACK STRATEGIES:
  Return cached data:     "Here's the last known price" (stale but available)
  Return default:         "Order accepted, payment pending" (async retry later)
  Return degraded:        "Feature temporarily unavailable"
  Redirect:               Route to a backup service
```

---

## 6. Distributed Tracing — Debugging Across Services

```
THE PROBLEM:
  User request → API Gateway → UserService → OrderService → PaymentService → InventoryService
  
  Request took 5 seconds. WHERE is the bottleneck?
  Each service has its own logs. Correlating across 5 services is nearly impossible.

THE SOLUTION — DISTRIBUTED TRACING:
  Assign a unique TRACE ID at the gateway
  Pass it through every service call (as an HTTP header)
  Each service records SPANS (start time, end time, service name, operation)
  Tracing backend (Jaeger/Zipkin) aggregates and visualizes

  Trace ID: abc-123
  ├── Span: Gateway (0ms - 5000ms)
  │   ├── Span: UserService.getUser (50ms - 200ms)
  │   ├── Span: OrderService.createOrder (200ms - 4800ms)    ← THE BOTTLENECK
  │   │   ├── Span: PaymentService.charge (250ms - 4700ms)   ← PAYMENT IS SLOW!
  │   │   │   └── Span: DB query (300ms - 4600ms)            ← SLOW QUERY!
  │   │   └── Span: InventoryService.reserve (4700ms - 4790ms)
  │   └── Span: Response serialization (4800ms - 4810ms)

  NOW YOU KNOW: PaymentService DB query took 4.3 seconds.
  Action: add an index, optimize the query, or add caching.

TOOLS:
  Jaeger:        CNCF project, Uber-created, Kubernetes-native
  Zipkin:        Twitter-created, battle-tested
  OpenTelemetry: CNCF standard for traces, metrics, and logs
                 Vendor-neutral SDK — works with Jaeger, Zipkin, Datadog, etc.
  
  Spring integration:
    Add spring-boot-starter-actuator + micrometer-tracing
    Trace IDs automatically propagated through RestTemplate/WebClient/Kafka
```

---

## 7. Saga Pattern — Distributed Transactions Without 2PC

### The Problem

In a monolith, a single database transaction ensures all-or-nothing:
```sql
BEGIN;
  INSERT INTO orders (...);
  UPDATE inventory SET qty = qty - 1;
  INSERT INTO payments (...);
COMMIT;  -- all succeed, or all rollback
```

In microservices, each service has its own database. There's no single transaction that spans OrderService's DB, InventoryService's DB, and PaymentService's DB. Two-Phase Commit (2PC) exists but is slow, fragile, and doesn't scale. The Saga pattern is the practical alternative.

### Two Saga Approaches

```
CHOREOGRAPHY (event-driven, decentralized):
  Each service publishes events, other services react.
  
  OrderService → "OrderCreated" event
  PaymentService hears it → charges card → "PaymentCompleted" event
  InventoryService hears it → reserves stock → "InventoryReserved" event
  OrderService hears both → marks order as confirmed
  
  If PaymentService fails → "PaymentFailed" event
  InventoryService hears it → releases reserved stock (compensating action)
  OrderService hears it → cancels order
  
  Pros: simple, decoupled, no central coordinator
  Cons: hard to track overall state, complex failure flows, debugging difficult
  Use when: few steps (2-4 services), simple failure scenarios

ORCHESTRATION (centralized coordinator):
  An OrderSaga orchestrator explicitly calls each step and handles failures.
  
  OrderSaga:
    1. Call PaymentService.charge()     → success
    2. Call InventoryService.reserve()  → success
    3. Call ShippingService.schedule()  → FAILURE!
    4. COMPENSATE: InventoryService.release()
    5. COMPENSATE: PaymentService.refund()
    6. Mark order as failed
  
  Pros: clear flow, easy to understand and debug, centralized error handling
  Cons: orchestrator is a single point of logic, coupling to orchestrator
  Use when: many steps, complex failure/retry logic, need clear visibility

COMPENSATING ACTIONS:
  Unlike ROLLBACK (undo everything atomically), compensations are explicit:
  Payment charged? → issue refund
  Inventory reserved? → release reservation
  Email sent? → can't un-send! (accept it, or send a correction)
  
  Not every action has a perfect compensation. Design for this from the start.
```

---

## 8. Microservices Best Practices

```
DESIGN:
  ✓ One service per business capability (OrderService, not OrderCreationService)
  ✓ Each service owns its database (no shared databases between services!)
  ✓ APIs as contracts (versioned, documented, backward-compatible)
  ✓ Start with a monolith, extract services when needed (not the reverse)

COMMUNICATION:
  ✓ Sync for queries ("get me this data now")
  ✓ Async for commands ("process this event eventually")
  ✓ Set timeouts on ALL sync calls (never wait forever)
  ✓ Circuit breakers on ALL external calls
  ✓ Retry with exponential backoff for transient failures

RESILIENCE:
  ✓ Design for partial failure (some services down, system still works)
  ✓ Bulkhead pattern (separate thread pools per dependency)
  ✓ Graceful degradation (show cached data when service is down)
  ✓ Health checks on every service (/health endpoint)

OBSERVABILITY:
  ✓ Distributed tracing (Jaeger/Zipkin with correlation IDs)
  ✓ Centralized logging (ELK/Loki — all service logs in one place)
  ✓ Metrics (Prometheus + Grafana — latency, error rate, throughput per service)
  ✓ Alerting on error rate, latency p99, and consumer lag

DEPLOYMENT:
  ✓ One service per repository (or clear module boundaries in monorepo)
  ✓ Independent CI/CD pipelines per service
  ✓ Blue-green or canary deployments (not big-bang)
  ✓ Feature flags for gradual rollout
```

---

---

## 9. Service Mesh — Networking for Microservices

### What a Service Mesh Is

A service mesh is a **dedicated infrastructure layer** that handles service-to-service communication. Instead of each service implementing its own retry logic, circuit breakers, TLS, and load balancing, a mesh handles all of this transparently through sidecar proxies.

```
WITHOUT SERVICE MESH:
  Every service implements: retries, timeouts, circuit breakers, mTLS, load balancing
  In every language: Java service has Resilience4j, Go service has its own retry lib
  Inconsistent: some services have circuit breakers, some don't

WITH SERVICE MESH (Istio/Linkerd):
  Every pod gets a SIDECAR PROXY (Envoy):
  
  ┌─────────────────────────────────────┐
  │ Pod                                  │
  │  ┌──────────────┐ ┌──────────────┐ │
  │  │ Your Service  │ │ Envoy Proxy  │ │
  │  │ (Java app)    │→│ (sidecar)    │→│→→→ Network
  │  │ localhost:8080 │ │ handles ALL  │ │
  │  │               │ │ networking   │ │
  │  └──────────────┘ └──────────────┘ │
  └─────────────────────────────────────┘
  
  Your service talks to localhost → Envoy intercepts ALL traffic
  Envoy handles: mTLS, retries, circuit breaking, load balancing, tracing headers
  Your code has ZERO networking logic — it just makes HTTP calls to localhost

POPULAR MESHES:
  Istio:    full-featured, complex, Envoy-based (Google/IBM)
  Linkerd:  simpler, lighter, Rust-based proxy (CNCF graduated)
  
USE WHEN:
  ✓ 10+ microservices where consistent networking policy matters
  ✓ Need mTLS everywhere without modifying application code
  ✓ Want centralized traffic management (canary deploys, traffic splitting)
  ✗ Overkill for <5 services (adds complexity and resource overhead)
```

---

## 10. The 12-Factor App — Cloud-Native Principles

These 12 principles, published by Heroku in 2012, remain the gold standard for building cloud-native applications that deploy cleanly, scale horizontally, and run in any cloud environment.

```
FACTOR                PRINCIPLE                              WHY IT MATTERS
──────────────────────────────────────────────────────────────────────────────
1.  Codebase          One codebase, many deploys             Don't copy code between environments
2.  Dependencies      Explicitly declare ALL dependencies    No "works on my machine"
3.  Config            Store config in ENVIRONMENT VARS       Not in code! Different per environment
4.  Backing services  Treat DB, cache, queue as attachable   Swap MySQL for Aurora without code change
5.  Build/Release/Run Strictly separate build from run       Same artifact everywhere
6.  Processes         Stateless, share-nothing               Any instance handles any request
7.  Port binding      Export service via port binding         Self-contained, no external web server
8.  Concurrency       Scale out via process model             Horizontal scaling, not threads
9.  Disposability     Fast startup, graceful shutdown        Handle SIGTERM, drain connections
10. Dev/Prod parity   Keep environments as similar as possible Docker makes this easy
11. Logs              Treat as event streams                  stdout → centralized logging
12. Admin processes   Run admin/migration as one-off processes Not baked into application startup

THE MOST VIOLATED: #3 (Config) and #6 (Stateless)
  Storing secrets in code → security breach
  Storing sessions in local memory → sticky sessions, can't scale
```

---

## 11. Container Orchestration Basics — Why Kubernetes Exists

```
THE PROBLEM:
  You have 50 microservices, each with 3-10 instances = 150-500 containers
  Where does each container run? What happens when one crashes?
  How does service A find service B? How do you deploy without downtime?

KUBERNETES SOLVES:
  Scheduling:     "Run 5 copies of OrderService across available machines"
  Self-healing:   "Container crashed → restart it automatically"
  Scaling:        "CPU > 80% → add more instances (auto-scale)"
  Discovery:      "OrderService → order-service.default.svc.cluster.local"
  Load balancing: "Distribute traffic across all OrderService pods"
  Rolling updates: "Deploy v2 gradually, roll back if errors spike"
  Config/Secrets:  "Inject DB credentials without baking into image"

KEY CONCEPTS (minimum you need for system design):
  Pod:         smallest deployable unit (1+ containers)
  Service:     stable DNS name + load balancing for a set of pods
  Deployment:  declares desired state (image, replicas, resources)
  Namespace:   logical isolation (dev, staging, production)
  Ingress:     external HTTP routing (api.example.com → Service)
  
  In interviews: "We'd deploy each microservice as a Kubernetes Deployment
  with a Service for internal discovery and an Ingress for external traffic.
  HPA (Horizontal Pod Autoscaler) scales based on CPU/request metrics."
```

---

*After this phase: you can make the monolith vs microservices decision with real trade-offs. You can design service communication, handle cascading failures with circuit breakers, debug across services with distributed tracing, implement distributed transactions with the saga pattern, and explain service mesh, 12-factor principles, and container orchestration.*
