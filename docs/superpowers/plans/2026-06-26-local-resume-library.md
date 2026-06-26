# Local Resume Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Electron trial package that parses local resume files into a persistent local talent library without cloud AI or seeded demo data.

**Architecture:** Desktop parsing and persistence live in focused CommonJS modules under `desktop/`. Electron IPC exposes import and library-read APIs to the browser. The renderer enters a desktop local-library mode that renders empty states or imported candidates from the local JSON database instead of seeded demo content.

**Tech Stack:** Electron, Node.js, JSON file persistence, local PDF/DOCX/TXT/MD parsing, existing HTML/CSS/JavaScript UI, Harness npm gates.

---

### Task 1: Desktop Local Database and Parsers

**Files:**
- Create: `desktop/local-library.cjs`
- Create: `desktop/resume-parser.cjs`
- Modify: `desktop/main.cjs`
- Modify: `desktop/preload.cjs`
- Test: `tests/local-resume-library.test.cjs`

- [x] Add tests for empty database creation, folder import persistence, file parsing, and no seeded records.
- [x] Implement JSON database read/write under Electron `userData`.
- [x] Implement local parsing for TXT/MD, DOCX, PDF, and best-effort DOC.
- [x] Expose `getTalentLibrary` and `selectImportFolder` IPC APIs.

### Task 2: Renderer Local-Library Mode

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Test: `tests/homepage-structure.test.js`

- [x] Add tests that the app has local-library mode hooks and no packaged demo-folder flow.
- [x] On startup, detect `window.deerRecallDesktop`.
- [x] Load local library records from IPC.
- [x] Render empty states when no records exist.
- [x] Render imported candidates, search cards, task stats, source lists, and candidate detail from local records.

### Task 3: Packaging and Harness Verification

**Files:**
- Modify: `package.json`
- Modify: `electron-builder.json`
- Modify: `README.md`

- [x] Add parser dependencies and include desktop parser files in Electron package.
- [x] Document first-trial behavior, local database location, and DMG generation.
- [x] Run `npm run check`.
- [x] Run `npm run build`.
- [x] Run `npm run verify:dist`.
- [x] Run `npm run desktop:build:trial`.
- [x] Mount and inspect the generated DMG.
- [ ] Commit and push to `origin/main`.
