# Plan: 007 — Page view header, cover & icon

## 1. Components
```
<PageView>
  <PageHeader>
    {cover && <Cover url onRemove />}
    <div flex>
      {icon && <IconPicker emoji onRemove />}
      <TitleInput value onblur=PATCH />
      <Breadcrumbs />
    </div>
    {!cover && <AddCoverButton />}
    {!icon && <AddIconButton />}
  </PageHeader>
  <Editor .../>
</PageView>
```

## 2. New files
- `components/PageHeader.tsx` — cover + icon + title + breadcrumbs.
- `components/EmojiPicker.tsx` — popover grid of ~50 common emojis.
- `components/Breadcrumbs.tsx` — workspace name > ancestor page titles.
- `features/page/useUpdatePageMeta.ts` — debounced PATCH for title/icon/cover.

## 3. Behavior
- Title: contenteditable div; on blur, PATCH `/pages/:id` with `{ title }`.
- Icon: click → EmojiPicker popover → select → PATCH `{ icon }`.
- Cover: hover button → URL input → PATCH `{ cover_url }`.
- All PATCHes use the existing `updatePage` API; optimistic update via RQ cache.

## 4. No new deps. No deviations.
