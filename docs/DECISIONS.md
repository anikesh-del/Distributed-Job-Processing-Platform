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
| Project setup | NOT STARTED | |
| Docker Compose | NOT STARTED | |
| Express API | NOT STARTED | |
| TypeScript configuration | NOT STARTED | |
| PostgreSQL | NOT STARTED | |
| Prisma schema | NOT STARTED | |
| Authentication | NOT STARTED | |
| Job submission API | NOT STARTED | |
| Job retrieval API | NOT STARTED | |
| Transactional outbox | NOT STARTED | |
| RabbitMQ publisher | NOT STARTED | |
| RabbitMQ consumer | NOT STARTED | |
| Redis rate limiting | NOT STARTED | |
| Redis heartbeat | NOT STARTED | |
| Job execution | NOT STARTED | |
| Idempotency | NOT STARTED | |
| Retry mechanism | NOT STARTED | |
| Dead Letter Queue | NOT STARTED | |
| Worker recovery | NOT STARTED | |
| Pino logging | NOT STARTED | |
| Prometheus metrics | NOT STARTED | |
| Grafana dashboards | NOT STARTED | |
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
| Exchange | TBD | NOT STARTED |
| Main Queue | TBD | NOT STARTED |
| Routing Key | TBD | NOT STARTED |
| Retry Queue | TBD | NOT STARTED |
| Dead Letter Exchange | TBD | NOT STARTED |
| Dead Letter Queue | TBD | NOT STARTED |

Also document:
- Message envelope.
- Durability settings.
- Persistent delivery.
- Publisher confirmation.
- Consumer acknowledgement.
- Prefetch.
- Retry routing.
- DLQ behaviour.

## 10. Redis Configuration State

Document actual keys and their purpose.

| Key Pattern | Purpose | TTL | Status |
|---|---|---|---|
| TBD | API rate limiting | TBD | NOT STARTED |
| TBD | Worker heartbeat | TBD | NOT STARTED |

Document:
- Key format.
- TTL behaviour.
- Atomic operations.
- Failure handling.
- Stale worker detection.

## 11. Observability State

### Pino
Document actual:
- Logger configuration.
- Log levels.
- Request correlation.
- Job correlation.
- Worker identification.

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

