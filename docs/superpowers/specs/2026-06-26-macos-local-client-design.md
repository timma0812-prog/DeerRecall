# macOS Local Client Design

## Goal

Package the current DeerRecall static web prototype as a local macOS desktop client that can be opened from Finder without publishing to the Mac App Store.

## Approved Scope

- Build a local macOS `.app` for user acceptance testing.
- Do not submit to the Mac App Store.
- Do not add Developer ID signing, notarization, or auto-update in this pass.
- Keep the existing static web app behavior unchanged.
- Reuse the existing `npm run build` pipeline and `dist` artifact.

## Recommended Approach

Use Tauri v2 as the first-choice desktop wrapper because the current app has no backend, no database, and no Node runtime dependency. Tauri can package the existing static `dist` output into a native macOS app with a small runtime footprint.

If the local machine cannot build Tauri because Rust/Cargo installation is blocked, use Electron as a fallback to produce a local `.app` with the existing Node toolchain.

## Architecture

- Frontend source remains `index.html`, `styles.css`, and `app.js`.
- `npm run build` continues to copy runtime files into `dist`.
- A new desktop wrapper loads the built `dist/index.html`.
- Desktop packaging scripts are added to `package.json`.
- Release validation is extended to check for required desktop packaging metadata.

## Acceptance Criteria

- `npm run check` passes.
- `npm run build` and `npm run verify:dist` pass.
- A macOS desktop app artifact is generated locally.
- The generated app launches and displays DeerRecall.
- No App Store, signing, notarization, backend, database, or AI service work is included.
