# Case study | Rescuing a small-business enquiry workflow

**Project:** Operations Inbox  
**Role demonstrated:** Business Analyst / Business Operations / Product Operations / Implementation Specialist  
**Challenge:** 12-Week Hire Me, Week 1  
**Period:** 19–25 October 2026 (project prepared 18 October 2026)  
**Type:** self-initiated portfolio simulation using fictional data

## 1. The business problem

In a small service business, customer enquiries can spread across email and spreadsheets. Without a clear case owner, explicit next action, target date and consistent report, the team may struggle to distinguish urgent work from ordinary backlog. This is a realistic *hypothetical* problem, not a claim that I had access to a real employer's processes or customers.

I defined an operations coordinator as the primary user and a manager as the reporting stakeholder. The success question was simple: could a team member identify, assign and track at-risk enquiries and produce an operational summary in a single workflow?

## 2. Discovery and requirements

I reviewed three UK advertisements across product operations, implementation and performance improvement. Common themes were requirements translation, data quality, workflow controls, reporting, testing and clear stakeholder communication. I converted these into eleven explicit acceptance criteria (see `SPECIFICATION.md`).

The designed process changed from manual cross-referencing of records to a structured queue: **create/import → validate → classify → assign → monitor → report**.

## 3. What I implemented

A lightweight TypeScript web app provides:

- Eighteen realistic fictional cases with overdue, unassigned, urgent, waiting and resolved examples.
- Transparent keyword-based category and priority suggestions that humans can override.
- Editing for owner, status, due date and notes.
- Overdue/ownership filters, search, risk-first ordering and operational KPIs.
- CSV ingestion with error reporting and duplicate prevention, plus CSV and Markdown exports.
- A responsive interface with an embedded guide and clear privacy/scope disclosures.

All data remains browser-local. I deliberately avoided a database, mailbox connection and paid AI API. For a single-user demonstration, those would have introduced complexity without increasing the primary evidence of operational judgment. TypeScript and native tests made the core rules understandable and testable.

## 4. Implementation decisions and controls

I defined "open", "overdue", "unassigned" and "resolution rate" before creating the KPI cards to prevent misleading numbers. Cases only count as overdue when unresolved and past their target time. CSV headers, row lengths, email syntax, dates and duplicate IDs are validated; some invalid rows can be rejected without discarding valid ones. Priority and category rules are deliberately deterministic so they can be explained and corrected.

I named the key trade-off: this is not a live support platform and does not process genuine customer data. No unauthenticated public customer information is collected or served.

## 5. Validation

Strict TypeScript compilation and eleven automated tests passed. Twelve scripted offline-browser checks covered queue display, filters, editing, state rehydration with a storage test double, adding enquiries, CSV and Markdown exports, import errors, resetting and mobile layout. Screenshots and test evidence are included. See `VALIDATION.md` for the exact limitations and outstanding deployed-domain checks.

## 6. Outcome and impact evidence

**What was demonstrated:** a completed, locally tested customer-enquiry workflow, a structured operational dashboard, exportable management reporting and supporting requirements, test evidence and documentation.

**What was not measured:** an actual business's response-time reduction, staff hours saved, customer satisfaction, adoption or financial impact. No imaginary ROI has been attributed to the project.

A legitimate next evaluation would use the same anonymised scenario in a spreadsheet and in the application, have a participant execute both workflows, record task time and errors, and obtain usability feedback before claiming any quantified improvement.

## 7. What this shows an employer

I can recognise a workplace problem, define scope, build a credible lightweight solution, handle data-quality issues, test meaningful outcomes, explain trade-offs and present results in language useful to operational stakeholders. The value lies in translating ambiguity into a working, verifiable process rather than simply generating code.

## 8. Next improvement

A second challenge should introduce a small, validated business dataset and SQL-backed reporting or a Power BI dashboard. It would build on this work while demonstrating analytical querying, real data transformation and formal business insight, which are not yet proven by this task.
