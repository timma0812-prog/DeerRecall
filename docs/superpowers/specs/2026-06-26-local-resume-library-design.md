# Local Resume Library Trial Design

## Goal

Turn the Electron trial build from a demo-data prototype into a usable local-first resume library: customers start from an empty talent library, choose a local resume folder, parse resume text locally, and build a persistent local candidate database.

## Approved Scope

- Do not use cloud AI for the first trial build.
- Do not require users to install Electron, Node, Docker, Rust, or a database.
- Package a complete unsigned macOS DMG after implementation.
- Push the completed source changes to GitHub.
- Follow the existing Harness gate: `npm run check`, `npm run build`, `npm run verify:dist`, and Electron trial packaging.

## Product Behavior

- First launch shows an empty talent library state instead of seeded candidates.
- The user imports a local folder from the Electron desktop client.
- The desktop process scans supported resume files and extracts text locally.
- Supported parsing targets are PDF, DOCX, TXT, Markdown, and best-effort DOC.
- Parsed candidates are stored in a local JSON database under Electron `userData`.
- The app renders talent library, search results, import task status, and candidate detail from the local database.
- Demo folder entry points are disabled in packaged/local-library mode.

## Local Database

The first trial uses a JSON database instead of SQLite to avoid native dependency risk in the unsigned Electron package. The database stores:

- candidates
- import tasks
- sources
- timestamps and summary stats
- original file metadata and paths
- extracted resume text snippets

Original resume files are not modified, moved, uploaded, or copied.

## Parsing Rules

- PDF: extract text locally with the packaged parser.
- DOCX: extract text locally with the packaged parser.
- TXT/MD: read text directly.
- DOC: attempt macOS `textutil` conversion when available; otherwise mark as unsupported for conversion.
- Empty or unreadable files create failed task rows instead of fake candidates.

## Acceptance Criteria

- No seeded demo candidates are shown in desktop local-library mode.
- Importing a folder creates candidate records from real local files.
- Parsed records persist after app restart.
- Search/talent views use local records, not static demo records.
- The trial DMG contains the desktop parser and local database code.
- `npm run check`, `npm run build`, `npm run verify:dist`, and `npm run desktop:build:trial` pass.
- Changes are committed and pushed to `origin/main`.
