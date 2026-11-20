# Developer 2 — Engineering Log

## 1. Developer Information

Developer: Developer 2

Project: Distributed Job Processing Platform

Primary ownership:
- Worker development.
- RabbitMQ topology.
- RabbitMQ consumer.
- Job execution.
- Retry and DLQ handling.
- Redis worker heartbeat.
- Worker observability.
- Worker performance testing.
- Infrastructure integration.

Important: Primary ownership does not mean exclusive ownership. Developer 2 must understand and be able to modify every subsystem.

## 2. Current Development Status

Current development day: Day 1 — Foundations (Completed)

Overall status: DAY 1 COMPLETE

Last updated: 2026-11-20

Current focus: Day 1 Complete. Ready for Day 2 Worker Execution.

Completed tasks:
- Worker application skeleton and TypeScript config extending root tsconfig.base.json.
- RabbitMQ connection management, topology setup (main, retry, DLQ), and prefetch configuration.
- Minimal consumer with manual acknowledgement (`ack`) and failure routing (`nack` to DLQ).
- Structured logging setup with Pino, automatic unique `workerId` tagging, and contextual child loggers.
- Redis client and heartbeat service with periodic TTL pulses and clean exit cleanup.
- Docker Compose foundation with PostgreSQL, RabbitMQ, Redis, Prometheus, and auto-provisioned Grafana.

In-progress tasks: None (Day 1 completed).

Pending tasks:
- Day 2 tasks (Worker execution, database integration, message envelope validation).

Blocked tasks: None

## 3. Daily Implementation Log

### Day 1 — Foundations

Status: COMPLETED

#### Tasks

- [x] Create worker application.
- [x] Configure shared TypeScript configuration.
- [x] Connect worker to RabbitMQ.
- [x] Define exchange topology.
- [x] Define durable queues.
- [x] Define routing keys.
- [x] Configure dead-letter exchange and queue.
- [x] Implement a minimal consumer.
- [x] Implement manual acknowledgement for test messages.
- [x] Implement Pino worker logging.
- [x] Generate workerId.
- [x] Implement Redis heartbeat proof of concept.
- [x] Verify heartbeat TTL and expiry.
- [x] Start Prometheus and Grafana containers.

#### Implementation Record

Features implemented:
- Worker application skeleton (`worker/`).
- TypeScript setup extending `tsconfig.base.json` (`worker/tsconfig.json`).
- Environment variable configuration (`worker/src/config/env.ts` and `worker/.env.example`).
- Process lifecycle entrypoint with graceful shutdown handling (`worker/src/index.ts`).
- Installed `amqplib` and `@types/amqplib`.
- RabbitMQ connection management with error and close event handlers.
- Prefetch configuration matching worker concurrency (`ch.prefetch(prefetchCount)`).
- Complete RabbitMQ topology configuration:
  - Main Exchange (`jobs.exchange`, direct, durable)
  - Main Queue (`jobs.main`, durable) routing key `jobs.dispatch`, with `deadLetterExchange: jobs.dlx` and `deadLetterRoutingKey: jobs.dead`
  - Retry Exchange (`jobs.retry.exchange`, direct, durable)
  - Retry Queue (`jobs.retry`, durable) routing key `jobs.retry`, with dead letter routing back to `jobs.exchange` / `jobs.dispatch` on TTL expiry
  - Dead Letter Exchange (`jobs.dlx`, direct, durable)
  - Dead Letter Queue (`jobs.dlq`, durable) routing key `jobs.dead`
- Graceful connection teardown (`closeRabbitMQ`) cleanly closing channel and connection.
- Minimal consumer on `jobs.main` queue (`worker/src/consumer/job.consumer.ts`).
- Explicit manual acknowledgement (`channel.ack(msg)` with `{ noAck: false }`).
- Error rejection with DLQ routing (`channel.nack(msg, false, false)`).
- Consumer cancellation on graceful shutdown (`channel.cancel(activeConsumerTag)`).
- Structured logging setup with `pino` and `pino-pretty` (`worker/src/logger/logger.ts`).
- Automatic unique `workerId` generation (via `crypto.randomUUID()`) or environment injection.
- Base log metadata attachment (`service: 'job-platform-worker'`, `workerId`).
- Contextual child logger creator (`createComponentLogger`) with `component` labels.
- Replaced all raw console output with structured contextual logger calls across the worker.
- Installed `ioredis` for worker operational state tracking.
- Redis client singleton (`worker/src/redis/redis.client.ts`) with lifecycle management.
- Heartbeat service (`worker/src/heartbeat/heartbeat.service.ts`):
  - Sends atomic `SET worker:{workerId}:heartbeat <payload> EX 10`.
  - Refreshes heartbeat every 3 seconds (`unref` timer).
  - Explicitly cleans up heartbeat key on graceful shutdown.
- Heartbeat verification script (`worker/src/heartbeat/verify-heartbeat.poc.ts`) runnable via `npm run poc:heartbeat`.
- Root Docker Compose infrastructure (`docker-compose.yml`) containing PostgreSQL, RabbitMQ, Redis, Prometheus, and Grafana.
- Prometheus configuration (`docker/prometheus/prometheus.yml`) with scraping targets for Prometheus, API, and Worker.
- Grafana datasource auto-provisioning (`docker/grafana/provisioning/datasources/prometheus.yml`).

Files created:
- `worker/package.json`
- `worker/tsconfig.json`
- `worker/.env.example`
- `worker/src/config/env.ts`
- `worker/src/index.ts`
- `worker/src/constants/rabbitmq.ts`
- `worker/src/queue/rabbitmq.ts`
- `worker/src/consumer/job.consumer.ts`
- `worker/src/logger/logger.ts`
- `worker/src/redis/redis.client.ts`
- `worker/src/heartbeat/heartbeat.service.ts`
- `worker/src/heartbeat/verify-heartbeat.poc.ts`
- `docker-compose.yml`
- `docker/prometheus/prometheus.yml`
- `docker/grafana/provisioning/datasources/prometheus.yml`

Files modified:
- `worker/package.json`
- `worker/.env.example`
- `worker/src/config/env.ts`
- `worker/src/index.ts`
- `worker/src/queue/rabbitmq.ts`
- `worker/src/consumer/job.consumer.ts`
- `docs/engineering_logs/developer-2.md`
- `docs/DECISIONS.md`

Important functions:
- `connectRedis()` & `closeRedis()`: Manages Redis client connection and clean shutdown.
- `sendHeartbeat(redis)`: Performs atomic `SET worker:{workerId}:heartbeat payload EX 10`.
- `startHeartbeat(redis)`: Initiates the 3-second periodic refresh loop.
- `stopHeartbeat(redis)`: Clears timer and deletes heartbeat key on graceful exit.
- `createComponentLogger(component)`: Returns a child Pino logger with bound component name.
- `workerId`: Unique worker process identifier attached to every log record.
- `connectRabbitMQ(url, prefetchCount)`: Connects to broker, creates channel, configures prefetch, and initializes topology.
- `setupTopology(ch)`: Asserts exchanges, durable queues, DLQ, retry queues, and their bindings.
- `startJobConsumer(channel)`: Starts consuming with `{ noAck: false }` for manual message acknowledgement.
- `handleMessage(channel, msg)`: Inspects incoming payload, processes it, and manually calls `channel.ack(msg)`.
- `stopJobConsumer(channel)`: Cancels active consumer tag during shutdown before closing channel.
- `closeRabbitMQ()`: Gracefully closes channel and connection.
- `handleShutdown(signal)`: Handles SIGINT and SIGTERM for graceful worker process termination, stops consumer, deletes heartbeat, and closes connections.

RabbitMQ configuration:
- Main Exchange: `jobs.exchange` (direct, durable)
- Main Queue: `jobs.main` (durable)
- Dispatch Routing Key: `jobs.dispatch`
- Retry Exchange: `jobs.retry.exchange` (direct, durable)
- Retry Queue: `jobs.retry` (durable, deadLetterExchange: `jobs.exchange`, deadLetterRoutingKey: `jobs.dispatch`)
- Retry Routing Key: `jobs.retry`
- Dead Letter Exchange: `jobs.dlx` (direct, durable)
- Dead Letter Queue: `jobs.dlq` (durable)
- Dead Letter Routing Key: `jobs.dead`

Redis keys:
- Key Pattern: `worker:{workerId}:heartbeat`
- TTL: 10 seconds (`config.heartbeatTtlSeconds`)
- Refresh interval: 3 seconds (`config.heartbeatIntervalMs`)
- Value: JSON `{ workerId, status: 'alive', timestamp, uptimeSeconds, concurrency }`
- Purpose: Liveness and stale-worker detection without distributed locks.

Technical concepts learned:
- Standalone service modularity alongside API.
- TypeScript project inheritance using `tsconfig.base.json`.
- Node.js graceful termination signals for background workers.
- AMQP 0-9-1 exchange and queue topology concepts.
- Dead Letter Exchanges (DLX) for unrecoverable failures.
- Native TTL dead-lettering backoff pattern for retries without third-party plugins.

Tests executed:
- `npm run typecheck` (`tsc --noEmit`)
- `npm run build` (`tsc`)

Actual test results:
- Typecheck passed with 0 errors.
- Build succeeded, generating clean JS in `worker/dist`.

Bugs encountered: None

Fixes applied: None

Remaining work:
- Implement a minimal consumer with manual acknowledgement.
- Worker Pino logging and workerId generation.
- Redis heartbeat proof of concept.
- Pino structured logging and workerId generation.
- Redis heartbeat proof of concept.

---

### Day 2 — Worker Execution

Status: NOT STARTED

#### Tasks

- [ ] Implement message envelope validation.
- [ ] Implement RabbitMQ consumer.
- [ ] Implement simulated job execution.
- [ ] Implement PROCESSING state update.
- [ ] Implement COMPLETED state update.
- [ ] Configure manual acknowledgements.
- [ ] Define nack/requeue behaviour.
- [ ] Implement configurable concurrency.
- [ ] Configure RabbitMQ prefetch.
- [ ] Implement worker identification.
- [ ] Implement attempt information in logs.
- [ ] Implement worker heartbeat refresh.
- [ ] Integrate with Developer 1's API and outbox publisher.
- [ ] Verify end-to-end execution.

#### Implementation Record

Features implemented:

Files created:

Files modified:

Important functions:

Message envelope:

Consumer configuration:

Acknowledgement strategy:

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

- [ ] Implement failure classification.
- [ ] Identify retryable failures.
- [ ] Identify non-retryable failures.
- [ ] Implement delayed retry routing.
- [ ] Implement retry queue configuration.
- [ ] Implement dead-letter routing.
- [ ] Verify max-attempt handling.
- [ ] Implement graceful worker shutdown.
- [ ] Stop consuming new messages during shutdown.
- [ ] Handle in-flight messages safely.
- [ ] Test worker termination during processing.
- [ ] Verify RabbitMQ redelivery.
- [ ] Verify duplicate message handling.
- [ ] Verify heartbeat expiry.

#### Implementation Record

Features implemented:

Files created:

Files modified:

Important functions:

Retry configuration:

DLQ configuration:

Failure classification:

Graceful shutdown behaviour:

Technical concepts learned:

Tests executed:

Actual test results:

Bugs encountered:

Fixes applied:

Remaining work:

---

### Day 4 — Observability and Infrastructure

Status: NOT STARTED

#### Tasks

- [ ] Instrument worker using Prometheus.
- [ ] Implement jobs started counter.
- [ ] Implement jobs completed counter.
- [ ] Implement jobs failed counter.
- [ ] Implement jobs retried counter.
- [ ] Implement execution duration histogram.
- [ ] Implement active workers gauge.
- [ ] Expose queue depth through an approved mechanism.
- [ ] Build worker Grafana dashboard panels.
- [ ] Implement worker health/readiness endpoint.
- [ ] Verify graceful shutdown logging.
- [ ] Configure worker Docker setup.
- [ ] Configure Prometheus scraping.
- [ ] Configure Grafana provisioning.

#### Implementation Record

Features implemented:

Files created:

Files modified:

Important functions:

Metrics added:

Grafana panels added:

Queue depth source:

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

- [ ] Run worker integration tests.
- [ ] Run failure recovery tests.
- [ ] Run worker throughput benchmarks.
- [ ] Test with one worker.
- [ ] Test with two workers.
- [ ] Test with four workers.
- [ ] Record completed jobs per second.
- [ ] Record queue wait time.
- [ ] Record execution duration.
- [ ] Record retry count.
- [ ] Record DLQ count.
- [ ] Measure worker recovery time.
- [ ] Repeat benchmarks at least three times.
- [ ] Verify Docker configuration.
- [ ] Capture Grafana screenshots.
- [ ] Contribute to BENCHMARK_RESULTS.md.

#### Benchmark Record

Hardware:

Operating system:

Docker resource limits:

Worker count:

Concurrency per worker:

RabbitMQ prefetch:

Simulated job duration:

Job failure percentage:

Test duration:

Jobs processed:

Jobs completed:

Jobs failed:

Jobs retried:

DLQ count:

Completed jobs per second:

Average queue wait:

Execution duration:

Worker recovery time:

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
| RabbitMQ | PENDING | PENDING | PENDING |
| PostgreSQL | PENDING | PENDING | PENDING |
| Prisma | PENDING | PENDING | PENDING |
| Redis | PENDING | PENDING | PENDING |
| Pino | PENDING | PENDING | PENDING |
| Prometheus | PENDING | PENDING | PENDING |
| Grafana | PENDING | PENDING | PENDING |
| Docker | PENDING | PENDING | PENDING |
| k6 | PENDING | PENDING | PENDING |

A technology is considered learned only after practical implementation, runtime inspection, testing and independent explanation.

---

## 6. Cross-Developer Learning

Record concepts learned from Developer 1.

| Date | Technology / Concept | What I learned |
|---|---|---|
| | | |

Record modifications made to Developer 1's components.

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