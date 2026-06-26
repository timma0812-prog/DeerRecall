# DeerRecall MVP Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, lightweight DeerRecall desktop-client prototype that showcases the DeerSearch and DeerFind homepage.

**Architecture:** Use a plain static frontend with one HTML page, one CSS file, and one small JavaScript file. The page uses seeded candidate data and local interactions only; no backend, file parsing, or cloud model integration is included.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser-native APIs.

---

### Task 1: Static App Shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

- [ ] Add a Mac-style desktop window frame, left navigation, center DeerSearch workspace, and right DeerFind panel.
- [ ] Use purple glass surfaces, soft glow, and rounded client-window treatment inspired by the provided screenshot.
- [ ] Add sample search content and candidate results for a payment-risk Java backend query.

### Task 2: Lightweight Interactions

**Files:**
- Modify: `app.js`

- [ ] Add clickable suggested prompts that populate the DeerSearch input.
- [ ] Add candidate shortlisting so selected people appear in DeerFind.
- [ ] Add simple search submission that updates the current query label and result count.

### Task 3: Visual Verification

**Files:**
- Create screenshots under `output/playwright/`

- [ ] Open the local prototype in a browser.
- [ ] Check desktop layout for non-overlap, readable Chinese text, and visible three-column structure.
- [ ] Check a narrower viewport to confirm panels remain usable.
