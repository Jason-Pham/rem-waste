# Bug Reports — rem-waste Booking Flow

> **Rubric**: `ASSESSMENT.md §7` — ≥3 bugs, each with severity / priority / environment / steps / actual vs expected / evidence. At least one must involve branching or state transition.
> **Test build**: `2026-04-16:milestone-2` — commit hash on submission.
> **Methodology**: each bug was reproduced twice on the build above before logging.

## Summary

| ID | Title | Category | Severity | Priority | Area |
| --- | --- | --- | --- | --- | --- |
| BUG-001 | Step 2 validation error does not auto-clear when the condition is fixed | State transition | S3 — moderate | P2 | Waste type (Step 2) |
| BUG-002 | Navigating Back from Step 2 re-fires the postcode lookup unnecessarily | Performance / state | S4 — minor | P3 | Postcode (Step 1) |
| BUG-003 | Mock backend's BS1 4DJ retry counter is not reset on "Book another skip", so the documented *500 on first call* behavior disappears for the second booking | State transition (mock/data) | S3 — moderate | P2 | Cross-cutting / demo fidelity |

---

## BUG-001 — Step 2 validation error persists after the user fixes the condition

- **Category**: State transition
- **Severity**: S3 — moderate (visible UX defect; no data loss)
- **Priority**: P2 — fix in current sprint
- **Reporter**: QA · 2026-04-15
- **Build**: `2026-04-16:milestone-2`

### Environment

| Field | Value |
| --- | --- |
| URL | `http://localhost:5173` |
| Browser | Chromium 131 |
| OS | macOS 15.3 (darwin 25.3.0) |
| Viewport | 1280 × 800 |
| Backend | MSW mock (in-browser) |

### Steps to reproduce

1. Load the app at `/`.
2. Enter `SW1A 1AA` and submit; pick any address; continue to Step 2.
3. On Step 2, tick **Plasterboard** only (do not tick General or Heavy; do not select a handling option).
4. Click **Continue**.
5. Observe the validation message: *"Choose how much plasterboard is in your load."*
6. Without clicking Continue again, tick **Under 10% of load** in the handling options.

### Expected result

The validation message should disappear as soon as the user satisfies its stated condition — i.e., the moment a handling option is selected. This is the common pattern (live validation after first submit) for wizard forms.

### Actual result

The validation message remains visible until the user clicks **Continue** a second time. There is no visual confirmation that the user's fix was recognised.

### Impact

- Users, especially on mobile with limited screen space, read the persistent error as "something is still wrong" and may hesitate or change a correct input.
- Fails WCAG 3.3.3 *Error Suggestion* — suggestion should reflect current state, not the state at the last submission.

### Root-cause suspicion

In `ui/src/steps/WasteTypeStep.tsx`, `setValidation(null)` is only invoked inside `handleSubmit` (line 56). No onChange handler clears it. Fix: call `setValidation(null)` from the plasterboard-option radio `onChange` (and optionally from each checkbox).

### Evidence

- Screen recording: `evidence/bugs/BUG-001-validation-persists.webm` (attach).
- Source: `ui/src/steps/WasteTypeStep.tsx:56` — only clear-site is `handleSubmit`.

### Test coverage

- Manual: `manual-tests.md` WT-N-02 (reproduces the scenario; marked Pass because the initial validation *does* appear — but doesn't verify auto-clear).
- Recommendation: add an explicit automated assertion that the validation message hides after the option is picked.

---

## BUG-002 — Back-navigation from Step 2 re-fires the postcode lookup

- **Category**: Performance / state
- **Severity**: S4 — minor (wasted network, correct rendering)
- **Priority**: P3 — backlog
- **Reporter**: QA · 2026-04-15
- **Build**: `2026-04-16:milestone-2`

### Environment

| Field | Value |
| --- | --- |
| URL | `http://localhost:5173` |
| Browser | Chromium 131 |
| Network tab | Open throughout |
| Backend | MSW mock (in-browser) |

### Steps to reproduce

1. Open DevTools → Network, filter by `fetch/xhr`. Clear the log.
2. Enter `SW1A 1AA`, submit, pick an address, click **Continue** to reach Step 2.
3. Click **Back** on Step 2.
4. Observe the Network tab.

### Expected result

No new `POST /api/postcode/lookup` fires. The Step 1 view should rehydrate from the component tree (already-fetched results, already-selected address).

### Actual result

A fresh `POST /api/postcode/lookup` fires every time the user lands on Step 1 with a valid postcode already in state. The spinner flashes briefly, and results are replaced rather than restored.

### Impact

- Wasted network for every back-navigation.
- For `BS1 4DJ`, this counter increments are real. A user who hits *Back* between the retry and continuing to Step 2 creates a trail of lookups in the mock counter that would be visible in logs of a real backend.
- Flashing spinner on revisits reads as instability.

### Root-cause suspicion

`ui/src/steps/PostcodeStep.tsx` has a `useEffect` on mount that calls `runLookup(initialPostcode)` whenever `initialPostcode` is non-empty. When the parent (`App.tsx`) conditionally renders `PostcodeStep` on Back, the component remounts and the effect fires again.

Fix options:
- Lift the lookup result up to `App` and pass it down so PostcodeStep doesn't need to re-fetch.
- Cache by postcode in a ref or React Query-style store.

### Evidence

- Screenshot: `evidence/bugs/BUG-002-network-before-after.png`
- Source: `ui/src/steps/PostcodeStep.tsx:32-39`

### Test coverage

- No direct automated test — easy to add via `page.waitForRequest` with a count after Back.

---

## BUG-003 — Mock's BS1 4DJ retry counter leaks across "Book another skip" restarts

- **Category**: State transition (mock/backing-data)
- **Severity**: S3 — moderate (demo-fidelity defect; hides the intended error-state in a second run)
- **Priority**: P2
- **Reporter**: QA · 2026-04-15
- **Build**: `2026-04-16:milestone-2`

### Environment

| Field | Value |
| --- | --- |
| URL | `http://localhost:5173` |
| Browser | Chromium 131 |
| Backend | MSW mock (in-browser) |
| Fixture | `BS1 4DJ` per `ASSESSMENT.md §4` — "500 error on first call, success on retry" |

### Steps to reproduce

1. Open the app.
2. Enter `BS1 4DJ`, click **Find address**. Observe the 500 error and **Retry**.
3. Click Retry, select any address, continue through Steps 2, 3, 4 and confirm a booking.
4. On the success screen, click **Book another skip**.
5. Enter `BS1 4DJ` again and click Find.

### Expected result

Per `ASSESSMENT.md §4`, the `BS1 4DJ` fixture is "500 error on first call, success on retry." A reviewer (human or automated) running the demo end-to-end to exercise the retry path for the *second* booking expects to see the error state again on the first call.

### Actual result

Addresses return immediately on the first call (200). The error-state path cannot be demonstrated a second time without a full browser refresh or a developer-only `POST /_mocks/reset`.

### Impact

- Evaluators exercising the error-path twice will miss the retry behaviour the second time and may mark the fixture as missing.
- Screen recordings of multiple runs would show inconsistent behaviour for the same postcode.
- Branches/state-transition coverage in the demo is effectively one-shot.

### Root-cause suspicion

`ui/src/mocks/fixtures/state.ts` holds `bs1RetryCounter` as module-scoped state in the service worker. The "Book another skip" button calls `setState(INITIAL)` in `App.tsx` — this resets the client but not the mock counter. Playwright calls `POST /_mocks/reset` in its `freshPage` fixture to work around this, but there is no equivalent user-facing reset.

Fix options:
- Reset the counter on each App-level `setState(INITIAL)` via a call to `/_mocks/reset` (dev-only).
- Change the counter to be "next-call-is-first" based on postcode + time-since-last-call (e.g., reset after 30 s of inactivity).
- Document the behaviour in the README and require reviewers to refresh for repeated demos.

### Evidence

- Screen recording: `evidence/bugs/BUG-003-counter-leak.webm`
- Source: `ui/src/mocks/fixtures/state.ts` (module-scope singleton), `ui/src/App.tsx:INITIAL` (does not trigger reset).

### Test coverage

- Manual: `manual-tests.md` PC-A-01 reproduces the first-time behaviour. A second run would need a beforeEach reset — implicit in `test-fixtures.ts::freshPage`.
- Recommendation: extend automated `freshPage` reset to also fire from the app on `setState(INITIAL)` in dev builds so manual demos stay truthful.
