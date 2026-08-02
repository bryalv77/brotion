# Tasks: 016 — Database Templates

> Derived from spec 016. Implements templates as a factory that produces new
> rows by deep-copy, with no later synchronization.

## Implementation
- [x] 1. Prisma: `is_template Boolean @default(false)` on `Page`; new `Template`
      model (database_id, name, icon, page_id @unique, default_values Json,
      is_default, created_by) + `templates Template[]` on `Database` +
      `template_body Template?` on `Page`. Migration
      `20260802020000_templates` (ALTER pages + CREATE templates + FKs).
- [x] 2. Shared types: `TemplateDTO`, `DatabaseDTO.templates?`,
      `CreateRowRequest`, `CreateTemplateRequest`, `UpdateTemplateRequest`;
      `contracts.md` "Templates" section.
- [x] 3. `templates.service.ts`: create (hidden body page + Template row; first
      is default), list, get, update (name/icon/is_default/default_values with
      NON_DEFAULTABLE / UNKNOWN guards; is_default un-marks siblings), delete
      (OWNER; cascades body page). Helpers: `resolveTemplateForNewRow`,
      `getTemplateBodyPageId`, `cloneBlocks` (factored from duplicatePage).
- [x] 4. `databases.service.ts` `addRow` extended with `opts.templateId`:
      resolves template (explicit/default/none), deep-copies body, seeds
      defaults, syncs "Name" → title. `toDatabaseDTO` gains optional `templates`;
      `getDatabase`/`createDatabase`/`updateDatabase` include templates.
- [x] 5. Controller/routes/schema: `addRowHandler` parses `createRowSchema`;
      `create/list/get/update/delete Template` handlers under
      `/databases/:databaseId/templates[/:templateId]`; zod schemas
      `createRowSchema`/`createTemplateSchema`/`updateTemplateSchema`.
- [x] 6. Hidden-page exclusion: `listChildPages` (findMany + groupBy),
      `listTrashedPages`, search SQL, `getPageAncestors` now filter
      `is_template: false`.
- [x] 7. Frontend: `addRow(databaseId, body?)` + `listTemplates`/
      `createTemplate`/`updateTemplate`/`deleteTemplate` clients;
      `TemplatesModal` (create/rename/set-default/delete/edit-content); TableView
      "+ New row" → dropdown (empty/templates) + "Templates" button.

## Tests
- [x] Playwright API e2e (`templates.spec.ts`): create/list/update/delete,
      instantiate (explicit + default + none), independence (row↔template),
      default_values seeding + Name→title, hidden-page exclusion from
      sidebar/search/breadcrumbs, access tiers (VIEWER 403, non-OWNER delete 403).

## Notes
- No breaking changes: `addRow` keeps its return shape and the new param is
  optional; `DatabaseDTO.templates` is optional; block editing of the template
  body reuses the existing `/pages/:pageId/blocks` endpoints.
- Dynamic variables, automations, synced blocks, and template inheritance are
  explicitly out of scope (see spec §3).
