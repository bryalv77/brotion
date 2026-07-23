# Spec: 014 — Image uploads (covers + in-content image blocks)

## Summary
Wire the existing backend upload pipeline (`POST /files`) to the frontend for two
use cases: (1) uploading a cover image for a page, (2) inserting an image block
in the editor. Zero backend changes — only frontend wiring.

## Acceptance criteria
- [ ] Cover: "Upload" button opens file picker → uploads → cover renders.
- [ ] Editor: slash menu "Image" → file picker → uploads → image block renders.
- [ ] Uploaded file is served at `GET /api/v1/files/:key`.
- [ ] Upload failure shows a toast error.
