# Employer portfolio pack

## Two-minute demonstration script (approximately 260 words)

**0:00–0:15 · Introduction (overview)**  
“This is Operations Inbox, a small-business workflow tool I built for a 12-week employment portfolio challenge. The aim wasn't to create an AI chatbot. It was to make operational work easier to see and manage.”

**0:15–0:35 · Problem (KPI cards)**  
“In a team handling customer enquiries, urgent requests, overdue work and missing owners can disappear into inboxes or spreadsheets. Here, every enquiry has a category, priority, owner, status and target date. These metrics show where attention is needed.”

**0:35–1:00 · Practical workflow (open an overdue row)**  
“I'll open an overdue enquiry, assign it to a named colleague, add an internal handover note and move it into progress. The queue updates, and the change is saved in this browser. The categories and priorities are rules-based and staff can override them.”

**1:00–1:20 · Import and exceptions (How it works)**  
“The tool also accepts CSV data. I mapped the required fields and implemented validation for malformed rows, invalid addresses and duplicate IDs. It reports rejected rows rather than silently corrupting the queue.”

**1:20–1:40 · Reporting (Reporting page)**  
“On Reporting, we can see current workload, overdue items and resolution rate. I can export a concise management summary and the underlying CSV, making the operational position easy to explain.”

**1:40–2:00 · Evidence and limitations (README/test references)**  
“I specified eleven acceptance criteria and tested the rules and interactions. The data is entirely fictional, and this isn't a production customer system. The project demonstrates how I translate a business problem into requirements, a usable workflow, controls, testing and stakeholder-ready reporting.”

## Three CV-ready achievement statements

1. **Designed and built** a TypeScript customer-enquiry operations dashboard, translating a realistic business problem into defined requirements, ownership workflows, overdue monitoring and operational KPIs.
2. **Implemented and validated** rule-based enquiry triage, CSV import/export and data-quality checks, including duplicate detection, malformed-row handling and human-editable prioritisation.
3. **Produced** an employer-facing implementation portfolio featuring acceptance criteria, automated tests, responsive demonstration screenshots, stakeholder reporting and documented system limitations.

These statements deliberately make no claims about real customer adoption, hours saved or financial improvements.

## Suggested interview framing

**“Tell me about a process you improved.”**  
“Using a realistic small-business scenario, I analysed how enquiries could be missed when responsibility and due dates aren't explicit. I built a demonstrable future-state process with a single queue, exception highlighting and reporting, then tested the workflow. Because this was a simulation, I don't claim production ROI. I can explain what I would measure with a real team before rollout.”

**“How did you use AI?”**  
“I used AI as a development partner for requirements structure, implementation ideas and testing support. AI is not a user-facing service in the product. The operational rules are documented, inspectable and human-editable.”

## Portfolio publishing checklist

- [x] Specification, acceptance criteria and implementation plan
- [x] Fictional application and tested core behaviours
- [x] README, screenshots, demo script and case study
- [x] Production deployment marked READY by Vercel, with SSO/password protection disabled
- [ ] Independent public-domain browser smoke test (blocked by execution environment)
- [ ] Public GitHub repository holding the source and documentation
- [ ] Two-minute screen recording actually captured (script is ready)
