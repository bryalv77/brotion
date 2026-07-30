# Tasks: 013 — Sheets & Formulas

## Implementation
- [ ] 1. Prisma: add `formula` to `PropertyType` enum; migration `20260730010000_formulas`.
- [ ] 2. Shared: extend `PropertyType` union with `formula`; add `FormulaValue`, `ComputedCell`, `DatabaseRowDTO.computed`.
- [ ] 3. Backend `modules/formulas/`: `ast.ts`, `tokens.ts`, `lexer.ts`, `parser.ts` (recursive descent, precedence per plan §4).
- [ ] 4. Backend `modules/formulas/`: `functions.ts` (the 15 functions in plan §4).
- [ ] 5. Backend `modules/formulas/`: `evaluator.ts` (typed context, coercion rules, error codes).
- [ ] 6. Backend `modules/formulas/`: `engine.ts` (parseProperty, evaluateRow, LRU cache, cycle detection at write time).
- [ ] 7. Backend `modules/formulas/`: `*.test.ts` using Node's built-in `node:test` runner, wired into `yarn typecheck` (or a new `yarn test:unit`).
- [ ] 8. Backend: extend `databases.service` — `getDatabase` populates `row.computed`; `updatePropertyValue` recomputes the row's formula cells and returns them; reject updates on formula properties.
- [ ] 9. Backend: `addProperty` cycle check before insert; return 400 `FORMULA_CYCLE`.
- [ ] 10. Frontend: `frontend/src/features/formulas/parser.ts` + `evaluator.ts` (same grammar, client-side preview only).
- [ ] 11. Frontend: `api/databases.ts` — `previewFormula` helper is local (no API call); update `updatePropertyValue` response type to include `computed`.
- [ ] 12. Frontend: new `FormulaCell` component in `DatabaseView.tsx` (renders computed value; popover with `FormulaBar` for editing source + live preview).
- [ ] 13. Frontend: hook `usePageDatabases(pageId)` to list all databases on a page; new `PageDatabases` wrapper component.
- [ ] 14. Frontend: wire `PageDatabases` into `PageView` (below the editor).
- [ ] 15. Frontend: add `+ Add a sheet` placeholder button + slash-menu entry `/database` in `SlashMenu.tsx` + handler in `Editor.tsx`.

## Tests
- [ ] 16. e2e `sheets.spec.ts`: covers acceptance criteria A–G (create sheet, formula column, recompute on input change, parse/unknown/circular errors, property rename → `unknown_property`).
- [ ] 17. e2e `pageview-sheet.spec.ts` (UI): create sheet via UI; verify it renders below the editor; covers H + I.

## Verification gate (run before marking this feature done)
- [ ] `yarn lint` — clean
- [ ] `yarn typecheck` — clean
- [ ] `yarn test:unit` — all engine tests pass (new gate)
- [ ] `yarn test:e2e` — all new and existing e2e tests pass

## Docs
- [ ] Update `README.md` with the new "Sheets" feature paragraph.

## Notes / deviations found during implementation
