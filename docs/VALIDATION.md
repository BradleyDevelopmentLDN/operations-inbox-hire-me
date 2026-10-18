# Validation and evidence

**Project:** Operations Inbox  
**Validation date:** 18 October 2026  
**Dataset:** 18 fictional enquiries, clock-relative due dates  
**Do not interpret synthetic dataset counts as business impact.**

## Automated domain tests

Command: `npm run check` after compilation.

- TypeScript strict type-check: pass.
- 11 Node.js domain tests: pass.
- Cases: rule-based classification, target time windows, overdue exclusion of resolved records, metric consistency, quoted CSV parsing, partial import with invalid row, duplicate ID rejection, malformed input, CSV round-trip, operational report content, empty-dataset handling.

## Scripted browser workflow checks

12 checks passed in local Chromium using a document-content harness, compiled JavaScript bundle and browser-controlled interactions. The isolated harness supplied a localStorage-compatible test double because this execution environment blocked navigation to localhost and file URLs. This is an **offline browser interaction test**, not a claim of end-to-end testing on the public Vercel domain.

1. Overview renders with four KPI cards and the priority queue.
2. Detail editor can update owner/status/notes; state rehydration verified with the storage test double.
3. Overdue filter returns six seeded overdue open records.
4. Search returns matching subjects.
5. Adding an enquiry uses rule-based categorisation and increments the queue.
6. Operational summary Markdown exports with updated totals.
7. CSV export downloads with expected filename.
8. Guide view shows import contract and privacy notice.
9. Reset restores 18 seeded records (15 open).
10. CSV accepts one valid row and reports one invalid row.
11. No uncaught JavaScript errors in the observed interaction flow.
12. Mobile layout renders with the expected overview content.

### Known constraints of evidence

- The browser harness tested interactive DOM behaviour but replaced native origin storage because navigation was blocked. In-browser persistence is therefore verified using a storage test double and code review, not a direct localhost reload.
- An actual deployed URL must be checked separately before declaring production-domain smoke-test completion.
- No human user study or accessibility audit by assistive-technology users was conducted.
- No external customer service baseline was observed; there is no numerical before/after time-saving claim.
- Responsive screenshots reflect the browser harness, not real mobile device testing.

## Workflow comparison, evidence status

| Workflow step | Hypothetical manual approach | Tested app flow | Evidence status |
|---|---|---|---|
| Find overdue requests | Examine due-date cells and statuses | Overdue filter shows open late items | Functional check passed, no human time benchmark |
| Assign responsibility | Update a row and communicate ownership | Set owner and save in detail panel | Functional check passed, no staff adoption measure |
| Prepare status report | Manually aggregate categories and outstanding work | Export Markdown summary and CSV | Export and total check passed, no measured minutes saved |

**Result:** capability demonstrated. **Not claimed:** percentage time saved, financial value, real-user adoption, deployment uptime or SLA improvement.

## Manual UAT before using in a job interview

- [ ] Open the public demo URL in a private browser and confirm overview data loads.
- [ ] Open one overdue record, change owner and status, then refresh; confirm it remains changed.
- [ ] Filter overdue and verify resolved cases are excluded.
- [ ] Download summary and CSV; review files locally.
- [ ] Test keyboard navigation and a 390px mobile viewport.
- [ ] Reset the demo to leave clean seed data.

## Product risks

1. No multi-user system, authentication, real audit log, durable backup or privacy compliance review.
2. Simple keyword rules can miscategorise enquiries or miss nuance; fields are editable by staff.
3. Clock-relative test dates are fictional targets, not calibrated to weekends or business hours.
4. CSV importer is intentionally capped at 1 MB. Large/complex files need a production-grade ingestion service.
5. Browser-local storage can be cleared at any time and is not suitable for sensitive customer records.

## Deployment observation

The connected Vercel service reports a **READY** production deployment at `https://operations-inbox-hire-me.vercel.app`, with authentication disabled. The external HTTP smoke test remains unverified because direct network access was blocked in the test environment. See `DEPLOYMENT.md`.
