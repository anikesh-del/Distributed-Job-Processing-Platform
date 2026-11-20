# Developer 1 — Engineering Log

## 1. Developer Information

Developer: Developer 1

Project: Distributed Job Processing Platform

Primary ownership:
- API development.
- PostgreSQL and Prisma.
- Transactional outbox.
- Redis rate limiting.
- API observability.
- API performance testing.
- Frontend/API integration.

Important: Primary ownership does not mean exclusive ownership. Developer 1 must understand and be able to modify every subsystem.

## 2. Current Development Status

Current development day: NOT STARTED

Overall status: NOT STARTED

Last updated: YYYY-MM-DD

Current focus:

Completed tasks:

In-progress tasks:

Pending tasks:

Blocked tasks:

## 3. Daily Implementation Log

Use this section to record every meaningful implementation task.

### Day 1 — Foundations

Status: IN PROGRESS

#### Tasks

- [x] Create Express + TypeScript API skeleton.
- [x] Configure environment validation.
- [x] Configure Prisma.
- [x] Connect PostgreSQL.
- [x] Define initial database models.
- [x] Implement Pino request logging middleware.
- [x] Implement Redis rate-limiter proof of concept.
- [x] Verify API health endpoint.
- [x] Test Redis increment and TTL behaviour.

#### Implementation Record

Features implemented:
- Strict environment variable schema validation using Zod (`api/src/config/env.ts`) ensuring PORT, NODE_ENV, DATABASE_URL, and REDIS_URL are valid on startup.
- Prisma ORM initialization and schema definition (`api/prisma/schema.prisma`) with models: `User`, `Job`, `JobAttempt`, `IdempotencyRecord`, `OutboxEvent`.
- Singleton Prisma client wrapper with connection management (`connectDatabase`, `disconnectDatabase` in `api/src/config/prisma.ts`).
- Server graceful shutdown integration with Prisma and Redis disconnect in `api/src/index.ts`.
- Pino structured request logging middleware with automatic `X-Request-Id` correlation, request timing, status-aware log levels, and error handling.
- Redis connection singleton (`api/src/config/redis.ts`) with retry strategy and lifecycle logging.
- Atomic Redis sliding window rate limiter service (`api/src/services/rate-limiter.service.ts`) using sorted sets (`ZSET`) and Lua script (`SLIDING_WINDOW_LUA`).
- Express rate-limiter middleware (`api/src/middlewares/rate-limiter.middleware.ts`) injecting `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers.
- Comprehensive proof-of-concept verification script (`api/src/services/verify-rate-limiter.poc.ts`).
- Multi-dependency health probe in `/health` checking both PostgreSQL and Redis connectivity.

Files created:
- `api/prisma/schema.prisma`
- `api/src/config/prisma.ts`
- `api/src/config/logger.ts`
- `api/src/config/redis.ts`
- `api/src/types/express.d.ts`
- `api/src/middlewares/request-logger.middleware.ts`
- `api/src/middlewares/rate-limiter.middleware.ts`
- `api/src/services/rate-limiter.service.ts`
- `api/src/services/verify-rate-limiter.poc.ts`

Files modified:
- `api/src/config/env.ts`
- `api/src/index.ts`
- `api/src/app.ts`
- `api/src/routes/health.route.ts`
- `api/src/middlewares/error.middleware.ts`
- `api/package.json`
- `api/.env`
- `api/.env.example`
- `docs/DECISIONS.md`

Important functions:
- `connectDatabase()`: tests PostgreSQL connection via Prisma `$connect()`.
- `disconnectDatabase()`: gracefully closes Prisma connection on SIGINT/SIGTERM.
- `envSchema.safeParse()`: validates and formats runtime environment variables at boot.

Technical concepts learned:
- Fail-fast configuration pattern using Zod schemas at application entry.
- Safe singleton pattern for PrismaClient in development to prevent connection pooling exhaustion during hot reloads.
- Graceful shutdown lifecycle: draining incoming HTTP requests, then disconnecting database clients cleanly before process exit.

Tests executed:
- `npm run typecheck` (`tsc --noEmit`): Clean type verification.
- `npm run build` (`tsc`): Clean compilation to `dist/`.

Actual test results:
- All TypeScript types and Prisma generated clients compiled without error.

Bugs encountered:
- Node v24 ESM loader issues when invoking experimental `prisma` CLI; solved by pinning stable Prisma ORM v6 (`@prisma/client@^6` and `prisma@^6`).

Fixes applied:
- Replaced experimental CLI with stable `@prisma/client@^6` and generated the client successfully.

Remaining work:
- Run PostgreSQL via Docker Compose or local instance and verify active connection.
- Implement Pino request logging middleware.
- Implement Redis rate-limiter proof of concept.

---

### Day 2 — API and Job Submission

Status: NOT STARTED

#### Tasks

- [ ] Implement JWT signup/login.
- [ ] Implement API-key authentication.
- [ ] Implement Zod validation.
- [ ] Implement POST /jobs.
- [ ] Persist Job and OutboxEvent atomically.
- [ ] Implement GET /jobs.
- [ ] Implement GET /jobs/:id.
- [ ] Complete Redis rate limiter.
- [ ] Implement outbox event polling/claiming.
- [ ] Implement RabbitMQ publishing.
- [ ] Implement publisher confirms.
- [ ] Verify end-to-end job submission.

#### Implementation Record

Features implemented:

Files created:

Files modified:

Important functions:

Technical concepts learned:

Tests executed:

Actual test results:

Bugs encountered:

Fixes applied:

Remaining work:

---

### Day 3 — Reliability

Status: NOT STARTED

#### Tasks

- [ ] Implement idempotency.
- [ ] Add database uniqueness constraints.
- [ ] Implement job attempt persistence.
- [ ] Implement job state transition handling.
- [ ] Implement retry scheduling policy.
- [ ] Implement exponential backoff.
- [ ] Test duplicate submissions.
- [ ] Test invalid payloads.
- [ ] Test retry behaviour.

#### Implementation Record

Features implemented:

Files created:

Files modified:

Important functions:

Technical concepts learned:

Tests executed:

Actual test results:

Bugs encountered:

Fixes applied:

Remaining work:

---

### Day 4 — Observability and Frontend

Status: NOT STARTED

#### Tasks

- [ ] Instrument API using Prometheus.
- [ ] Implement HTTP request counter.
- [ ] Implement request duration histogram.
- [ ] Implement jobs accepted counter.
- [ ] Implement idempotency hit counter.
- [ ] Implement rate-limit rejection counter.
- [ ] Build React dashboard.
- [ ] Implement job overview.
- [ ] Implement job listing.
- [ ] Implement job details.
- [ ] Implement attempt history.
- [ ] Create API Grafana dashboard panels.

#### Implementation Record

Features implemented:

Files created:

Files modified:

Important functions:

Metrics added:

Grafana panels added:

Technical concepts learned:

Tests executed:

Actual test results:

Bugs encountered:

Fixes applied:

Remaining work:

---

### Day 5 — Verification and Benchmarking

Status: NOT STARTED

#### Tasks

- [ ] Run API unit tests.
- [ ] Run API integration tests.
- [ ] Run k6 submission tests.
- [ ] Measure API p50/p95/p99 latency.
- [ ] Measure API request throughput.
- [ ] Measure accepted jobs per second.
- [ ] Verify outbox consistency.
- [ ] Test publisher restart.
- [ ] Verify Docker configuration.
- [ ] Document API setup and usage.
- [ ] Contribute to BENCHMARK_RESULTS.md.

#### Benchmark Record

Hardware:

Operating system:

Docker resource limits:

k6 configuration:

Virtual users / request rate:

Test duration:

Jobs submitted:

Successful requests:

Failed requests:

p50 latency:

p95 latency:

p99 latency:

Jobs accepted per second:

Number of trials:

Median result:

Observations:

Limitations:

---

## 4. Feature-Level Engineering Records

Use this template whenever a new feature is implemented.

### Feature: [Feature Name]

Date:

Development day:

Status: PROPOSED / APPROVED / IMPLEMENTED / TESTED / COMPLETED

**Requirement**

What problem does this feature solve?

**Approved Behaviour**

What exact behaviour was approved by the developer?

**Implementation**

How was the feature implemented?

**Files Created**

List all new files.

**Files Modified**

List all modified files.

**Important Functions**

For every important function, document:
- Function name.
- Responsibility.
- Inputs.
- Outputs.
- Important logic.
- Error handling.

**Tests**

What tests were executed?

**Test Results**

Record actual results, not assumed results.

**Problems Encountered**

Document bugs and unexpected behaviour.

**Fixes Applied**

Document how problems were resolved.

**Learning**

What technical concepts were learned?

**Remaining Work**

What is incomplete?

---

## 5. Technical Learning Record

Track understanding of important technologies.

| Technology | Hands-on implementation | Testing | Can explain independently |
|---|---|---|---|
| Node.js | PENDING | PENDING | PENDING |
| TypeScript | PENDING | PENDING | PENDING |
| Express | PENDING | PENDING | PENDING |
| PostgreSQL | PENDING | PENDING | PENDING |
| Prisma | PENDING | PENDING | PENDING |
| RabbitMQ | PENDING | PENDING | PENDING |
| Redis | PENDING | PENDING | PENDING |
| Pino | PENDING | PENDING | PENDING |
| Prometheus | PENDING | PENDING | PENDING |
| Grafana | PENDING | PENDING | PENDING |
| React | PENDING | PENDING | PENDING |
| Docker | PENDING | PENDING | PENDING |
| k6 | PENDING | PENDING | PENDING |

A technology is considered learned only after practical implementation, runtime inspection, testing and independent explanation.

---

## 6. Cross-Developer Learning

Record concepts learned from Developer 2.

| Date | Technology / Concept | What I learned |
|---|---|---|
| | | |

Record modifications made to Developer 2's components.

| Date | Component | Modification | Verified |
|---|---|---|---|
| | | | |

---

## 7. Git and Integration History

| Date | Branch | Commit / PR | Description | Status |
|---|---|---|---|---|
| | | | | |

Record integration issues and their resolution.

---

## 8. Current Handover State

Update this section before ending a development session.

**What I completed:**

**What currently works:**

**What I am working on:**

**What remains:**

**Known bugs:**

**Files currently being modified:**

**Latest commit:**

**Next recommended task:**

This section must reflect the actual current implementation, not the original plan.