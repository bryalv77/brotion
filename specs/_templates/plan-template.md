# Plan: [Feature name]

> Technical design derived from spec.md. Must respect constitution.md. Fill this
> out before writing tasks.md or any code.

## 1. Architecture overview
How this feature fits into the overall system (which layers/services touch it).

## 2. Data model
Tables/models involved (new or modified), fields, types, relations, indexes.

```
Model X {
  field: type
  ...
}
```

## 3. API contracts
For each endpoint touched:

```
METHOD /api/v1/path
Request:  { ... }
Response: { ... }
Errors:   400/401/403/404/... — when each happens
```

## 4. Frontend components (if applicable)
Component tree, state management approach, what talks to the API client, what's local UI state.

## 5. Libraries/tools chosen
Name each library used here and why (e.g. "TipTap for the editor because...").
Must not contradict `constitution.md`'s fixed stack.

## 6. Edge cases & error handling
- ...

## 7. Non-functional considerations
Performance, security, accessibility notes specific to this feature.

## 8. Deviations from constitution.md (should be empty)
If a deviation is unavoidable, justify it here and flag it to the user explicitly.
