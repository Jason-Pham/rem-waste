# QA Assessment — Booking Flow (AI-Checkable, Real-World)

> Source of truth. Every deliverable is graded against this document. Do not paraphrase or drift — match verbatim where requirements are stated.

This assessment requires you to build and test a realistic booking flow with branching logic, rich data, realistic UI states, and meaningful test coverage. Submissions are graded strictly based on demonstrable evidence.

## 1) Submission Requirements (Non-Negotiable)

- Public demo link (no login, VPN, or expiry).
- Alternatively, Docker with single run command (e.g., `docker compose up`).
- Full source code (Git repo preferred).
- Required files: `README.md`, `manual-tests.md`, `bug-reports.md`, `automation/`, `ui/`.

## 2) Richness Gates (Mandatory)

- Multi-path flow: General waste, Heavy waste, Plasterboard (with 3 handling options).
- At least 12 addresses for one postcode and 0 addresses for another.
- At least 8 skip options with mixed enabled/disabled states.
- Loading, empty, and error states with retry functionality.
- Price breakdown in review step.

## 3) Functional Requirements

- **Step 1**: UK postcode validation, lookup call, address selection or manual entry.
- **Step 2**: Waste type selection with plasterboard branching logic.
- **Step 3**: Skip selection with normalization and disabled logic.
- **Step 4**: Review summary, price breakdown, confirm booking, prevent double submit.

## 4) Deterministic Fixtures (Mandatory)

| Postcode  | Behavior                                   |
| --------- | ------------------------------------------ |
| SW1A 1AA  | 12+ addresses                              |
| EC1A 1BB  | 0 addresses (empty state)                  |
| M1 1AE    | Simulated latency                          |
| BS1 4DJ   | 500 error on first call, success on retry  |

- Heavy waste disables at least 2 skip sizes.

## 5) API Contract (Must Match)

### `POST /api/postcode/lookup`

Request:
```json
{ "postcode": "SW1A 1AA" }
```

Response:
```json
{
  "postcode": "SW1A 1AA",
  "addresses": [
    { "id": "addr_1", "line1": "10 Downing Street", "city": "London" }
  ]
}
```

### `POST /api/waste-types`

Request:
```json
{ "heavyWaste": true, "plasterboard": false, "plasterboardOption": null }
```

Response:
```json
{ "ok": true }
```

### `GET /api/skips?postcode=SW1A1AA&heavyWaste=true`

Response:
```json
{
  "skips": [
    { "size": "4-yard", "price": 120, "disabled": false },
    { "size": "12-yard", "price": 260, "disabled": true }
  ]
}
```

### `POST /api/booking/confirm`

Request:
```json
{
  "postcode": "SW1A 1AA",
  "addressId": "addr_1",
  "heavyWaste": true,
  "plasterboard": false,
  "skipSize": "4-yard",
  "price": 120
}
```

Response:
```json
{ "status": "success", "bookingId": "BK-12345" }
```

## 6) Manual Test Requirements

- **Minimum 35** test cases.
- **At least 10** negative tests.
- **At least 6** edge cases.
- **At least 4** API failure tests.
- **At least 4** state transition tests.
- Use strict markdown table format.

## 7) Bug Report Requirements

- Minimum **3** bugs.
- Include severity, priority, environment, steps, actual vs expected, evidence.
- At least **1** bug must involve branching or state transition.

## 8) Automation Requirements

- Automate **two E2E flows** (general + heavy or plasterboard path).
- Assertions at each step.
- Stable selectors required.
- Explain mocking/test data strategy in `README`.

## 9) UI/UX Evidence Requirements

- Mobile and desktop screenshots.
- Error and retry states.
- Disabled skip visibility.
- Price breakdown.
- Flow video (60–120 seconds).
- Lighthouse and accessibility report.

## 10) Scoring Overview

- Functional correctness.
- Product realism.
- Manual testing depth.
- Bug reporting quality.
- Automation reliability.
- UI/UX responsiveness and accessibility.
