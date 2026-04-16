# Test Strategy — rem-waste Booking Flow Assessment

> Input: [ASSESSMENT.md](../ASSESSMENT.md). Consumers: `app-builder`, `manual-test-author`, `test-automation-engineer`, `bug-report-author`, `evidence-collector`. This doc makes the judgment calls the rubric leaves open.

## System under test

A 4-step skip-booking web app: postcode → waste type (with plasterboard branching) → skip selection (with disabled states) → review + confirm. Mocked via MSW in-browser so the demo deploys as a static bundle (see [CLAUDE.md](../CLAUDE.md)). The API contract (§5) and four deterministic fixture postcodes (§4) are locked; everything else is implementation freedom inside the richness gates (§2).

## Risk register

Ranked by where real defects are most likely to land *for this shape of app*.

| Area | Impact | Likelihood | Priority | Why risky here |
| ---- | ------ | ---------- | -------- | -------------- |
| Plasterboard branching — deselect bleed | High | High | P1 | Classic wizard bug: `plasterboardOption` persists in state after checkbox unticks |
| Confirm double-submit | Critical | High | P1 | §3 explicitly calls out prevention; naive implementations disable only after the request returns, not on click |
| Heavy-waste → disabled-skip re-evaluation across revisits | High | Medium | P2 | Step 3 must re-derive from Step 2; easy to cache the first response and miss |
| BS1 4DJ retry logic | High | Medium | P2 | MSW counter state is easy to get wrong; "retry" button that doesn't actually re-fire is a common miss |
| Fast postcode change race | Medium | Medium | P3 | Needs `AbortController` on in-flight requests; stale response overwrites UI |
| Accessibility — disabled skip reason, focus on step change, `aria-live` on errors | Medium | High | P2 | §9 scores a11y explicitly; disabled-via-opacity is the default mistake |
| Mobile responsive skip grid | Medium | Medium | P3 | 8 cards at 375px is tight; tap targets ≥44×44 |
| Price breakdown arithmetic | High | Low | P2 | Wrong total = wrong charge; low likelihood only because it's static math, but impact demands verification |

## Two automated E2E flows (§8 — exactly two)

Chosen to maximise rubric coverage in 2 flows. Each exercises multiple sections; together they cover every richness gate and every deterministic fixture that makes sense to automate.

### Flow A — General waste happy path

**Scenario**: `SW1A 1AA` → select address → General waste → 4-yard skip → review + confirm.

**Steps (asserted at each)**:
1. Load `/`. Assert Step 1 heading, postcode input focused.
2. Enter `SW1A 1AA`, click **Find address**. Assert loading indicator appears, then ≥12 addresses render.
3. Select an address (e.g. `10 Downing Street`). Assert **Continue** becomes enabled.
4. Advance to Step 2. Assert waste-type heading, no selection made.
5. Tick **General waste** only. Advance. Assert `POST /api/waste-types` fired with `{ heavyWaste: false, plasterboard: false, plasterboardOption: null }` (via `page.waitForRequest`).
6. On Step 3, assert ≥8 skip cards rendered, all enabled for general waste.
7. Select **4 Yard Skip**. Advance. Assert review summary shows postcode, address, waste type, skip, and a price breakdown whose lines sum to the displayed total.
8. Click **Confirm booking**. Assert button disables immediately. Assert success screen with booking ID matching `/^BK-\d+$/`.

**Rubric coverage**: §2 general path, 12+ addresses, 8+ skips, price breakdown · §3 all four steps · §4 SW1A 1AA · §5 all four endpoints · §8 flow #1.

### Flow B — Heavy waste + plasterboard branching + retry recovery

**Scenario**: `BS1 4DJ` (retry after 500) → select address → Heavy waste ON + Plasterboard ON (handling option "Under 10%") → verify ≥2 skips disabled with reason → pick enabled skip → review → confirm.

**Steps (asserted at each)**:
1. Enter `BS1 4DJ`, click **Find address**. Assert error state with `role="alert"` and a **Retry** button.
2. Click **Retry**. Assert a new `POST /api/postcode/lookup` fires, loading, then address list.
3. Select an address, advance.
4. Tick **Heavy waste** AND **Plasterboard**. Assert the 3 plasterboard handling options appear. Select **Under 10% of load**. Advance.
5. On Step 3, assert ≥2 skips rendered with `aria-disabled="true"` and visible reason text. Assert they cannot be selected by click.
6. Select an enabled skip (e.g. 6-yard). Advance.
7. Review summary includes: heavy waste yes, plasterboard yes + handling option, skip, price breakdown.
8. **Double-click Confirm rapidly.** Assert exactly one `POST /api/booking/confirm` is captured, and the button is disabled after the first click.
9. Assert success screen with booking ID.

**Rubric coverage**: §2 heavy + plasterboard paths, 3 handling options, disabled skips visible, error + retry · §3 branching in Step 2, disabled logic in Step 3, double-submit prevention in Step 4 · §4 BS1 4DJ retry + heavy-waste disabling · §7 touches the highest-risk bug areas · §8 flow #2.

### Deliberately *not* automated

- `EC1A 1BB` (empty state) — covered by manual + contract test.
- `M1 1AE` (latency) — covered by manual; automating timing is fragile.
- Back-navigation state transitions — covered by manual state-transition cases.

## API contract tests (`automation/tests/api/`)

Short, fast, complement the E2E flows. One spec per endpoint hitting the `request` fixture against the dev server with MSW active:

- `postcode.spec.ts` — validates all four fixture postcodes against §5 shape using zod.
- `waste-types.spec.ts` — posts each combination, validates `{ ok: true }`.
- `skips.spec.ts` — general vs heavy, asserts ≥2 disabled when heavy.
- `booking-confirm.spec.ts` — happy path + idempotency assumption check.

## Manual-test bucketing (§6 — ≥35 total)

Concrete distribution. Sub-minima met with ~10% margin on each. Totals: **38 cases · 10 positive · 11 negative · 7 edge · 5 API-failure · 5 state-transition**.

| Area           | Positive | Negative | Edge | API-fail | State-trans | **Total** |
| -------------- | -------- | -------- | ---- | -------- | ----------- | --------- |
| Postcode       | 2        | 4        | 2    | 2        | 1           | 11        |
| Waste Type     | 2        | 2        | 1    | 1        | 1           | 7         |
| Skip           | 2        | 2        | 2    | 1        | 1           | 8         |
| Review         | 2        | 2        | 1    | 1        | 1           | 7         |
| Cross-cutting  | 2        | 1        | 1    | 0        | 1           | 5         |
| **Total**      | **10**   | **11**   | **7**| **5**    | **5**       | **38**    |

### Example case titles per cell (sketch — `manual-test-author` expands)

**Postcode (11)**
- *Positive*: SW1A 1AA returns populated list; manual-entry fallback.
- *Negative*: invalid format `XYZ`; empty submit; whitespace-only; 20-char garbage.
- *Edge*: lowercase `sw1a 1aa` normalized; padded `  SW1A  1AA  ` trimmed.
- *API-failure*: BS1 4DJ 500 + retry succeeds; M1 1AE latency shows spinner ≥1s then resolves.
- *State-transition*: change postcode after address selected → address clears.

**Waste Type (7)**
- *Positive*: general only; heavy only.
- *Negative*: advance with no selection blocked; plasterboard ticked but no handling option.
- *Edge*: all three types simultaneously accepted and payload correct.
- *API-failure*: `POST /api/waste-types` 500 → error + retry.
- *State-transition*: plasterboard deselect clears `plasterboardOption` in state and in outgoing payload.

**Skip (8)**
- *Positive*: select 4-yard under general; select enabled skip under heavy.
- *Negative*: click on disabled skip is no-op and announces reason; advance with no skip selected.
- *Edge*: size normalization `4-yard` → `4 Yard Skip`; mobile 375px — disabled skip still visible with reason legible.
- *API-failure*: `GET /api/skips` 500 → error state with retry.
- *State-transition*: toggle heavy OFF in Step 2 after reaching Step 3 → revisit shows previously-disabled skips re-enabled.

**Review (7)**
- *Positive*: confirm happy path shows booking ID; edit back to Step 2 and return — summary updated.
- *Negative*: confirm while network offline → error, confirm button re-enabled; confirm with tampered state (missing skip) → blocked.
- *Edge*: price breakdown lines sum exactly to total.
- *API-failure*: `POST /api/booking/confirm` 500 → error + retry + eventual success.
- *State-transition*: after successful confirm, browser back does not allow re-submission.

**Cross-cutting (5)**
- *Positive*: full flow keyboard-only; full flow at 375×667 mobile viewport.
- *Negative*: direct URL to `?step=review` without prior state → redirected to Step 1.
- *Edge*: page refresh mid-flow behaves per spec (state lost or restored — document what).
- *State-transition*: rapid back/forward between steps leaves consistent state (no orphan selections).

## Bug-hunt hotspots (for `bug-report-author`)

Ranked — probe top to bottom until ≥3 real defects documented (≥1 tagged state-transition/branching per §7).

1. **Plasterboard deselect state bleed** — branch in, pick option, branch out; check payload and review.
2. **Double-submit on Confirm** — rapid double-click; inspect Network tab for single request.
3. **Heavy-waste revisit** — back from Step 3, toggle heavy OFF, forward; do previously-disabled skips re-enable?
4. **BS1 4DJ retry** — does the retry button re-fire the request? Does the error clear? Does the 2nd success actually populate?
5. **Postcode race** — type `SW1A 1AA`, click Find, immediately change to `EC1A 1BB`, click Find; which response wins?
6. **Keyboard focus on step change** — does focus move to the next step's heading or get lost on `<body>`?
7. **Disabled skip a11y** — does a screen reader announce "disabled — not available for heavy waste" or just "dimmed"?
8. **Price arithmetic** — does breakdown sum == total across every skip price?
9. **Mobile tap targets** — measure skip cards and step nav buttons at 375px; any <44px?
10. **Refresh / back after confirm** — state integrity post-submission.

## Non-functional targets (§9)

- **Lighthouse desktop**: Performance ≥90, A11y ≥95, BP ≥95, SEO ≥90.
- **Lighthouse mobile**: Performance ≥80, A11y ≥95, BP ≥95, SEO ≥90.
- **axe**: zero critical or serious violations across all four step URLs.
- **Responsive capture**: 375×667 and 1280×800.
- **Video**: 75–110s, covers Flow B (has the most visually interesting states — retry, disabled skips, price breakdown, double-click prevention).

## First milestone — thinnest parallel-unblocking slice

Goal: get `app-builder` and `test-automation-engineer` both able to work in parallel within the first pass.

1. **`ui/` scaffold**: Vite + React + TS + Tailwind. MSW init (`npx msw init public/`). Wire `setupWorker` in `main.tsx` dev-only.
2. **`ui/src/mocks/handlers.ts`**: only `POST /api/postcode/lookup` implemented, using the four fixture postcodes from §4 with the addresses list (≥12 for SW1A 1AA, 0 for EC1A 1BB, delay for M1 1AE, retry counter for BS1 4DJ).
3. **`ui/src/api/schemas.ts`**: zod schemas for all four endpoints (schemas only; only lookup is called at this milestone).
4. **Step 1 component**: postcode input with validation, call to lookup, loading/error/empty/populated states with retry button.
5. **`automation/` scaffold**: `playwright.config.ts`, `tests/fixtures/test-fixtures.ts` with a basic `page` fixture, one page object for Step 1, one smoke spec: "SW1A 1AA returns 12+ addresses."

Exit criteria: `cd ui && npm run dev` serves a working Step 1; `cd automation && npx playwright test` passes one smoke test against it.

After milestone 1 passes: `app-builder` continues with Steps 2–4 and the remaining handlers; `test-automation-engineer` builds out Flow A + Flow B and the API contract specs in parallel; `manual-test-author` begins drafting cases against the growing app.

## Handoffs

- → **`app-builder`**: implement the app per this strategy, honoring the two automated flows as the most-stressed paths. Build MSW handlers for all four fixture postcodes in milestone 1. Plasterboard, heavy-waste, disabled-skip, and double-submit-prevention get extra polish — they're the highest-risk areas per the risk register.
- → **`test-architect`**: scaffold `automation/` per the layout in CLAUDE.md; the two flows above drive fixture design.
- → **`test-automation-engineer`**: implement Flow A and Flow B as specced, plus the four API contract specs. Flow B's double-click Confirm step must use `page.waitForRequest` counting to prove single-fire.
- → **`manual-test-author`**: expand the bucketing table into `manual-tests.md`. The example titles per cell are the starting set — flesh each out with full steps/expected per the agent's own rules.
- → **`bug-report-author`**: hunt top-to-bottom in the hotspot list. At least one bug must be a state-transition or branching bug per §7 — hotspots #1 and #3 are the best candidates.
- → **`evidence-collector`**: capture the 12 screenshot frames listed in the agent prompt for both viewports. Record Flow B for the video. Lighthouse + axe per targets above.
- → **`submission-auditor`**: gate on every §1–§9 line before submission.
