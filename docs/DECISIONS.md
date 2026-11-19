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
| Project setup | IN PROGRESS | Day 1 Foundations |
| Docker Compose | IMPLEMENTED | Stack configured: PostgreSQL, RabbitMQ, Redis, Prometheus, Grafana |
| Express API | IN PROGRESS | Day 1 skeleton implemented |
| TypeScript configuration | IMPLEMENTED | Shared tsconfig.base.json inherited by api and worker |
| PostgreSQL | IN PROGRESS | Container configured in Docker Compose |
| Prisma schema | NOT STARTED | |
| Authentication | NOT STARTED | |
| Job submission API | NOT STARTED | |
| Job retrieval API | NOT STARTED | |
| Transactional outbox | NOT STARTED | |
| RabbitMQ publisher | NOT STARTED | |
| RabbitMQ consumer | IMPLEMENTED | Minimal consumer with manual ack and DLQ routing |
| Redis rate limiting | NOT STARTED | |
| Redis heartbeat | IMPLEMENTED | worker:{workerId}:heartbeat with 10s TTL and 3s refresh |
| Job execution | NOT STARTED | |
| Idempotency | NOT STARTED | |
| Retry mechanism | IN PROGRESS | Topology configured with delay/retry queue |
| Dead Letter Queue | IMPLEMENTED | jobs.dlx and jobs.dlq configured and bound |
| Worker recovery | IN PROGRESS | Graceful shutdown and unacked redelivery foundations |
| Pino logging | IMPLEMENTED | Structured logger with workerId and component tagging |
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

Expected core entities:

- User
- Job
- JobAttempt
- IdempotencyRecord (or an approved equivalent)
- OutboxEvent

Record the actual approved schema here.

For every significant schema change, document:
- Model changes.
- Relationships.
- Unique constraints.
- Indexes.
- Migration name.
- Migration verification.

Never describe an expected schema as implemented before it exists.

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
| `ratelimit:{userId}` | API rate limiting | TBD | NOT STARTED |
| `worker:{workerId}:heartbeat` | Worker heartbeat and liveness tracking | 10s | IMPLEMENTED |

Document:
- Key format: `worker:{workerId}:heartbeat`
- TTL behaviour: Set to 10 seconds, refreshed every 3 seconds while worker is healthy.
- Stale worker detection: If a worker crashes or becomes partitioned, the key automatically expires after 10s, marking the worker dead.
- Atomic operations: Single `SET key value EX 10` atomic command.
- Payload: JSON with `workerId`, `status: 'alive'`, `timestamp`, `uptimeSeconds`, `concurrency`.
- Graceful exit: On controlled shutdown, the worker explicitly deletes its key (`DEL worker:{workerId}:heartbeat`).

## 11. Observability State

### Pino
- Logger configuration: Pino with `pino-pretty` in development and raw JSON in production.
- Base metadata attached automatically: `service: 'job-platform-worker'`, `workerId`.
- Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal` (default: `info`, configurable via `LOG_LEVEL`).
- Worker identification: Generated via `crypto.randomUUID()` (`worker-{uuid}`) or injected via `WORKER_ID` environment variable.
- Component correlation: Attached via `createComponentLogger(component)` (`Lifecycle`, `RabbitMQ`, `Consumer`).
- Job correlation: `jobId` and `attempt` attached to job consumption log records.

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

