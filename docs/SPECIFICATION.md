# Project specification and implementation plan

**Project:** Operations Inbox  
**Task:** 001 · Business Process Rescue  
**Challenge:** 19–25 October 2026  
**Target effort:** 6–8 hours (planned, not a time-tracking claim)  
**Delivery style:** constrained, testable, single-user portfolio demonstration

## Problem and users

A fictional small UK service business receives customer enquiries through several channels. Its team needs an at-a-glance way to see every request, understand which ones need urgent attention, identify owners and outstanding work and prepare management reporting without hand-counting spreadsheet rows.

**Primary user:** operations coordinator. **Secondary user:** owner / operations manager reviewing workload and exceptions. **Stakeholders:** customers (represented by fictional records), team members and management.

## As-is and to-be

```text
AS-IS (hypothetical)
Inbox / spreadsheet entries → human triage → owner tracked informally → due date checked manually → report compiled manually

TO-BE (implemented demo)
Create/import → validate → suggest category and priority → assign owner and due date → progress status → highlight overdue → export snapshot
```

This is a hypothetical process design, not a measured study of an existing employer.

## Functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| AC-01 | Realistic safe sample data | Default load shows at least 15 distinct fictional enquiries with open, overdue, unassigned and resolved cases. |
| AC-02 | CSV import | Imports valid rows, handles quoted commas, reports invalid rows and prevents duplicate IDs. |
| AC-03 | Categorise/priority | Deterministic suggestions based on text; user can override both. |
| AC-04 | Ownership/status | A user can save owner, status and notes and see the change in the table; browser state survives a fresh session with preserved storage. |
| AC-05 | Overdue detection | An open case with due date in the past is overdue. Resolved items are excluded. |
| AC-06 | Operational metrics | Open, overdue, unassigned, resolved rate and category totals reflect current data, including zero rows. |
| AC-07 | Reports | Exports a CSV dataset and readable summary showing outstanding overdue work and management actions. |
| AC-08 | Find work quickly | Can search and filter by status, overdue or ownership and choose alternative sort orders. |
| AC-09 | Exception handling | Empty/invalid files and bad dates fail gracefully; duplicate IDs do not silently replace records. |
| AC-10 | Usable responsive UI | Desktop and mobile layouts render, core operations can be completed with keyboard and accessible labels. |
| AC-11 | Demonstrable evidence | README, case study, tests, screenshots and demo script present without invented outcomes. |

## Non-functional decisions

- Browser-only persistence to avoid personal data infrastructure, hosting costs and authentication scope.
- Local data and CSV exports never sent to a server.
- No paid AI APIs; categorisation uses rules with manual human control.
- TypeScript compilation catches structural defects; tested business logic uses the native Node.js runner.
- No production service-level guarantees or role-based access controls.

## Scope exclusions

No actual email retrieval, sending, shared real-time staff access, attachments, PII processing, automated customer decisions, backend analytics or integrations. Never imply production readiness.

## Implementation plan and effort budget

| Stage | Planned work | Budget |
|---|---|---:|
| 1. Research/spec | Compare three job adverts, capture workflow, requirements and acceptance criteria | 1 h |
| 2. Domain logic | Data types, safe sample records, CSV parser, deterministic rules, metrics | 1.5 h |
| 3. Interface | Dashboard, filters, detail editor, report/export, responsive design | 2.5 h |
| 4. Quality | Domain tests, scripted browser checks, exception and usability review | 1 h |
| 5. Portfolio | Documentation, screenshots, demonstration script, deployment | 1 h |
| **Total** | | **7 h planned** |

This budget is a planned target; execution was not recorded with a formal time tracker.

## Completion gate

Passing domain tests alone is not enough. The gate requires browser interactions, generated outputs, accessible documentation, a deployed demo and a public source repository. Anything missing must be reported as incomplete.
