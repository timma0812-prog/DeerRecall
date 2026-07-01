# Neon Talent Motion System Design

## Summary

DeerRecall will add a product-wide motion system that makes the static recruiting workspace feel younger, more dynamic, and more AI-native while staying compatible with the current frontend architecture.

The selected direction is **Level 2: Neon Talent OS**:

- Visual thesis: AI command-center energy with neon signal light, dark glass surfaces, and controlled scanning moments.
- Interaction thesis: candidate cards and operational rows move like a kinetic talent flow, especially during search, filtering, sorting, importing, and detail transitions.
- Product boundary: motion should make the product feel intelligent and alive without reducing recruiting information density or breaking the existing desktop/static runtime.

This design covers DeerSearch, resume import, talent library, and candidate resume detail. It does not redesign the app shell, change the product information architecture, or introduce React/Vite.

## Goals

- Make the product feel more attractive to young individual users through polished, visible motion.
- Keep the existing static frontend system: `index.html`, `styles.css`, `app.js`, and `deersearch-engine.js`.
- Add GSAP as a local static runtime dependency, not a CDN dependency.
- Keep Electron, Tauri, Docker, Node static serving, and Harness delivery compatible.
- Make motion progressive enhancement: the product must remain fully usable when GSAP is missing or reduced motion is requested.
- Add visual QA criteria so animation cannot cause border mismatch, overflow, layout jumping, overlap, or clipped content.

## Non-Goals

- No React, Vue, Vite, Next.js, or bundler migration.
- No CDN-hosted animation library.
- No full app-shell layout redesign.
- No animation that changes business logic, search ranking, import results, local persistence, AI requests, or Electron IPC behavior.
- No marketing-page style scroll storytelling inside the recruiting workspace.
- No always-on decorative motion that distracts from repeated recruiting work.

## Current Frontend Constraints

DeerRecall is currently a static browser app with desktop wrappers:

- `index.html` loads relative static scripts.
- `styles.css` owns all visual styling.
- `app.js` owns UI state, event handling, local library rendering, AI requests, and desktop IPC calls.
- `deersearch-engine.js` owns local search and AI rerank helpers.
- `scripts/build-static.mjs` copies a strict set of runtime assets into `dist`.
- `scripts/verify-dist.mjs` rejects missing, extra, empty, or invalid runtime assets.
- Electron loads `dist/index.html` through `file://`.
- Tauri points at `../dist`.
- Docker serves prebuilt `dist`.
- Harness runs `npm run check`, `npm run build`, and `npm run verify:dist`.

Any motion implementation must respect that contract.

## Architecture

Add a thin static motion layer:

```text
vendor/gsap.min.js
vendor/Flip.min.js
motion.js
```

Recommended script order:

```html
<script src="vendor/gsap.min.js"></script>
<script src="vendor/Flip.min.js"></script>
<script src="motion.js"></script>
<script src="deersearch-engine.js"></script>
<script src="app.js"></script>
```

`motion.js` exposes a browser global:

```javascript
window.DeerRecallMotion = {
  enterView(name, root),
  enterSearchResults(root),
  flipSearchCards(mutator),
  flipFilterChips(mutator),
  enterImportState(state, root),
  updateImportProgress(nodes, value),
  enterTalentView(root),
  pulseTalentSelection(item),
  enterResumeDetail(root),
  enterResumePanel(root),
  enterMarketInsight(root)
};
```

The API is intentionally small. `app.js` remains the source of truth for state. `motion.js` only animates DOM elements that already exist or have just been rendered.

All calls from `app.js` use optional chaining:

```javascript
window.DeerRecallMotion?.enterSearchResults?.(resultsState);
```

All motion methods are safe no-ops when:

- `window.gsap` is missing.
- `prefers-reduced-motion: reduce` is active.
- The target element is missing.
- The target element is hidden or detached.

## GSAP Usage Rules

Use GSAP for timeline sequencing, staggered entrances, progress tweening, and Flip layout transitions.

Use GSAP properties that stay on compositor layers:

- `x`
- `y`
- `scale`
- `autoAlpha`
- `opacity`
- CSS variables used only for light intensity or transform-safe visuals

Avoid animating:

- `width`
- `height`
- `top`
- `left`
- `margin`
- `padding`
- grid template values
- scroll container dimensions

Register `Flip` once inside `motion.js` only if it is available:

```javascript
if (window.gsap && window.Flip) {
  window.gsap.registerPlugin(window.Flip);
}
```

Do not monkey-patch existing global functions. Prefer explicit hooks inside existing state functions in `app.js`.

## Visual Language

The system should read as **AI command center plus kinetic candidate flow**.

Use these visual motifs sparingly:

- Scan light on DeerSearch transitions.
- Neon edge glow on active candidate or active import state.
- Staggered candidate card arrival.
- Smooth Flip movement for card and row reordering.
- Short completion pulse on import success.
- Layered reveal for resume detail.

Avoid:

- Permanent animated backgrounds.
- Multiple competing neon colors in one panel.
- Large decorative objects floating above operational UI.
- Motion that blocks clicks or covers candidate data.
- Uncoordinated border, radius, or shadow styles.

## Design System Constraints

Motion must preserve the existing shell and visual discipline:

- Do not change the main three-column workspace proportions as part of this motion feature.
- Do not add cards inside cards.
- Do not introduce inconsistent border radii.
- Keep card radii at or below existing product patterns unless a current component already uses a larger radius.
- Keep line weights visually consistent with the current glass UI.
- Animated elements must stay inside their parent clipping and layout bounds.
- No animation may create horizontal overflow.
- No text may overlap previous or following content during animation.
- Buttons and interactive controls must stay clickable throughout.
- Decorative animated layers use `pointer-events: none`.
- Strong neon effects are reserved for active or transitional states, not every card.
- Search, import, talent, and resume surfaces should share timing and easing so motion feels like one system.

## Core Experience 1: DeerSearch

### User Feel

Submitting a query should feel like asking an AI system to scan the local talent universe. Results should appear as if they are being identified, ranked, and locked into place.

### Motion Sequence

1. Search submit:
   - Query bubble appears quickly.
   - AI answer area fades and slides into place.
   - A restrained scan light passes across the results area.

2. Result render:
   - Candidate cards enter with a stagger.
   - Score badges pulse once on high-match candidates.
   - Tags appear after card body text, not before.

3. Sort and filter:
   - Existing candidate cards use GSAP Flip to move to their new positions.
   - Hidden cards fade and compress visually only if this can be done without fighting the `hidden` attribute. Otherwise, use enter/reorder only.
   - Filter chips use Flip when added, removed, or re-rendered.

### Technical Hooks

- `showResults(queryText, options)`
- `applySearchResultModel(result)`
- `renderSearchResultState(result)`
- `sortSearchCandidates()`
- `applySearchResultFilters()`
- `addSearchFilterChip()`
- `removeSearchFilterChip(button)`
- `renderSearchFilterChips(chips)`

### Stable Selectors

- `#resultsState`
- `[data-local-search-list]`
- `.candidate-card[data-search-score]`
- `[data-search-filter-bar]`
- `[data-search-filter-chip]`
- `[data-search-sort-toggle]`
- `[data-search-city-toggle]`
- `[data-search-conversation-answer]`

### Guardrails

- Do not delay the actual search result render for animation.
- Do not make AI loading appear as if the ranking is done before data is ready.
- Do not animate long AI answer text in a way that causes right-rail overflow.

## Core Experience 2: Resume Import

### User Feel

Import should feel like a visible AI processing pipeline: local source selected, files inspected, text parsed, candidates added, and issues surfaced.

### Motion Sequence

1. Default state:
   - Drop zone reacts to drag with a small border/light lift.
   - Import method buttons get immediate hover/press feedback.

2. Preview state:
   - Source name and path reveal first.
   - Metric cards count in with short numeric tweens.
   - Supported/duplicate/failed values remain readable and stable.

3. Loading state:
   - Progress bar animates between real values.
   - Active file rows enter vertically with light stagger.
   - Existing CSS spinner and import icon float remain unless they conflict with GSAP.

4. Finished state:
   - Completion badge pulses once.
   - Result stats reveal as a group.
   - Primary next action receives a short focus cue.

### Technical Hooks

- `showImportState(nextState)`
- `openImportPickerCard(mode)`
- `handleImportFiles(...)`
- `applyDesktopImportResult(selectedImport, fallbackMessage)`
- `setImportAssistantProgress(payload)`
- `setImportAssistantResult(source)`
- `updateImportPreview(source)`

### Stable Selectors

- `#importState`
- `[data-import-state]`
- `[data-import-drop-zone]`
- `[data-import-stat]`
- `[data-import-loading-progress]`
- `[data-import-loading-percent]`
- `[data-import-loading-file]`
- `[data-import-open]`

### Guardrails

- Do not animate file counts so slowly that users distrust progress.
- Do not move the drop zone while the user is dragging over it.
- Do not block Electron file picker calls with animation.
- Do not introduce fake progress beyond values supplied by app state.

## Core Experience 3: Talent Library

### User Feel

The talent library should feel like a living candidate flow. Filtering and selecting candidates should keep spatial continuity so users understand what changed.

### Motion Sequence

1. Opening talent library:
   - KPI row reveals quickly.
   - Active list rows enter with a controlled stagger.
   - Right assistant panel fades in after list context appears.

2. Switching talent tabs:
   - Active tab changes immediately.
   - New list rows reveal in place.
   - Right panel content crossfades or reveals vertically.

3. Selecting a candidate:
   - Selected row gets a neon edge pulse.
   - Right panel updates with a short reveal.

4. Sorting or moving task rows:
   - Use Flip where existing elements are appended or moved.
   - Use simple stagger where `innerHTML` rebuilds element identity.

### Technical Hooks

- `showTalentState(filter)`
- `setTalentFilter(filter)`
- `showTalentPanel(panelName)`
- `selectTalentItem(item)`
- `renderLocalTalentRows(candidates)`
- `renderLocalSources(library)`
- `renderLocalImportTasks(library)`
- `updateImportTaskRow(task)`

### Stable Selectors

- `#talentState`
- `[data-talent-view]`
- `[data-talent-item]`
- `[data-talent-filter]`
- `[data-talent-panel]`
- `[data-local-candidate-list]`
- `[data-local-source-list]`
- `[data-local-task-list]`

### Guardrails

- Do not animate rows outside the scroll container.
- Do not increase row height during selection pulse.
- Do not reduce density of candidate tags or source metadata.
- Use keyed data attributes such as `data-candidate-id` and `data-task-id` when available.

## Core Experience 4: Candidate Resume Detail

### User Feel

Opening a candidate should feel like zooming into a focused profile. The hero, match score, tags, tabs, and detail cards should reveal in a clear hierarchy.

### Motion Sequence

1. Open detail:
   - Resume hero enters first.
   - Avatar, name, status, match score, and actions reveal in sequence.
   - Detail cards reveal with a short stagger.

2. Switch detail tab:
   - Tab state changes immediately.
   - New panel reveals with `autoAlpha` and small `y`.
   - Existing panel is hidden by current state logic without waiting on long exit animation.

3. Market insight:
   - Loading state uses subtle pulse.
   - Completed result sections reveal top to bottom.

### Technical Hooks

- `openCandidateResume(candidateId, options)`
- `showCandidateResumePanel(viewName)`
- `updateCandidateResume(candidate)`
- `setMarketInsightState(state, message)`
- `renderMarketInsight(insight)`

### Stable Selectors

- `#candidateResumeState`
- `[data-candidate-resume-panel]`
- `[data-candidate-resume-tab]`
- `.resume-profile-hero`
- `.resume-detail-card`
- `[data-market-insight-card]`
- `[data-market-insight-result]`

### Guardrails

- Replace or disable existing `resumeRise` CSS animation when GSAP owns resume detail motion.
- Do not animate resume document preview in a way that affects scroll readability.
- Do not hide focusable controls before focus/ARIA state updates.

## Reduced Motion and Fallback

`motion.js` must check reduced motion once and expose a helper:

```javascript
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

When reduced motion is enabled:

- Page and panel transitions become instant.
- Flip reordering is skipped.
- Progress values update immediately.
- Existing CSS animations that remain should be disabled or kept minimal through a CSS reduced-motion block.

If GSAP or Flip fails to load:

- All app functions continue.
- No errors are thrown.
- Existing CSS layout and state classes continue to work.

## Build and Runtime Asset Contract

Update runtime asset handling to include:

```text
index.html
styles.css
deersearch-engine.js
app.js
motion.js
vendor/gsap.min.js
vendor/Flip.min.js
```

Required updates:

- `index.html`: add script tags in the approved order.
- `scripts/build-static.mjs`: copy `motion.js` and `vendor/`.
- `scripts/verify-dist.mjs`: verify top-level files and recursive vendor files.
- `package.json`: add `node --check motion.js` to `npm run check`.
- `tests/homepage-structure.test.js`: assert script order, asset contract, reduced motion guard, and static delivery updates.
- `README.md`: document local motion runtime assets and offline behavior.
- `.harness/deerrecall-ci-cd.yaml`: add smoke/cache checks for `motion.js` and vendor scripts.

Do not rely on `npm install gsap` alone. A package dependency does not place GSAP into the static browser runtime without a bundler.

## Harness Requirements

Harness must continue to run the existing pipeline order:

```text
npm run check -> npm run build -> npm run verify:dist -> docker build -> docker compose up -d -> release smoke checks
```

New release smoke checks must include:

- `/motion.js`
- `/vendor/gsap.min.js`
- `/vendor/Flip.min.js`

All JS and CSS runtime assets should continue to use the existing no-cache policy unless the app later adds hashed filenames.

## Worktree and Subagent Development Process

Development happens in an isolated worktree:

```text
.worktrees/codex/neon-talent-motion-system
```

Branch:

```text
codex/neon-talent-motion-system
```

The main workspace remains clean except for the already committed ignore-rule setup.

The implementation plan should use subagent-driven development:

1. Build/static asset contract worker.
2. Motion runtime API worker.
3. DeerSearch and Flip worker.
4. Import and talent library worker.
5. Candidate resume detail and market insight worker.
6. Final compatibility and visual QA reviewer.

Workers must receive disjoint file ownership where possible and must not revert one another's edits.

## ROPE Operating Model

For this project, "rope" is treated as the operating discipline for keeping design and implementation tied together:

- **R**equirements: young-user, Level 2 Neon Talent OS, four core flows, existing frontend compatibility.
- **O**ptions: local vendor GSAP, isolated `motion.js`, explicit app hooks, reduced-motion fallback.
- **P**lan: write a task-level implementation plan before code changes.
- **E**xecute: use worktree, Harness gates, and subagent review loops.

If a separate concrete ROPE tool or framework is required later, it should be added to the implementation plan only after confirming its local availability and compatibility with the current static app.

## Testing Strategy

Required automated checks:

```bash
npm test
npm run check
npm run build
npm run verify:dist
```

Add or update tests for:

- `index.html` script order.
- `motion.js` exists and is syntax-checked.
- Build script copies `motion.js` and `vendor/`.
- Dist verification expects and validates vendor assets.
- Harness checks new static assets.
- Reduced-motion fallback exists in JS and CSS.
- Motion hooks are optional and do not replace business logic.

Required manual or browser-assisted QA:

- Desktop wide viewport: three-column shell stays aligned.
- Standard desktop viewport: cards, panels, and right rail do not overlap.
- Narrow viewport: no animation-created horizontal overflow.
- DeerSearch: submit, sort, filter, city filter, AI answer history restore.
- Import: default, preview, loading, finished, cancel, drag/drop.
- Talent library: tabs, row selection, source view, pending and duplicate views.
- Candidate detail: open from search and talent, switch tabs, run market insight.
- Reduced motion: all flows remain usable with animation disabled.
- Electron file loading: `vendor/` and `motion.js` load from `file://`.

## Visual QA Checklist

Before completion, verify:

- No component moves outside its parent container during animation.
- No new horizontal scrollbar appears.
- No text overlaps adjacent content while animating.
- No button is hidden behind an animated overlay.
- Animated overlays use `pointer-events: none`.
- Border radii and borders match existing DeerRecall surfaces.
- Hover, focus, and active states remain visible.
- Candidate cards keep stable dimensions during hover, filtering, sorting, and entry.
- Talent rows keep stable heights during selection pulse.
- Import progress and metrics do not resize their parent panel.
- Resume detail cards do not fight the existing scroll container.

## Risks and Mitigations

### Risk: `.state-hidden` uses `display: none !important`

GSAP cannot animate elements once display-none is applied.

Mitigation:

- First phase focuses on enter animations after reveal.
- Use Flip only around functions where element identity exists before and after mutation.
- Avoid complex exit animations until state visibility is centralized.

### Risk: `hidden` attribute defeats Flip exits

Search city filtering hides cards through `hidden`.

Mitigation:

- Capture Flip state before hiding when feasible.
- Prefer reordering and enter animation over exit animation if hidden state conflicts.

### Risk: `innerHTML` rebuilds list identity

Several render functions rebuild lists and lose DOM identity.

Mitigation:

- Use staggered enter for rebuilt lists.
- Use Flip only where existing nodes are moved, such as sort and task row movement.

### Risk: GSAP conflicts with CSS `resumeRise`

Existing resume detail CSS animation uses opacity and transform.

Mitigation:

- Disable or scope out `resumeRise` when GSAP owns resume detail motion.
- Keep a CSS fallback for missing GSAP if needed.

### Risk: offline desktop runtime misses vendor asset

Electron and Tauri load from static files.

Mitigation:

- Commit vendor files.
- Verify `dist/vendor/gsap.min.js` and `dist/vendor/Flip.min.js`.
- Smoke-check vendor files in Harness.

## Acceptance Criteria

The feature is acceptable when:

- DeerRecall has a local, progressive GSAP motion layer.
- DeerSearch, import, talent library, and candidate detail each have Level 2 motion.
- Existing frontend architecture remains static and desktop-compatible.
- All automated tests and static build verification pass.
- Harness asset checks include the new runtime files.
- Reduced motion works.
- Visual QA finds no overflow, inconsistent borders, out-of-frame animation, or interaction-blocking overlays.

