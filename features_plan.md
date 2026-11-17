# MASTER PROMPT: Implement a docs-Inspired Personal Workspace MVP

## 1. ROLE AND MISSION

Act as a Principal Software Architect, Senior Full-Stack Engineer, Technical Project Manager, QA Architect, and Multi-Agent Orchestrator.

Your mission is to analyze my existing application and extend it by implementing three major functional areas inspired by online apps:

- **A. Pages and Content Organization**
- **B. Block-Based Content Editor**
- **C. Database System**

You must implement these capabilities into my existing application, not create a separate application or an isolated prototype.

The final result must be a functional, integrated, production-minded MVP.

You are responsible for:
1. Understanding the existing architecture.
2. Identifying reusable components and infrastructure.
3. Defining the target architecture.
4. Breaking down the implementation into tasks and subtasks.
5. Delegating work to specialized agents and subagents.
6. Implementing every required feature.
7. Following Test-Driven Development (TDD).
8. Running automated and manual verification.
9. Ensuring that all three functional areas work together.
10. Documenting completed functionality and remaining limitations.

Do not sacrifice functionality for superficial UI implementation.

---

# 2. GLOBAL CONSTRAINTS

These constraints are mandatory.

- Work exclusively on the existing application.
- Preserve the existing technology stack unless a change is technically necessary.
- Respect the current coding conventions and architectural patterns.
- Reuse existing components, services, utilities, and infrastructure whenever possible.
- Avoid unnecessary dependencies.
- Avoid introducing duplicated functionality.
- Maintain backward compatibility.
- Do not break existing features.
- Implement real functionality, not static mockups.
- Do not leave TODOs, placeholder implementations, fake interactions, or non-functional buttons in completed features.
- Do not implement features outside the defined scope unless they are strictly necessary.
- Do not implement team collaboration, enterprise functionality, or AI-related functionality.
- Assume a single individual user.
- Optimize the implementation for the free-plan MVP scope.

If an architectural decision is necessary, document the reasoning.

If something is ambiguous, inspect the existing codebase before making assumptions.

---

# 3. PHASE 0 — REPOSITORY DISCOVERY AND ARCHITECTURAL AUDIT

Before writing implementation code, thoroughly inspect the existing repository.

Analyze:

### Application architecture
- Frontend architecture.
- Backend architecture.
- Database architecture.
- API structure.
- Authentication and authorization.
- Routing.
- State management.
- Component organization.
- Design system.
- Existing testing infrastructure.
- Build and deployment configuration.

### Existing capabilities
Identify:
- Existing page or document models.
- Existing editor functionality.
- Existing reusable UI components.
- Existing database or collection functionality.
- Existing CRUD operations.
- Existing file storage.
- Existing search functionality.
- Existing navigation and sidebar.
- Existing user settings.

### Deliverables

Create:

1. `docs/architecture-audit.md`
2. `docs/current-capabilities.md`
3. `docs/implementation-strategy.md`
4. `docs/feature-traceability-matrix.md`

The traceability matrix must map every required feature in this prompt to:
- Implementation status.
- Relevant files.
- Associated tests.
- Dependencies.
- Assigned agent.
- Completion criteria.

Do not begin implementation until the audit is complete.

---

# 4. MULTI-AGENT ORCHESTRATION

You must operate as an orchestrator coordinating specialized agents and subagents.

If the environment supports multiple agents, delegate actual implementation and verification work to them.

If parallel agents are unavailable, simulate the same responsibilities sequentially while preserving the task ownership and review process.

## Agent 1 — Architecture and Data Modeling

Responsibilities:
- Analyze existing architecture.
- Design page and block data models.
- Design database and property models.
- Define entity relationships.
- Define API contracts.
- Review scalability and consistency.
- Identify migration requirements.

Deliverables:
- Architecture diagrams.
- Entity relationship diagrams.
- Database schema.
- API specifications.
- Migration strategy.

## Agent 2 — Pages and Navigation

Responsibilities:
- Implement hierarchical pages.
- Implement nested pages.
- Implement sidebar navigation.
- Implement page creation and management.
- Implement page metadata.
- Implement internal navigation.
- Implement search and organization features.

Owns functional area A.

## Agent 3 — Block Editor

Responsibilities:
- Implement the block-based editor.
- Implement block types.
- Implement block manipulation.
- Implement formatting.
- Implement media and embeds.
- Implement editor persistence.
- Implement keyboard interactions.

Owns functional area B.

## Agent 4 — Database Engine

Responsibilities:
- Implement database schemas.
- Implement database records.
- Implement properties.
- Implement database views.
- Implement filtering and sorting.
- Implement grouping.
- Implement relations and rollups.
- Implement formulas.
- Implement database templates.

Owns functional area C.

## Agent 5 — Frontend UX and Design System

Responsibilities:
- Integrate all functional areas into a consistent UI.
- Ensure responsive layouts.
- Implement reusable components.
- Maintain visual consistency.
- Ensure accessibility.
- Handle loading, empty, error, and success states.

## Agent 6 — QA and TDD

Responsibilities:
- Define testing strategy.
- Write unit tests.
- Write integration tests.
- Write end-to-end tests.
- Verify edge cases.
- Test feature integration.
- Identify regressions.
- Validate acceptance criteria.

## Agent 7 — Integration and Code Review

Responsibilities:
- Review all agent implementations.
- Resolve integration conflicts.
- Validate API and data contracts.
- Identify architectural inconsistencies.
- Verify shared component compatibility.
- Run the complete test suite.
- Approve or reject feature completion.

### Agent coordination rules

1. Assign clear ownership to every task.
2. Break large tasks into independently verifiable subtasks.
3. Define dependencies before parallel execution.
4. Avoid multiple agents modifying the same critical files simultaneously.
5. Require agents to report modified files, tests, and implementation status.
6. Require code reviews before merging agent work.
7. Do not mark a task complete based only on an agent's claim.
8. Verify the actual implementation and test results.

---

# 5. PHASE A — PAGES AND CONTENT ORGANIZATION

Implement a complete personal page management system.

## A1. Page Management

Required functionality:

- Create pages.
- Read pages.
- Update pages.
- Delete pages.
- Duplicate pages.
- Archive pages.
- Restore archived pages where supported.
- Manage page titles.
- Assign page icons.
- Assign page cover images.
- Store page metadata.
- Support empty pages.
- Support page descriptions where appropriate.

Acceptance criteria:
- Users can create and manage pages.
- Changes persist after refresh.
- Page metadata is correctly stored.
- Deletion and archival behavior are consistent.
- Errors are handled properly.

## A2. Hierarchical Pages

Required functionality:

- Nested pages.
- Parent-child relationships.
- Unlimited or appropriately supported nesting.
- Move pages between parents.
- Reorder sibling pages.
- Expand and collapse nested navigation.
- Prevent circular parent-child relationships.
- Prevent invalid hierarchy operations.

Acceptance criteria:
- Users can build complex page hierarchies.
- Moving pages preserves their content.
- Navigation reflects hierarchy changes immediately.
- Invalid hierarchy operations are rejected.

## A3. Navigation

Required functionality:

- Persistent sidebar.
- Page tree navigation.
- Favorites.
- Recent pages where appropriate.
- Breadcrumb navigation.
- Page navigation.
- Internal page links.
- Context menus for page operations.

Acceptance criteria:
- Navigation remains consistent after refresh.
- Users can quickly access important pages.
- Breadcrumbs correctly represent page hierarchy.
- Internal links resolve to the correct pages.

## A4. Search

Required functionality:

- Search page titles.
- Search page content where technically supported.
- Search nested pages.
- Display relevant results.
- Navigate directly to search results.
- Handle empty searches.
- Handle no-result states.

Acceptance criteria:
- Search returns relevant results.
- Results respect the current user's access boundaries.
- Search does not expose deleted or inaccessible content.

## A5. Templates

Required functionality:

- Create reusable page templates.
- Duplicate templates.
- Create pages from templates.
- Preserve predefined structures.
- Support template-based initial content.

Acceptance criteria:
- Templates can be reused without modifying the original.
- New pages receive independent content.

---

# 6. PHASE B — BLOCK-BASED CONTENT EDITOR

Implement a flexible editor based on independent content blocks.

Every block must be independently identifiable, persistable, editable, reorderable, and deletable.

## B1. Core Block Architecture

Implement:

- Unique block identifiers.
- Block types.
- Block content.
- Block properties.
- Block ordering.
- Parent-child relationships where applicable.
- Block persistence.
- Block validation.
- Block transformations.

The architecture must allow new block types to be introduced without rewriting the entire editor.

## B2. Required Block Types

Implement the following:

### Text blocks
- Paragraph.
- Heading 1.
- Heading 2.
- Heading 3.
- Bulleted list.
- Numbered list.
- To-do list.
- Toggle list.
- Quote.
- Callout.
- Divider.

### Technical blocks
- Code block.
- Equation block.

### Media blocks
- Image.
- Video.
- Audio.
- File attachment.
- Bookmark.
- External embed.

### Layout blocks
- Columns.
- Table of contents.
- Breadcrumb block.
- Synced blocks where feasible.

### Interactive blocks
- Buttons with configurable supported actions.

## B3. Text Formatting

Implement:

- Bold.
- Italic.
- Underline.
- Strikethrough.
- Inline code.
- Text colors.
- Background colors.
- Links.
- Markdown shortcuts.
- Slash commands.

Formatting must be persistent and correctly restored when reopening the editor.

## B4. Block Manipulation

Implement:

- Create blocks.
- Edit blocks.
- Delete blocks.
- Duplicate blocks.
- Move blocks.
- Reorder blocks.
- Transform block types.
- Multi-block selection where feasible.
- Drag-and-drop.
- Copy and paste.
- Keyboard shortcuts.
- Undo and redo where feasible.

## B5. Editor Experience

Implement:

- Inline editing.
- Empty block behavior.
- Automatic focus management.
- Keyboard navigation.
- Slash command menu.
- Block insertion menu.
- Context menu.
- Loading states.
- Error states.
- Autosave or reliable save behavior.
- Unsaved changes handling.

## B6. Media Handling

Implement:

- Image uploads.
- File uploads.
- Media previews.
- Attachment metadata.
- File size validation.
- Supported format validation.
- Secure file access.
- Error handling.
- Media persistence.

Respect the free-plan MVP constraint of a maximum 5 MB attachment size where applicable.

## B7. Tables of Contents and Layout

Implement:

- Automatic heading detection.
- Table of contents generation.
- Heading-based navigation.
- Multi-column layouts.
- Responsive behavior.
- Nested toggles.

### Acceptance criteria for Phase B

- Users can create documents using different block types.
- Every block persists correctly.
- Block order is preserved.
- Formatting survives reloads.
- Blocks can be edited independently.
- Moving blocks does not corrupt content.
- Keyboard interactions work correctly.
- Media uploads and previews work.
- The editor works on supported desktop and mobile layouts.
- No data is lost during normal editing workflows.

---

# 7. PHASE C — DATABASE SYSTEM

This is a core part of the MVP.

Implement a flexible database engine capable of managing structured information through multiple views.

## C1. Database Architecture

Implement:

- Database creation.
- Database deletion.
- Database duplication.
- Database naming.
- Database descriptions.
- Database metadata.
- Database persistence.
- Database records.
- Record identifiers.
- Database templates.

A database must be embeddable or accessible from a page.

## C2. Database Properties

Implement these property types:

1. Title.
2. Text.
3. Number.
4. Select.
5. Multi-select.
6. Status.
7. Date.
8. Checkbox.
9. URL.
10. Email.
11. Phone.
12. Files and media.
13. Created time.
14. Last edited time.
15. Formula.
16. Relation.
17. Rollup.

Each property must have:

- A unique identifier.
- A name.
- A type.
- Configuration.
- Validation rules.
- A default value where applicable.
- Persistence.

Implement property creation, editing, deletion, and reordering.

Changing a property type must not silently corrupt existing data.

## C3. Database Records

Implement:

- Create records.
- Edit records.
- Delete records.
- Duplicate records.
- Open records as pages.
- Edit record properties.
- Search records.
- Reorder records.
- Manage record content.

Acceptance criteria:
- Records are persisted correctly.
- Each record has its own identity.
- Property values are validated.
- Records can contain rich page content.
- Changes are reflected in every relevant database view.

## C4. Database Views

Implement the following views:

### Table View
- Rows and columns.
- Property visibility.
- Column resizing where feasible.
- Record creation.
- Inline property editing.
- Sorting.
- Filtering.

### Board View
- Group records by select or status properties.
- Drag records between groups.
- Create records within groups.
- Update group assignments.

### Gallery View
- Card-based presentation.
- Configurable card properties.
- Image previews where available.
- Card navigation.

### List View
- Compact record presentation.
- Configurable visible properties.
- Sorting and filtering.

### Calendar View
- Display records by date.
- Navigate between periods.
- Create records associated with dates.
- Update record dates.

### Timeline View
- Visualize records over time.
- Support start and end dates where applicable.
- Display record durations.
- Navigate across timeline periods.

## C5. Filtering

Implement:

- Equals.
- Does not equal.
- Contains.
- Does not contain.
- Is empty.
- Is not empty.
- Greater than.
- Less than.
- Before.
- After.
- Date ranges.
- Multiple filter conditions.
- AND / OR logical combinations where supported.

Filters must work across all compatible views.

## C6. Sorting

Implement:

- Ascending order.
- Descending order.
- Sorting by multiple properties.
- Type-aware sorting.
- Stable ordering.

## C7. Grouping

Implement:

- Group by select.
- Group by status.
- Group by supported properties.
- Display empty groups where appropriate.
- Collapse and expand groups.
- Maintain grouping configuration.

## C8. Database Relations

Implement relations between databases.

Requirements:

- Define a relation between two databases.
- Select related records.
- Support one-to-one, one-to-many, or many-to-many relationships where appropriate.
- Maintain referential integrity.
- Display related records.
- Support bidirectional relations where feasible.

## C9. Rollups

Implement rollups that retrieve and aggregate values from related records.

Support appropriate operations such as:

- Count.
- Sum.
- Average.
- Minimum.
- Maximum.
- Show original values.

Ensure invalid rollup configurations are handled safely.

## C10. Formula Engine

Implement a safe formula evaluation system.

Support an MVP-appropriate set of operations:

- Arithmetic.
- Comparisons.
- Conditional expressions.
- Basic logical operations.
- String concatenation.
- Date operations.
- Property references.
- Basic aggregation where applicable.

Requirements:

- Do not use unsafe dynamic code execution.
- Validate formulas before evaluation.
- Detect invalid references.
- Handle null values.
- Prevent infinite recursion.
- Return understandable errors.
- Keep formula evaluation deterministic.

## C11. Linked Database Views

Implement the ability to display an existing database on another page.

Requirements:

- Multiple views of the same database.
- Independent filters.
- Independent sorting.
- Independent grouping.
- Independent visible properties.
- Shared underlying records.

Changes to records must be reflected across all linked views.

## C12. Database Templates

Implement:

- Create database templates.
- Edit templates.
- Duplicate templates.
- Create records from templates.
- Define default property values.
- Define predefined page content.

### Acceptance criteria for Phase C

- Users can create structured databases.
- Every supported property type works.
- Records persist correctly.
- All required views work.
- Filters and sorting work consistently.
- Grouping works.
- Relations work.
- Rollups calculate correctly.
- Formulas are evaluated safely.
- Linked database views share underlying records.
- Templates create independent records.
- Data remains consistent after refreshes.

---

# 8. PHASE D — CROSS-FEATURE INTEGRATION

The three functional areas must operate as one coherent system.

Implement and test the following workflows:

### Workflow 1: Personal workspace
1. Create a page.
2. Add nested pages.
3. Organize pages in the sidebar.
4. Add favorites.
5. Navigate using breadcrumbs.

### Workflow 2: Document creation
1. Open a page.
2. Create text blocks.
3. Add headings.
4. Insert lists.
5. Insert images.
6. Reorder blocks.
7. Save.
8. Reload.
9. Verify that all content remains intact.

### Workflow 3: Personal task manager
1. Create a database.
2. Add task properties.
3. Create records.
4. Create a board view.
5. Group by status.
6. Move tasks between groups.
7. Create a calendar view.
8. Verify consistent record updates.

### Workflow 4: Personal knowledge database
1. Create a database of books or resources.
2. Add text, select, date, and number properties.
3. Create records.
4. Add a gallery view.
5. Create filtered views.
6. Connect the database to another database.
7. Retrieve related information using rollups.

### Workflow 5: Integrated dashboard
1. Create a personal dashboard page.
2. Add headings and callouts.
3. Add links to other pages.
4. Embed linked database views.
5. Configure different filters for each view.
6. Verify that all elements persist correctly.

---

# 9. PHASE E — TEST-DRIVEN DEVELOPMENT

TDD is mandatory.

Follow this exact development cycle:

1. Write a failing test.
2. Confirm that the test fails for the expected reason.
3. Implement the minimum functionality necessary.
4. Run the test.
5. Make it pass.
6. Refactor.
7. Run the relevant regression tests.

Do not implement a feature first and add tests afterward.

## Testing layers

### Unit tests
Test:
- Data models.
- Validation.
- Block operations.
- Property operations.
- Formula evaluation.
- Filter evaluation.
- Sorting.
- Grouping.
- Relation logic.
- Rollup calculations.
- Hierarchical page operations.

### Integration tests
Test:
- API endpoints.
- Database persistence.
- Page and block relationships.
- Database record persistence.
- Linked views.
- Relations and rollups.
- File storage.
- Authentication boundaries.

### End-to-end tests
Test:
- Page creation.
- Nested navigation.
- Document editing.
- Block manipulation.
- Media uploads.
- Database creation.
- Record management.
- View switching.
- Filtering.
- Sorting.
- Grouping.
- Relations.
- Rollups.
- Formula calculations.
- Complete user workflows.

### Regression testing
Run existing application tests after every significant integration.

Never remove or weaken existing tests simply to make the new implementation pass.

---

# 10. PHASE F — UX, PERFORMANCE AND SECURITY

## UX requirements
- Consistent visual language.
- Responsive interface.
- Keyboard accessibility.
- Clear loading states.
- Clear empty states.
- Clear error states.
- Confirmation for destructive actions.
- Consistent interaction patterns.
- Useful contextual menus.
- No dead buttons or fake interactions.

## Performance requirements
- Avoid unnecessary re-renders.
- Optimize large database views.
- Avoid inefficient queries.
- Use pagination or virtualization where necessary.
- Prevent excessive network requests.
- Avoid unnecessary data duplication.

## Security requirements
- Enforce user-level data isolation.
- Validate all input on the server.
- Sanitize user-generated content.
- Secure file uploads.
- Prevent unauthorized record access.
- Protect against unsafe formula execution.
- Avoid exposing internal storage paths or sensitive information.

---

# 11. IMPLEMENTATION STRATEGY

Implement incrementally.

Use the following suggested order:

**Sprint 0 — Discovery**
- Repository audit.
- Architecture review.
- Data modeling.
- Dependency analysis.
- Testing strategy.

**Sprint 1 — Core foundations**
- Database schema.
- Core entities.
- API contracts.
- Persistence.
- Shared UI components.

**Sprint 2 — Pages**
- CRUD.
- Hierarchy.
- Navigation.
- Favorites.
- Search.
- Templates.

**Sprint 3 — Block editor**
- Block architecture.
- Text blocks.
- Formatting.
- Block manipulation.
- Media.
- Layout.

**Sprint 4 — Database engine**
- Database CRUD.
- Properties.
- Records.
- Table view.
- Board view.
- List and gallery views.

**Sprint 5 — Advanced database functionality**
- Calendar.
- Timeline.
- Filters.
- Sorting.
- Grouping.
- Relations.
- Rollups.
- Formulas.
- Linked views.
- Templates.

**Sprint 6 — Integration**
- Personal dashboard.
- Cross-feature workflows.
- Navigation integration.
- Data consistency.

**Sprint 7 — QA and stabilization**
- Full test suite.
- E2E tests.
- Regression tests.
- Performance.
- Security.
- Bug fixing.
- Documentation.

You may change this order if repository dependencies justify a different sequence.

---

# 12. TASK MANAGEMENT AND PROGRESS TRACKING

Create a task breakdown before implementation.

Every task must contain:

- Task ID.
- Feature area.
- Description.
- Assigned agent.
- Dependencies.
- Priority.
- Estimated complexity.
- Implementation subtasks.
- Tests required.
- Acceptance criteria.
- Status.

Use these statuses:

- BACKLOG
- READY
- IN_PROGRESS
- IN_REVIEW
- BLOCKED
- DONE

Create:

- `docs/implementation-plan.md`
- `docs/task-breakdown.md`
- `docs/testing-strategy.md`
- `docs/progress-report.md`

Every feature must be traceable from requirements to implementation and tests.

Update the progress report after every completed milestone.

Do not mark a task DONE until:
1. Its implementation exists.
2. Its tests exist.
3. Its tests pass.
4. Its acceptance criteria are satisfied.
5. Integration review is complete.

---

# 13. DEFINITION OF DONE

The MVP is considered complete only when all the following conditions are satisfied:

## Area A — Pages
- [ ] Page CRUD works.
- [ ] Nested pages work.
- [ ] Page hierarchy is persistent.
- [ ] Sidebar navigation works.
- [ ] Favorites work.
- [ ] Breadcrumbs work.
- [ ] Internal links work.
- [ ] Search works.
- [ ] Templates work.
- [ ] Archiving and deletion work.

## Area B — Editor
- [ ] Block architecture is implemented.
- [ ] Required block types work.
- [ ] Formatting works.
- [ ] Slash commands work.
- [ ] Block manipulation works.
- [ ] Keyboard interactions work.
- [ ] Media handling works.
- [ ] Layout blocks work.
- [ ] Content persists correctly.
- [ ] Editor state survives reloads.

## Area C — Databases
- [ ] Database CRUD works.
- [ ] All required property types work.
- [ ] Records work.
- [ ] Table view works.
- [ ] Board view works.
- [ ] Gallery view works.
- [ ] List view works.
- [ ] Calendar view works.
- [ ] Timeline view works.
- [ ] Filtering works.
- [ ] Sorting works.
- [ ] Grouping works.
- [ ] Relations work.
- [ ] Rollups work.
- [ ] Formulas work safely.
- [ ] Linked database views work.
- [ ] Database templates work.

## Integration
- [ ] Pages contain editor blocks.
- [ ] Databases can be accessed from pages.
- [ ] Database records can contain page content.
- [ ] Linked views share data correctly.
- [ ] All cross-feature workflows pass.
- [ ] Existing application functionality remains intact.

## Quality
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] End-to-end tests pass.
- [ ] Regression tests pass.
- [ ] No critical security vulnerabilities remain.
- [ ] No critical known bugs remain.
- [ ] Documentation is updated.

---

# 14. FINAL EXECUTION INSTRUCTIONS

Start by inspecting the repository.

Do not immediately start coding.

First:
1. Understand the existing application.
2. Complete the architecture audit.
3. Create the task breakdown.
4. Identify dependencies.
5. Assign work to agents.
6. Define the implementation sequence.
7. Define the tests and acceptance criteria.

Then begin implementation.

Work autonomously within the defined scope.

Do not stop after creating plans or documentation. Continue implementing features until the MVP is complete or you encounter a genuine blocker.

If a blocker occurs:
- Explain the blocker.
- Identify its impact.
- Propose a solution.
- Continue with independent tasks whenever possible.

At the end, provide a comprehensive implementation report containing:

1. Features implemented.
2. Features not implemented.
3. Architecture changes.
4. Database migrations.
5. Files created and modified.
6. Agents and responsibilities.
7. Tests executed.
8. Test results.
9. Known limitations.
10. Remaining technical debt.
11. Exact MVP completion percentage.
12. Final acceptance criteria status.

**Final principle: Build a fully functional, coherent personal productivity workspace, not a collection of disconnected feature demonstrations.**

Correctness, data integrity, maintainability, and test coverage take priority over implementation speed.
