# Distributed Job Processing Platform — Project Context

## 1. Project Overview

We are building a Distributed Job Processing Platform using Node.js, TypeScript, Express, PostgreSQL, RabbitMQ and Redis.

The platform allows authenticated clients to submit asynchronous jobs through an HTTP API. Jobs are persisted in PostgreSQL, published to RabbitMQ through a transactional outbox, and processed by independent worker processes.

The system supports retries, idempotency, dead-letter handling, worker recovery, structured logging, monitoring and load testing.

This is a learning-oriented engineering project designed to demonstrate practical backend engineering and distributed systems concepts.

## 2. Project Goals

The primary goals are:

- Build a reliable asynchronous job-processing system.
- Understand message brokers and asynchronous processing.
- Implement transactional outbox and at-least-once delivery.
- Handle duplicate submissions and duplicate message delivery.
- Implement bounded retries and dead-letter queues.
- Understand worker concurrency and crash recovery.
- Implement structured logging and observability.
- Measure system performance through reproducible benchmarks.
- Ensure both developers understand every subsystem.

## 3. Development Team

There are two developers:

- Developer 1
- Developer 2

Both developers have equal ownership of the project.

Neither developer should be restricted to a single technology or subsystem.

Both developers must be able to:
- Understand the complete architecture.
- Explain every major technical decision.
- Implement and modify components outside their primary responsibility.
- Debug the complete request-to-worker execution flow.
- Explain system failure modes.

## 4. Technology Stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| API Framework | Express.js |
| Validation | Zod |
| ORM | Prisma |
| Database | PostgreSQL |
| Message Broker | RabbitMQ |
| Cache / Operational State | Redis |
| Authentication | JWT + API Keys |
| Logging | Pino |
| Metrics | Prometheus |
| Monitoring Dashboard | Grafana |
| Frontend | React + TypeScript |
| Containerization | Docker + Docker Compose |
| Load Testing | k6 |

Do not introduce additional technologies without explicit approval.

## 5. High-Level Architecture

The system consists of the following components:

### API Service
Responsible for:
- Authentication.
- Request validation.
- Job submission.
- Job retrieval.
- Idempotency.
- API rate limiting.
- Persisting jobs and outbox events.
- Publishing outbox events to RabbitMQ.

### PostgreSQL
The source of truth for:
- Jobs.
- Job attempts.
- Idempotency records.
- Outbox events.

### Transactional Outbox Publisher
Responsible for:
- Finding unpublished outbox events.
- Claiming events safely.
- Publishing messages to RabbitMQ.
- Using publisher confirms.
- Marking events as published only after successful confirmation.

### RabbitMQ
Responsible for:
- Receiving published job messages.
- Delivering messages to workers.
- Managing durable queues.
- Supporting retry routing and dead-letter handling.
- Redelivering unacknowledged messages.

### Worker Service
Responsible for:
- Consuming messages.
- Updating job states.
- Executing simulated jobs.
- Recording attempts.
- Handling failures.
- Scheduling retries.
- Acknowledging messages after durable state updates.

### Redis
Used exclusively for:
- API rate limiting.
- Worker heartbeat/lease tracking.

Do not introduce Redis-based distributed locks or leader election without explicit approval.

### Observability
Pino provides structured JSON logs.

Prometheus collects API and worker metrics.

Grafana visualizes operational metrics and system behaviour.

### Frontend
A React dashboard provides:
- Job overview.
- Job listing.
- Job details.
- Attempt history.
- Operational information.

The dashboard uses polling, not WebSockets.

## 6. Job Lifecycle

The intended job lifecycle is:

PENDING → QUEUED → PROCESSING → COMPLETED

For failures:

PROCESSING → RETRY_WAIT → QUEUED → PROCESSING

After exhausting the configured retry limit:

PROCESSING → FAILED

Exhausted jobs must also be routed to the Dead Letter Queue according to the approved retry and DLQ design.

All state transitions must be consistent with the actual database and message-processing implementation.

## 7. Reliability Requirements

The platform must implement:

1. Transactional outbox.
2. RabbitMQ publisher confirms.
3. Durable queues and persistent messages.
4. Manual message acknowledgements.
5. Idempotent job submission.
6. Duplicate message protection.
7. Bounded application-level retries.
8. Exponential backoff.
9. Dead-letter routing.
10. Worker graceful shutdown.
11. Worker crash recovery.
12. Configurable worker concurrency and prefetch.

Delivery semantics:

The system provides at-least-once delivery with idempotent processing.

Never claim exactly-once delivery.

## 8. Observability Requirements

### Pino
Logs should contain relevant contextual fields:

- requestId
- jobId
- attempt
- workerId
- component

### Prometheus

API metrics:
- HTTP request count.
- Request duration.
- Jobs accepted.
- Idempotency hits.
- Rate-limit rejections.

Worker metrics:
- Jobs started.
- Jobs completed.
- Jobs failed.
- Jobs retried.
- Execution duration.
- Active workers.

Queue/reliability metrics:
- Queue depth.
- DLQ count.
- Retry information.

Avoid high-cardinality labels such as jobId, requestId and userId.

### Grafana

Dashboards should display:
- API performance.
- Worker performance.
- Queue behaviour.
- Reliability metrics.

All metrics must originate from actual runtime behaviour.

## 9. Explicit Non-Goals

Do not implement:

- Kubernetes.
- Microservices decomposition beyond API and worker processes.
- Service mesh.
- Autoscaling.
- Multi-region deployment.
- Multi-tenant SaaS.
- Billing or payment integration.
- OAuth.
- Password reset emails.
- Real email or payment jobs.
- Recurring or cron jobs.
- Workflow DAGs.
- Job chaining.
- WebSockets.
- Kafka.
- BullMQ.
- Redis Streams.
- Custom queue implementation.
- Distributed locks.
- Advanced admin console.
- Complex frontend design system.
- ELK, Loki or distributed tracing.

Jobs are deterministic simulated jobs only.

## 10. Development Timeline

The project has a five-day implementation schedule.

### Day 1
- Project foundations.
- Docker Compose.
- API and worker skeleton.
- Database schema.
- RabbitMQ topology.
- Redis proof of concept.
- Pino logging.
- Architecture and contracts.

### Day 2
- Authentication.
- Job submission.
- Transactional outbox.
- RabbitMQ publisher.
- Worker consumer.
- Simulated job execution.
- Basic integration test.

### Day 3
- Idempotency.
- Job attempts.
- Retry mechanism.
- Exponential backoff.
- DLQ.
- Graceful shutdown.
- Worker crash recovery.

### Day 4
- Prometheus instrumentation.
- Grafana dashboards.
- React dashboard.
- Worker health and heartbeat.
- Cross-developer integration.

### Day 5
- Integration testing.
- Failure testing.
- k6 benchmarking.
- Worker scaling tests.
- Docker verification.
- Documentation.
- Final release.

## 11. Engineering Rules

1. The developers make all architectural and implementation decisions.
2. AI tools may assist with syntax, boilerplate, debugging and implementation.
3. AI must not independently introduce functionality.
4. No function should be implemented until its intended behaviour is understood and approved.
5. No dependency should be added without approval.
6. No architectural changes should happen without discussion.
7. Inspect existing code before modifying it.
8. Write tests for important functionality.
9. Never claim tests passed without actually running them.
10. Never introduce unnecessary abstractions.
11. Keep the implementation within the agreed five-day scope.

## 12. Antigravity Operating Instructions

Before implementing any feature:

1. Read this CONTEXT.md.
2. Read DECISIONS.md.
3. Read DEVELOPER-1.md and DEVELOPER-2.md.
4. Inspect the existing source code.
5. Explain the existing implementation.
6. Propose the exact implementation.
7. Identify the files that need modification.
8. Wait for explicit developer approval.

After implementation:

1. Explain what changed.
2. Identify every modified or created file.
3. Explain important implementation details.
4. Run the relevant tests.
5. Report actual test results.
6. Update the responsible developer's engineering log.
7. Update DECISIONS.md only when an approved significant technical decision or implementation state changes.

Never invent missing context. Ask questions when something is unclear.

## 13. Definition of Done

The project is complete when:

- The complete stack starts through Docker Compose.
- Authenticated clients can submit jobs.
- Jobs are persisted correctly.
- Outbox publishing works.
- Workers execute jobs.
- Idempotency prevents duplicate logical jobs.
- Retries and DLQ work.
- Worker crash recovery is verified.
- Redis rate limiting and heartbeats work.
- Pino logs are structured.
- Prometheus collects metrics.
- Grafana dashboards display actual metrics.
- React dashboard displays actual job data.
- k6 benchmarks are reproducible.
- Both developers can independently explain the entire architecture.