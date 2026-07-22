# Tasks: 006 — Frontend: block editor (TipTap)

## Implementation
- [ ] 1. Install TipTap deps (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-*, @tiptap/pm).
- [ ] 2. Block API client (`api/blocks.ts`): create/update/delete.
- [ ] 3. Hooks: `usePageBlocks`, `useUpdateBlock`, `useCreateBlock`.
- [ ] 4. Serializers: TipTap JSON ↔ BlockContent shapes.
- [ ] 5. Custom extensions: TodoItem, Callout.
- [ ] 6. Editor component with StarterKit + extensions + autosave.
- [ ] 7. SlashMenu component.
- [ ] 8. PageView (replaces PageViewStub).
- [ ] 9. Editor CSS (ProseMirror Tailwind styling).

## Tests
- [ ] Playwright e2e: editor renders, typing autosaves, slash menu opens,
       heading conversion, bold toggle, Enter creates block, todo checkbox.

## Verification gate
- [ ] `yarn lint` — clean
- [ ] `yarn typecheck` — clean
- [ ] `yarn test:e2e` — all pass

## Docs
- [x] `specs/006-…/` spec/plan/tasks present.
