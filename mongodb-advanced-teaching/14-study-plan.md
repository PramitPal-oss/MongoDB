# 13. Study Plan — From Refresh to Interview Ready

## Phase 1 — 2 days: nested write mastery

Read:
- `02-nested-updates.md`
- `03-conditional-object-operators.md`

Solve:
- workbook 81–100

Goal:
You can write two-level `arrayFilters` without looking up syntax.

---

## Phase 2 — 2 days: advanced aggregation

Read:
- `04-advanced-aggregation.md`
- `05-window-functions.md`
- `06-graphlookup-hierarchy.md`

Solve:
- workbook 118–160

Goal:
You can explain output document shape after every stage.

---

## Phase 3 — 2 days: performance/modeling

Read:
- `07-performance-indexes-explain.md`
- `08-schema-modeling-validation.md`

Solve:
- workbook 161–180

Goal:
Given a slow query, you inspect explain before proposing an index.

---

## Phase 4 — 2 days: production correctness

Read:
- `09-transactions-concurrency-idempotency.md`
- `10-production-scenarios.md`

Solve:
- workbook 181–200

Goal:
You can explain overselling, payment retries, keyset pagination, materialized reporting, sharding, and change streams.

---

## Phase 5 — 2 days: mock interview

Read:
- `11-interview-machine-coding.md`
- `12-end-to-end-labs.md`
- `13-cheat-sheet.md`

Do:
- 3 timed aggregation problems
- 3 nested update problems
- 2 explain/index problems
- 1 checkout architecture discussion
- 1 Node + MongoDB endpoint in 45 minutes

---

# Interview-ready benchmark

You are ready when you can answer these without notes:

1. `$` vs `$[]` vs `$[id]`
2. nested arrays with two array filters
3. `$map` update pipeline
4. `$facet` dashboard
5. `$bucket` vs `$bucketAuto`
6. `$unionWith` vs `$lookup`
7. `$merge` rerun semantics
8. rank/running/moving windows
9. `$graphLookup`
10. multikey/compound multikey
11. read `executionStats`
12. embed vs reference
13. bounded arrays/document growth
14. optimistic locking
15. atomic stock reservation
16. transaction boundary
17. idempotency
18. keyset pagination
19. shard-key tradeoffs
20. change-stream consumer safety
