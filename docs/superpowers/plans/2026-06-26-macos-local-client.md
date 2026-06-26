# macOS Local Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package DeerRecall as a local macOS desktop client for user acceptance testing.

**Architecture:** Reuse the existing static build output in `dist` and add a minimal desktop wrapper. Prefer Tauri v2, with Electron as fallback only if Rust/Cargo cannot be installed or used locally.

**Tech Stack:** Plain HTML/CSS/JavaScript, Node.js scripts, Tauri v2, Rust/Cargo, macOS Command Line Tools.

**Execution Result:** Rust/Cargo installation stalled during local setup, so the acceptance-testable macOS app was produced with the Electron fallback. Tauri scaffolding remains in the repository for a future smaller-runtime build after Rust/Cargo is available.

---

### Task 1: Add Desktop Packaging Validation

**Files:**
- Modify: `tests/homepage-structure.test.js`
- Modify: `package.json`

- [ ] Add tests that require desktop scripts in `package.json`.
- [ ] Add tests that require Tauri source and configuration files when Tauri is selected.
- [ ] Run `npm test` and confirm the new tests fail before adding implementation files.

### Task 2: Add Tauri Desktop Wrapper

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/icons/icon.svg`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] Add Tauri npm scripts that run the existing static build before packaging.
- [ ] Add minimal Rust entrypoint and Tauri config that loads `../dist`.
- [ ] Add local macOS bundle metadata for DeerRecall.
- [ ] Ensure generated Tauri build outputs stay out of git.

### Task 3: Build and Verify the Local App

**Files:**
- No source files expected beyond Task 2.

- [ ] Install required Node dependencies.
- [ ] Install Rust/Cargo if missing.
- [ ] Run `npm run check`.
- [ ] Run `npm run desktop:build`.
- [ ] Locate the generated `.app` and verify it opens the built DeerRecall UI.
- [ ] Report the exact app path to the user for acceptance testing.
