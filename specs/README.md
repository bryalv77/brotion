# Spec-Driven Development (SDD) — how this project works

This project is built with **Spec-Driven Development**: nobody writes code straight
from a chat message. Every unit of work goes through the same pipeline:

```
spec.md  →  plan.md  →  tasks.md  →  implementation  →  verification gate
```

## Folder layout

```
/specs
  constitution.md         ← global, non-negotiable rules for the whole project
  README.md               ← this file
  _templates/
    spec-template.md
    plan-template.md
    tasks-template.md
  000-architecture/        ← one folder per feature/task, numbered in build order
    spec.md
    plan.md
    tasks.md
  001-auth/
    spec.md
    plan.md
    tasks.md
  002-pages-and-blocks/
    ...
```

Each numbered folder corresponds to one of the tasks in the master prompt
(`000-architecture` = Task 0, `001-auth` = Task 2, etc. — numbering doesn't have
to match task numbers 1:1, but keep it sequential and consistent).

## The pipeline, step by step

1. **spec.md** (the "what" and "why") — written BEFORE any code or technical
   decision. Describes user-facing behavior, scope, and acceptance criteria.
   No mention of frameworks, libraries, or database tables here.
2. **plan.md** (the "how") — technical design: data model, API contracts,
   component breakdown, libraries chosen, edge cases, error states. This is
   where `constitution.md`'s constraints (stack, conventions) get applied.
3. **tasks.md** — the plan broken into small, independently verifiable steps,
   each one small enough to implement and test in one pass.
4. **Implementation** — the subagent writes code strictly following tasks.md.
   If reality forces a deviation from the plan, the subagent updates plan.md
   (and spec.md if user-facing behavior changes) BEFORE continuing — specs are
   living documents, not paperwork to file away.
5. **Verification gate** — mandatory before marking anything done:
   - `yarn lint`
   - `yarn typecheck`
   - `yarn test:e2e` (Playwright)
   All three must pass clean. The agent runs these itself, fixes failures
   itself, and loops until green — it does not hand this back to the user.

## Rules for subagents

- Never start writing implementation code before `spec.md` and `plan.md` exist
  for your task and don't contradict `constitution.md`.
- If your task depends on another feature's spec/plan/contracts, read those
  files first — don't guess or duplicate a contract.
- Keep specs short and concrete. A spec nobody can verify against is useless —
  every spec.md must end with a checklist of acceptance criteria that a test
  can map 1:1 onto.
- Update `tasks.md` checkboxes as you go so progress is visible without asking
  the agent "are you done yet."
