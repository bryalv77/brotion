# Tasks: [Feature name]

> Derived from plan.md. Each task should be small enough to implement and verify
> in one pass. Check items off as you go.

## Implementation
- [ ] Task 1 — ...
- [ ] Task 2 — ...
- [ ] Task 3 — ...

## Tests
- [ ] Unit/integration tests for [...]
- [ ] Playwright e2e test: [flow name] — covers acceptance criteria #[n] from spec.md
- [ ] Playwright e2e test: [flow name] — covers acceptance criteria #[n] from spec.md

## Verification gate (run before marking this feature done)
- [ ] `yarn lint` — clean, zero errors/warnings
- [ ] `yarn typecheck` — clean, zero errors
- [ ] `yarn test:e2e` — all new and existing e2e tests pass

## Docs
- [ ] Module README updated
- [ ] `/shared` or `/docs/contracts` updated if this feature exposes a contract
      other features depend on

## Notes / deviations found during implementation
Record here anything that forced a change to plan.md or spec.md, with a link
back to what changed.
