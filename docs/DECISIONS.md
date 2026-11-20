# Distributed Job Processing Platform — Technical Decisions

This document maintains the approved technical decisions and current implementation state of the project.

It is the shared technical reference for both developers and AI coding assistants.

## 1. Document Rules

- Only approved decisions can be recorded as final decisions.
- Proposed decisions must remain marked PROPOSED.
- Never silently change an existing decision.
- If a decision changes, preserve the previous decision and explain why it was superseded.
- Do not record assumptions as facts.
- Update this document after significant approved implementation changes.
- Both developers must coordinate before editing this shared document.
- Avoid recording ordinary function additions or minor code modifications here.

## 2. Decision Status Definitions

| Status | Meaning |
|---|---|
| PROPOSED | Suggested but not approved |
| APPROVED | Explicitly approved by a developer |
| IMPLEMENTED | Approved decision has been implemented |
| VERIFIED | Implementation and required tests have been verified |
| SUPERSEDED | Replaced by a newer approved decision |

## 3. Current Project State

Development day: NOT STARTED

Overall project status: NOT STARTED

Last updated: YYYY-MM-DD

### Subsystem Status

| Subsystem | Status | Notes |
|---|---|---|
| Project setup | IN PROGRESS | Express API, environment validation, and Prisma configured |
| Docker Compose | IMPLEMENTED | Stack configured: PostgreSQL, RabbitMQ, Redis, Prometheus, Grafana |
| Express API | IN PROGRESS | Day 1 skeleton, health endpoint, graceful shutdown |
| TypeScript configuration | IMPLEMENTED | Shared tsconfig.base.json inherited by API and worker; typecheck passing |
| PostgreSQL | IMPLEMENTED | Connected and migrated (`20261119162852_init`); Docker Compose container configured |
| Prisma schema | IMPLEMENTED | Models: User, Job, JobAttempt, IdempotencyRecord, OutboxEvent |
| Authentication | NOT STARTED | |
| Job submission API | NOT STARTED | |
| Job retrieval API | NOT STARTED | |
| Transactional outbox | NOT STARTED | |
| RabbitMQ publisher | NOT STARTED | |
| RabbitMQ consumer | IMPLEMENTED | Minimal consumer with manual ack and DLQ routing |
| Redis rate limiting | IMPLEMENTED | Sliding window algorithm using Redis sorted sets (ZSET) via atomic Lua script |
| Redis heartbeat | IMPLEMENTED | worker:{workerId}:heartbeat with 10s TTL and 3s refresh |
| Job execution | NOT STARTED | |
| Idempotency | NOT STARTED | |
| Retry mechanism | IN PROGRESS | Topology configured with delay/retry queue |
| Dead Letter Queue | IMPLEMENTED | jobs.dlx and jobs.dlq configured and bound |
| Worker recovery | IN PROGRESS | Graceful shutdown and unacked redelivery foundations |
| Pino logging | IMPLEMENTED | API (X-Request-Id correlation) & Worker (workerId & component tagging) |
| Prometheus metrics | IN PROGRESS | Container & scrape config created in Docker Compose |
| Grafana dashboards | IN PROGRESS | Container & Prometheus datasource auto-provisioned |
| React dashboard | NOT STARTED | |
| k6 load tests | NOT STARTED | |
| Integration tests | NOT STARTED | |
| Failure tests | NOT STARTED | |
| Final documentation | NOT STARTED | |

Use only these statuses:

NOT STARTED, PROPOSED, IN PROGRESS, IMPLEMENTED, TESTED, COMPLETED, BLOCKED.

Do not mark a subsystem TESTED or COMPLETED without evidence.

## 4. Approved Architecture

The approved high-level architecture is:

Client
→ Express API
→ PostgreSQL transaction
→ Outbox Event
→ Outbox Publisher
→ RabbitMQ
→ Worker
→ PostgreSQL Job State Update

Supporting components:

- Redis: Rate limiting and worker heartbeat.
- Pino: Structured logging.
- Prometheus: Metrics collection.
- Grafana: Metrics visualization.
- React: Operational dashboard.
- k6: Performance testing.

Architecture changes require explicit approval.

## 5. Architecture Decision Records (ADRs)

Record important technical decisions here.

### ADR Template

#### ADR-XXX: [Decision Title]

Status: PROPOSED / APPROVED / IMPLEMENTED / VERIFIED / SUPERSEDED

Date: YYYY-MM-DD

Proposed by:

Approved by:

**Problem**

What problem are we solving?

**Decision**

What exact approach was approved?

**Reasoning**

Why was this approach selected?

**Alternatives Considered**

What other approaches were considered?

**Implementation Details**

How will this decision be implemented?

**Consequences**

What are the advantages, disadvantages and trade-offs?

**Verification**

How was the implementation tested?

**Related Files**

List relevant source files.

---

## 6. Important Technical Decisions

Add an ADR for each decision when it is discussed and approved.

Topics that require explicit design agreement include:

- Database schema and job relationships.
- Job state transitions.
- Transactional outbox implementation.
- Outbox event claiming and concurrency.
- RabbitMQ exchange and queue topology.
- Publisher confirmation behaviour.
- Consumer acknowledgement strategy.
- Retry scheduling mechanism.
- Dead-letter routing.
- Idempotency strategy.
- Worker concurrency and prefetch.
- Redis rate-limiting algorithm.
- Redis heartbeat/lease behaviour.
- Redis failure fallback.
- Authentication and API-key handling.
- Prometheus metric naming and labels.
- Frontend polling strategy.

Do not assume implementation details for these topics merely because the project scope mentions them.

## 7. Current API Contracts

Record only implemented and agreed API contracts.

| Method | Endpoint | Purpose | Status |
|---|---|---|---|
| POST | /auth/signup | User registration | NOT STARTED |
| POST | /auth/login | User login | NOT STARTED |
| POST | /jobs | Submit a job | NOT STARTED |
| GET | /jobs | Retrieve jobs | NOT STARTED |
| GET | /jobs/:id | Retrieve a job | NOT STARTED |
| GET | /jobs/:id/attempts | Retrieve attempts | NOT STARTED |

For each implemented endpoint, document:
- Authentication requirement.
- Request body.
- Headers.
- Validation rules.
- Successful response.
- Error responses.
- Relevant tests.

## 8. Database Schema State

### Migration: `20261119162852_init`
- **Status:** IMPLEMENTED & VERIFIED
- **Date:** 2026-11-19
- **Database:** PostgreSQL (`job_platform`)

#### Implemented Tables:
1. **`users`**
   - Fields: `id` (UUID PK), `email` (unique), `password_hash`, `api_key` (unique), `created_at`, `updated_at`.
2. **`jobs`**
   - Fields: `id` (UUID PK), `user_id` (FK -> `users.id`), `type`, `payload` (JSONB), `status` (`JobStatus` enum), `priority`, `max_retries`, `retry_count`, `idempotency_key` (unique), `created_at`, `updated_at`.
   - Indexes: `status`, `user_id`.
3. **`job_attempts`**
   - Fields: `id` (UUID PK), `job_id` (FK -> `jobs.id`), `attempt_num`, `status` (`JobStatus` enum), `error`, `started_at`, `finished_at`.
   - Indexes: `job_id`.
4. **`idempotency_records`**
   - Fields: `id` (UUID PK), `idempotency_key` (unique), `response_status`, `response_body` (JSONB), `created_at`, `expires_at`.
   - Indexes: `idempotency_key`.
5. **`outbox_events`**
   - Fields: `id` (UUID PK), `job_id` (FK -> `jobs.id`), `event_type`, `payload` (JSONB), `status` (`OutboxStatus` enum), `retry_count`, `created_at`, `published_at`.
   - Indexes: `status`.

## 9. RabbitMQ Configuration State

Record actual approved configuration:

| Component | Name | Status |
|---|---|---|
| Exchange | `jobs.exchange` | IMPLEMENTED |
| Main Queue | `jobs.main` | IMPLEMENTED |
| Routing Key | `jobs.dispatch` | IMPLEMENTED |
| Retry Queue | `jobs.retry` | IMPLEMENTED |
| Retry Exchange | `jobs.retry.exchange` | IMPLEMENTED |
| Retry Routing Key | `jobs.retry` | IMPLEMENTED |
| Dead Letter Exchange | `jobs.dlx` | IMPLEMENTED |
| Dead Letter Queue | `jobs.dlq` | IMPLEMENTED |
| Dead Letter Routing Key | `jobs.dead` | IMPLEMENTED |

Also document:
- Message envelope: JSON payload with `jobId`, `type`, `payload`, `attempt`, `createdAt`.
- Durability settings: All exchanges and queues set to `{ durable: true }`.
- Persistent delivery: Messages published with `persistent: true` (deliveryMode: 2).
- Publisher confirmation: Used by Outbox Publisher before marking events as published.
- Consumer acknowledgement: Manual acknowledgements (`ch.ack`) only after durable DB persistence.
- Prefetch: Matches worker concurrency (`ch.prefetch(prefetchCount)`).
- Retry routing: Messages routed to `jobs.retry.exchange` / `jobs.retry` with TTL; on expiry, RabbitMQ auto dead-letters them back to `jobs.exchange` / `jobs.dispatch`.
- DLQ behaviour: Poison pills or exhausted retries routed to `jobs.dlx` / `jobs.dlq` via `jobs.dead`.

## 10. Redis Configuration State

Document actual keys and their purpose.

| Key Pattern | Purpose | TTL | Status |
|---|---|---|---|
| `ratelimit:{identifier}` | API rate limiting (Sliding window ZSET) | Window duration (`PEXPIRE windowMs`) | IMPLEMENTED |
| `worker:{workerId}:heartbeat` | Worker heartbeat and liveness tracking | 10s | IMPLEMENTED |

Document:
- Key format:
  - `ratelimit:{identifier}`: API rate limiting where identifier is IP address (or future `userId`/`apiKey`).
  - `worker:{workerId}:heartbeat`: Worker liveness tracking.
- Rate limiting algorithm: Sliding window counter using Redis sorted sets (`ZSET`) and an atomic Lua script (`SLIDING_WINDOW_LUA`).
  - Score: Unix timestamp in milliseconds (`now`).
  - Member: `${now}:${uuid}` token to ensure unique entries.
  - Step 1: `ZREMRANGEBYSCORE key -inf (now - windowMs)` removes expired requests outside the window.
  - Step 2: `ZCARD key` retrieves the current request count.
  - Step 3: If `count < maxLimit`, `ZADD key now member` and `PEXPIRE key windowMs` registers the request and refreshes key TTL.
  - Step 4: If limit exceeded, calculates `Retry-After` using `ZRANGE key 0 0 WITHSCORES` (time until oldest request slides out).
  - Failure Fallback: Fails open if Redis is down, logging a warning and returning `allowed: true` so a Redis failure does not bring down the entire API.
- Heartbeat behaviour:
  - Set to 10 seconds, refreshed every 3 seconds while worker is healthy.
  - Stale worker detection: If a worker crashes or becomes partitioned, the key automatically expires after 10s, marking the worker dead.
  - Atomic operations: Single `SET key value EX 10` atomic command.
  - Payload: JSON with `workerId`, `status: 'alive'`, `timestamp`, `uptimeSeconds`, `concurrency`.
  - Graceful exit: On controlled shutdown, the worker explicitly deletes its key (`DEL worker:{workerId}:heartbeat`).

## 11. Observability State

### Pino
- **API Logger Configuration:** [api/src/config/logger.ts](file:///c:/Users/user/OneDrive/Desktop/Distributed%20Job%20Processing/api/src/config/logger.ts) with ISO timestamps, service identification (`service: job-platform-api`), environment tagging, and `pino-pretty` formatting for local development. In production, outputs high-performance structured JSON.
- **Worker Logger Configuration:** [worker/src/logger/logger.ts](file:///c:/Users/user/OneDrive/Desktop/Distributed%20Job%20Processing/worker/src/logger/logger.ts) with base metadata (`service: job-platform-worker`, `workerId`). Component loggers created via `createComponentLogger(component)` (`Lifecycle`, `RabbitMQ`, `Consumer`, `Heartbeat`).
- **Log Levels:** Configurable via `LOG_LEVEL` environment variable (`trace`, `debug`, `info`, `warn`, `error`, `fatal`), defaults to `info`.
- **Request Correlation:** Handled by [api/src/middlewares/request-logger.middleware.ts](file:///c:/Users/user/OneDrive/Desktop/Distributed%20Job%20Processing/api/src/middlewares/request-logger.middleware.ts). Reuses client-provided `X-Request-Id` or generates a UUID v4. Attaches `req.id`, sets `X-Request-Id` response header, and injects a child logger `req.log` with `{ requestId }` bound to every log entry for the lifecycle of that request.
- **Job Correlation:** `jobId` and `attempt` attached to job consumption and outbox log records.

### Prometheus
Document actual metric names, types and labels.

| Metric | Type | Purpose | Status |
|---|---|---|---|
| TBD | Counter | API requests | NOT STARTED |
| TBD | Histogram | API latency | NOT STARTED |
| TBD | Counter | Jobs completed | NOT STARTED |
| TBD | Gauge | Active workers | NOT STARTED |

Never use unbounded identifiers as metric labels.

### Grafana
Record:
- Dashboard names.
- Panels.
- PromQL queries.
- Data sources.

## 12. Known Issues and Limitations

Record actual known problems.

| Issue | Severity | Owner | Status |
|---|---|---|---|
| None recorded yet | - | - | - |

## 13. Latest Verified System State

Last verified date:

Development day:

What currently works:

What does not work:

Tests executed:

Outstanding issues:

Latest integrated commit:

Only include facts verified against the current integrated codebase.

## 14. Change History

| Date | Decision ID / Change | Description | Approved By |
|---|---|---|---|
| YYYY-MM-DD | Initial setup | Created technical decision document | Both developers |

