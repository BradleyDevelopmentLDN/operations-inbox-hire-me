// Bundled from compiled TypeScript sources. Do not hand edit.
const categories = ["Booking", "Billing", "Complaint", "Service", "Partnership", "General"];
const priorities = ["Urgent", "High", "Normal", "Low"];
const statuses = ["New", "In progress", "Waiting", "Resolved"];
const owners = ["Unassigned", "Alex Morgan", "Sam Taylor", "Jordan Lee"];
const msHour = 3_600_000;
const categoryRules = [
    { value: "Complaint", terms: ["complaint", "unhappy", "dissatisfied", "disappointed", "damaged", "broken", "refund", "unacceptable", "angry"] },
    { value: "Billing", terms: ["invoice", "payment", "charged", "charge", "receipt", "billing", "price", "deposit"] },
    { value: "Booking", terms: ["book", "reservation", "reschedule", "appointment", "availability", "cancel", "date change"] },
    { value: "Service", terms: ["repair", "service", "technician", "delivery", "install", "maintenance", "support"] },
    { value: "Partnership", terms: ["partner", "wholesale", "collaboration", "supplier", "trade"] }
];
function classify(subject, message) {
    const value = `${subject} ${message}`.toLowerCase();
    const category = categoryRules.find(rule => rule.terms.some(term => value.includes(term)))?.value ?? "General";
    const priority = /\b(urgent|immediately|asap|safety|unsafe|emergency)\b/i.test(value) ? "Urgent" :
        /\b(today|complaint|refund|broken|late|failed|cancel)\b/i.test(value) ? "High" :
            category === "Partnership" ? "Low" : "Normal";
    return { category, priority };
}
function slaHours(category, priority) {
    if (priority === "Urgent")
        return 4;
    if (priority === "High")
        return 24;
    return { Booking: 24, Billing: 48, Complaint: 24, Service: 48, Partnership: 120, General: 72 }[category];
}
function isOverdue(item, now = Date.now()) {
    return item.status !== "Resolved" && Number.isFinite(Date.parse(item.dueAt)) && Date.parse(item.dueAt) < now;
}
function summarise(items, now = Date.now()) {
    const byCategory = Object.fromEntries(categories.map(cat => [cat, items.filter(it => it.category === cat).length]));
    const openItems = items.filter(x => x.status !== "Resolved");
    const resolved = items.length - openItems.length;
    return { total: items.length, open: openItems.length, overdue: openItems.filter(x => isOverdue(x, now)).length,
        unassigned: openItems.filter(x => x.owner === "Unassigned").length, resolved, urgentOpen: openItems.filter(x => x.priority === "Urgent").length,
        resolvedRate: items.length ? Math.round(resolved / items.length * 100) : 0, byCategory };
}
const isOneOf = (set, value) => set.includes(value);
const iso = (value) => { const date = new Date(value); if (!Number.isFinite(date.getTime()))
    throw Error("Invalid date"); return date.toISOString(); };
// Handles BOM, quoted commas, CRLF and escaped double quotes. Refuses malformed CSV.
function parseCSV(text) {
    const input = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (quoted) {
            if (char === '"' && input[i + 1] === '"') {
                cell += '"';
                i++;
            }
            else if (char === '"') {
                quoted = false;
            }
            else {
                cell += char;
            }
        }
        else if (char === '"') {
            if (cell.length)
                throw Error("Unexpected quote in CSV");
            quoted = true;
        }
        else if (char === ",") {
            row.push(cell);
            cell = "";
        }
        else if (char === "\n" || char === "\r") {
            if (char === "\r" && input[i + 1] === "\n")
                i++;
            row.push(cell);
            if (row.some(x => x.trim()))
                rows.push(row);
            row = [];
            cell = "";
        }
        else {
            cell += char;
        }
    }
    if (quoted)
        throw Error("Unclosed quoted field in CSV");
    row.push(cell);
    if (row.some(x => x.trim()))
        rows.push(row);
    return rows;
}
const required = ["customer", "email", "subject", "message", "receivedAt"];
function importEnquiries(csv, existing = []) {
    const rows = parseCSV(csv);
    if (!rows.length)
        throw Error("This CSV file is empty");
    const headers = rows[0].map(x => x.trim());
    const missing = required.filter(x => !headers.includes(x));
    if (missing.length)
        throw Error(`Missing columns: ${missing.join(", ")}`);
    if (new Set(headers).size !== headers.length)
        throw Error("Duplicate header names");
    const accepted = [];
    const rejected = [];
    const ids = new Set(existing.map(e => e.id));
    for (let i = 1; i < rows.length; i++) {
        const raw = rows[i];
        try {
            if (raw.length !== headers.length)
                throw Error("Incorrect number of columns");
            const data = Object.fromEntries(headers.map((h, j) => [h, raw[j]?.trim() ?? ""]));
            for (const field of required)
                if (!data[field])
                    throw Error(`Missing ${field}`);
            const email = data.email;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                throw Error("Invalid email");
            const receivedAt = iso(data.receivedAt);
            const rules = classify(data.subject, data.message);
            const category = (data.category && isOneOf(categories, data.category)) ? data.category : rules.category;
            const priority = (data.priority && isOneOf(priorities, data.priority)) ? data.priority : rules.priority;
            const status = (data.status && isOneOf(statuses, data.status)) ? data.status : "New";
            const owner = (data.owner && isOneOf(owners, data.owner)) ? data.owner : "Unassigned";
            const id = data.id || `IMP-${String(i).padStart(3, "0")}-${Date.parse(receivedAt)}`;
            if (ids.has(id))
                throw Error("Duplicate ID");
            const dueAt = data.dueAt ? iso(data.dueAt) : new Date(Date.parse(receivedAt) + slaHours(category, priority) * msHour).toISOString();
            const item = { id, customer: data.customer, email, subject: data.subject, message: data.message, receivedAt, dueAt, category, priority, status, owner, notes: data.notes || "", resolvedAt: status === "Resolved" ? (data.resolvedAt ? iso(data.resolvedAt) : receivedAt) : null };
            ids.add(id);
            accepted.push(item);
        }
        catch (error) {
            rejected.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Invalid row"}`);
        }
    }
    return { accepted, rejected };
}
function toCSV(items) {
    const fields = ["id", "customer", "email", "subject", "message", "receivedAt", "dueAt", "category", "priority", "owner", "status", "notes", "resolvedAt"];
    const escaped = (x) => `"${String(x ?? "").replaceAll('"', '""')}"`;
    return [fields.join(","), ...items.map(item => fields.map(k => escaped(item[k])).join(","))].join("\r\n");
}
function operationalReport(items, now = Date.now()) {
    const s = summarise(items, now);
    const top = items.filter(x => isOverdue(x, now)).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
    const line = (e) => `- ${e.id}: ${e.subject} | ${e.customer} | ${e.owner} | due ${new Date(e.dueAt).toISOString().slice(0, 16).replace("T", " ")} UTC`;
    return [`# Operations Inbox | Operational summary`, `Generated: ${new Date(now).toISOString()}`, `Scope: fictional demonstration dataset. Local browser state; not a live service.`, "", `## Performance snapshot`, `- Total enquiries: ${s.total}`, `- Open: ${s.open}`, `- Overdue open: ${s.overdue}`, `- Unassigned open: ${s.unassigned}`, `- Urgent open: ${s.urgentOpen}`, `- Resolved: ${s.resolved} (${s.resolvedRate}% of all enquiries)`, "", `## Category breakdown`, ...categories.map(c => `- ${c}: ${s.byCategory[c]}`), "", `## Overdue work (oldest due first)`, ...(top.length ? top.map(line) : ["- None"]), "", `## Management actions`, `- Review overdue and urgent requests first.`, `- Assign an owner to each unassigned open enquiry.`, `- Confirm priorities and service-level expectations with the team.`, "", "Note: These are dataset counts, not measured business impact."].join("\n");
}


const seeds = [
    ["Priya Shah", "Repair visit confirmation", "Could you confirm the technician arrival window for Thursday?", "Booking", "Normal", "Alex Morgan", "New", -30, 18, ""],
    ["Oliver Kent", "Urgent delivery issue", "Our delivery has failed twice and the site opens tomorrow. Please help urgently.", "Service", "Urgent", "Unassigned", "New", -16, -5, ""],
    ["Harriet Cole", "Invoice mismatch", "The latest invoice includes an additional £48 charge. Can you check?", "Billing", "High", "Sam Taylor", "In progress", -50, -2, "Awaiting finance approval."],
    ["Daniel Brooks", "Reschedule appointment", "Please move our Friday appointment to the following Tuesday.", "Booking", "Normal", "Alex Morgan", "Waiting", -19, 12, "Customer to confirm suitable slot."],
    ["Amelia Frost", "Damaged item complaint", "The parcel arrived damaged and I am disappointed. Requesting a refund.", "Complaint", "High", "Jordan Lee", "In progress", -37, -10, "Photos received."],
    ["Noah Ellis", "Wholesale partnership", "We are interested in a possible wholesale partnership for our venues.", "Partnership", "Low", "Unassigned", "New", -28, 70, ""],
    ["Charlotte Vale", "Payment receipt", "Could you send a VAT receipt for our payment?", "Billing", "Normal", "Sam Taylor", "Resolved", -90, -40, "Sent receipt."],
    ["Ethan Price", "New service enquiry", "Would you provide a quote for annual maintenance at two locations?", "Service", "Normal", "Unassigned", "New", -5, 43, ""],
    ["Maya Wright", "Booking cancellation", "I need to cancel my reservation scheduled for next Monday.", "Booking", "High", "Alex Morgan", "In progress", -22, 3, ""],
    ["Isaac Stone", "Website information", "Are you open on bank holidays and do you provide weekend support?", "General", "Normal", "Jordan Lee", "Resolved", -84, -20, "Response sent."],
    ["Sophia Reed", "Unsafe fitting complaint", "The replacement fitting feels unsafe and needs an urgent check.", "Complaint", "Urgent", "Unassigned", "New", -10, -6, "Escalation needed."],
    ["Leo Barnes", "Delivery date change", "Is it possible to adjust our delivery date to the 27th?", "Service", "Normal", "Sam Taylor", "Waiting", -34, -1, "Waiting on courier."],
    ["Ella Gibson", "Duplicate charge", "I think I was charged twice on the same day. Please advise.", "Billing", "High", "Unassigned", "New", -8, 16, ""],
    ["Freddie Moore", "Service review", "Thank you for resolving last week's installation issue.", "General", "Low", "Jordan Lee", "Resolved", -140, -80, "Feedback acknowledged."],
    ["Ruby Collins", "Corporate booking", "Can your team accommodate a group booking for 12 people?", "Booking", "Normal", "Alex Morgan", "New", -4, 20, ""],
    ["Adam Parker", "Product collaboration", "We would love to discuss a joint event or product collaboration.", "Partnership", "Low", "Unassigned", "Waiting", -65, 35, "Requested brief."],
    ["Grace Hill", "Incorrect appointment details", "Our confirmation lists the wrong address and we need it fixed today.", "Booking", "High", "Unassigned", "New", -20, -1, ""],
    ["Oscar Reed", "Replacement part status", "Where is the replacement part for our maintenance request?", "Service", "Normal", "Sam Taylor", "In progress", -44, 7, "Supplier chased."],
];
function makeSample(now = Date.now()) {
    return seeds.map((s, index) => {
        const [customer, subject, message, category, priority, owner, status, receivedH, dueH, notes = ""] = s;
        return { id: `ENQ-${String(1042 + index).padStart(4, "0")}`, customer, email: `${customer.toLowerCase().replaceAll(" ", ".")}@example.com`, subject, message, category: category, priority: priority, owner: owner, status: status, receivedAt: new Date(now + receivedH * msHour).toISOString(), dueAt: new Date(now + dueH * msHour).toISOString(), notes, resolvedAt: status === "Resolved" ? new Date(now + (receivedH + 8) * msHour).toISOString() : null };
    });
}



const storageKey = "operations-inbox-task-001-v1";
const byId = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
const dateLabel = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeLabel = (iso) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const localDateInput = (iso) => { const d = new Date(iso); const pad = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const choices = (values, selected) => values.map(v => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`).join("");
const initials = (name) => name.split(" ").slice(0, 2).map(x => x[0]?.toUpperCase() ?? "").join("");
let view = "overview";
let filter = "All";
let search = "";
let sort = "risk";
let selectedId = null;
let data = load();
function load() { try {
    const value = localStorage.getItem(storageKey);
    if (!value)
        return makeSample();
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed))
        throw Error("Bad stored list");
    return parsed.filter((x) => !!x && typeof x === "object" && typeof x.id === "string" && typeof x.customer === "string" && typeof x.dueAt === "string" && statuses.includes(x.status) && owners.includes(x.owner) && categories.includes(x.category) && priorities.includes(x.priority));
}
catch {
    return makeSample();
} }
function persist() { try {
    localStorage.setItem(storageKey, JSON.stringify(data));
}
catch {
    notify("Browser storage unavailable. Changes may not survive a refresh.");
} }
function notify(message) { const target = byId("toast"); if (!target)
    return; target.textContent = message; target.classList.add("show"); window.setTimeout(() => target.classList.remove("show"), 5700); }
function download(content, filename, mime) { const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function setView(next) { view = next; filter = "All"; search = ""; render(); window.scrollTo({ top: 0, behavior: "instant" }); }
function riskScore(item) { return (isOverdue(item) ? 10000 : 0) + (item.owner === "Unassigned" ? 800 : 0) + ({ Urgent: 400, High: 250, Normal: 120, Low: 0 }[item.priority]) - (Date.parse(item.dueAt) - Date.now()) / msHour; }
function visible() {
    const q = search.trim().toLowerCase();
    return data.filter(item => { if (filter === "Open" && item.status === "Resolved")
        return false; if (filter === "Resolved" && item.status !== "Resolved")
        return false; if (filter === "Overdue" && !isOverdue(item))
        return false; if (filter === "Unassigned" && (item.owner !== "Unassigned" || item.status === "Resolved"))
        return false; return !q || [item.id, item.subject, item.customer, item.email, item.category, item.owner, item.message].some(x => x.toLowerCase().includes(q)); }).sort((a, b) => {
        if (sort === "newest")
            return Date.parse(b.receivedAt) - Date.parse(a.receivedAt);
        if (sort === "due")
            return Date.parse(a.dueAt) - Date.parse(b.dueAt);
        if (sort === "customer")
            return a.customer.localeCompare(b.customer);
        return riskScore(b) - riskScore(a);
    });
}
function badgePriority(item) { return `<span class="tag ${esc(item.priority.toLowerCase())}">${esc(item.priority)}</span>`; }
function badgeStatus(item) { return `<span class="status ${esc(item.status.toLowerCase().replaceAll(" ", "-"))}">${esc(item.status)}</span>`; }
function queuePanel(limit) {
    const items = visible().slice(0, limit ?? Infinity);
    return `<section class="panel" id="queue-panel">
<div class="panel-header"><div><h2>${view === "overview" ? "Priority enquiry queue" : "Customer enquiries"}</h2><p>${view === "overview" ? "Items needing your attention first" : "Search, review and update every enquiry"}</p></div>${view === "overview" ? `<button class="text-action" data-view="enquiries">View all enquiries →</button>` : ""}</div>
<div class="panel-toolbar"><div class="filters">${["All", "Open", "Overdue", "Unassigned", "Resolved"].map(f => `<button class="pill ${filter === f ? "active" : ""}" data-filter="${f}" aria-pressed="${filter === f}">${f}</button>`).join("")}</div><div class="page-actions"><input class="search" id="search-input" placeholder="Search enquiries..." aria-label="Search enquiries" value="${esc(search)}"/><select class="select-inline" id="sort-select" aria-label="Sort enquiries"><option value="risk" ${sort === "risk" ? "selected" : ""}>Highest risk first</option><option value="due" ${sort === "due" ? "selected" : ""}>Due date</option><option value="newest" ${sort === "newest" ? "selected" : ""}>Newest first</option><option value="customer" ${sort === "customer" ? "selected" : ""}>Customer A–Z</option></select></div></div>
<div class="table-container"><table><thead><tr><th>Customer / Ref</th><th>Subject</th><th>Priority</th><th>Owner</th><th>Due date</th><th>Status</th></tr></thead><tbody>${items.map((item, i) => `<tr tabindex="0" role="button" aria-label="Open enquiry ${esc(item.id)} from ${esc(item.customer)}" data-open="${esc(item.id)}"><td><div class="client-cell"><span class="avatar c${i % 4}">${esc(initials(item.customer))}</span><span><strong>${esc(item.customer)}</strong><small>${esc(item.id)}</small></span></div></td><td><div class="subject" title="${esc(item.subject)}">${esc(item.subject)}</div></td><td>${badgePriority(item)}</td><td>${item.owner === "Unassigned" ? "<strong style='color:#c27d2d'>Unassigned</strong>" : esc(item.owner)}</td><td><span class="${isOverdue(item) ? "overdue" : "due-normal"}">${isOverdue(item) ? "● " : ""}${esc(dateLabel(item.dueAt))}</span></td><td>${badgeStatus(item)}</td></tr>`).join("")}</tbody></table>${!items.length ? `<div class="empty"><strong>No matching enquiries</strong>Try another search or filter.</div>` : ""}</div><div class="table-footer"><span>Showing ${items.length} of ${visible().length} matching enquiries</span><span>Click any row to edit · Browser-only demo</span></div></section>`;
}
function overview() {
    const s = summarise(data);
    const total = s.total || 1;
    const metrics = [{ label: "Open enquiries", number: s.open, icon: "▤", style: "", hint: "Awaiting completion" }, { label: "Overdue enquiries", number: s.overdue, icon: "◷", style: "red", hint: "Past target response date" }, { label: "Unassigned enquiries", number: s.unassigned, icon: "♙", style: "amber", hint: "Open items without an owner" }, { label: "Resolution rate", number: `${s.resolvedRate}%`, icon: "✓", style: "green", hint: `${s.resolved} of ${s.total} completed` }];
    return `<div class="page-title"><div><div class="eyebrow">OPERATIONS / OVERVIEW</div><h1>Good to have you here.</h1><p class="subtitle">A clearer picture of every customer enquiry, all in one place.</p></div><div class="page-actions"><button class="btn btn-outline" data-action="import">↥ &nbsp; Import CSV</button><button class="btn btn-primary" data-action="add">＋ &nbsp; New enquiry</button></div></div>
<div class="cards">${metrics.map(m => `<div class="kpi"><div class="kpi-top"><span class="kpi-label">${m.label}</span><span class="kpi-icon ${m.style}">${m.icon}</span></div><div class="kpi-value">${m.number}</div><div class="kpi-hint">${m.hint}</div></div>`).join("")}</div>
<div class="grid-two"><section class="panel"><div class="panel-header"><div><h2>Attention required</h2><p>What the operations team should address next</p></div><button class="text-action" data-view="enquiries">Work queue →</button></div><div class="insight-list"><div class="insight-item"><div class="insight-icon red">◷</div><div class="insight-text"><strong>Overdue responses</strong><small>Open enquiries past their target due date</small></div><span class="insight-count">${s.overdue}</span></div><div class="insight-item"><div class="insight-icon gold">♙</div><div class="insight-text"><strong>Ownership gaps</strong><small>Open work waiting for someone to take responsibility</small></div><span class="insight-count">${s.unassigned}</span></div><div class="insight-item"><div class="insight-icon blue">!</div><div class="insight-text"><strong>Urgent requests</strong><small>Open cases flagged for immediate attention</small></div><span class="insight-count">${s.urgentOpen}</span></div></div></section>
<section class="panel"><div class="panel-header"><div><h2>Enquiries by category</h2><p>Distribution across all ${s.total} records</p></div></div><div class="bar-list">${categories.filter(c => s.byCategory[c]).sort((a, b) => s.byCategory[b] - s.byCategory[a]).map(c => `<div><div class="bar-head"><span>${c}</span><span>${s.byCategory[c]}</span></div><div class="bar-track"><div class="bar-fill" style="width:${100 * s.byCategory[c] / total}%"></div></div></div>`).join("") || "No records yet."}</div></section></div>
${queuePanel(7)}<p class="helper-note">Priority ordering is rule-based and editable by a human. Due dates are fictional demonstration targets, not real contractual SLAs.</p>`;
}
function enquiries() { return `<div class="page-title"><div><div class="eyebrow">OPERATIONS / WORK QUEUE</div><h1>All enquiries</h1><p class="subtitle">Triage, assign, resolve and monitor outstanding customer requests.</p></div><div class="page-actions"><button class="btn btn-outline" data-action="import">↥ &nbsp; Import CSV</button><button class="btn btn-outline" data-action="exportcsv">↓ &nbsp; Export CSV</button><button class="btn btn-primary" data-action="add">＋ &nbsp; New enquiry</button></div></div>${queuePanel()}`; }
function reporting() {
    const s = summarise(data);
    return `<div class="page-title"><div><div class="eyebrow">OPERATIONS / REPORTING</div><h1>Performance snapshot</h1><p class="subtitle">A concise operational summary for daily review and stakeholder updates.</p></div><div class="page-actions"><button class="btn btn-outline" data-action="exportcsv">↓ &nbsp; Export data CSV</button><button class="btn btn-primary" data-action="exportreport">↓ &nbsp; Export summary</button></div></div><div class="cards"><div class="kpi"><div class="kpi-label">Total enquiries</div><div class="kpi-value">${s.total}</div><div class="kpi-hint">Fictional dataset</div></div><div class="kpi"><div class="kpi-label">Open work</div><div class="kpi-value">${s.open}</div><div class="kpi-hint">Excludes resolved</div></div><div class="kpi"><div class="kpi-label">Overdue open work</div><div class="kpi-value">${s.overdue}</div><div class="kpi-hint">Relative to current time</div></div><div class="kpi"><div class="kpi-label">Resolution rate</div><div class="kpi-value">${s.resolvedRate}%</div><div class="kpi-hint">${s.resolved} resolved / ${s.total} total</div></div></div>
<div class="report-row"><section class="panel report-block"><h2>Category workload</h2><div class="report-list">${categories.map(c => `<div class="report-list-item"><span>${c}</span><strong>${s.byCategory[c]} enquiries</strong></div>`).join("")}</div></section><section class="panel report-block"><h2>Operational health</h2><div class="report-big">${s.overdue}</div><p class="report-caption">open enquiries overdue. These should be reviewed for timely follow-up and escalation.</p><div class="report-list"><div class="report-list-item"><span>Urgent & open</span><strong>${s.urgentOpen}</strong></div><div class="report-list-item"><span>Unassigned & open</span><strong>${s.unassigned}</strong></div><div class="report-list-item"><span>Closed & resolved</span><strong>${s.resolved}</strong></div></div></section></div>
<div class="action-note"><strong>Interpretation matters.</strong> This report counts records in a synthetic demonstration dataset. It does not represent actual customers, staff productivity, response-time improvement or a production service-level agreement. Export the Markdown summary for a stakeholder-ready account of outstanding work.</div>`;
}
function guide() { return `<div class="page-title"><div><div class="eyebrow">OPERATIONS / USER GUIDE</div><h1>How it works</h1><p class="subtitle">A small, practical workflow designed for a busy operations team.</p></div><div class="page-actions"><button class="btn btn-primary" data-action="exportreport">↓ &nbsp; Export report</button></div></div><div class="guide-grid"><section class="panel guide-card"><h2>01 · Triage enquiries</h2><p>Review the risk-ranked queue. Overdue, unassigned and urgent enquiries are surfaced automatically, with the oldest due dates prioritised within risk groups.</p><h2>02 · Assign and progress</h2><p>Open an enquiry, set an owner, adjust category and priority, leave notes and move its status from New to In progress, Waiting or Resolved.</p><h2>03 · Report to stakeholders</h2><p>Use Reporting for total, open, overdue, unassigned and resolution rate. Export a Markdown summary or CSV list for your own analysis.</p></section><section class="panel guide-card"><h2>Import a CSV</h2><p>Use a CSV with these required column names:</p><span class="code-line">customer,email,subject,message,receivedAt</span><p>Optional: id, dueAt, category, priority, status, owner, notes, resolvedAt. Dates should be ISO 8601. Invalid records are skipped with errors shown. Importing does not overwrite existing IDs.</p><button class="btn btn-outline" data-action="template">↓ &nbsp; Download CSV template</button><h2 style="margin-top:23px">Rule transparency</h2><p>Keywords suggest categories and priority when not provided. Suggested target deadlines are 4 hours for urgent, 24 hours for high and category-based for other requests. Staff can override these values. This is a demonstration policy, not an actual business SLA.</p></section><section class="panel guide-card"><h2>Before / after process</h2><p><strong>Before:</strong> emails and spreadsheets can make ownership, due dates and reporting difficult to see in a single place.</p><p><strong>After:</strong> one work queue provides explicit categories, owners, due dates and an exportable performance snapshot. This is a designed workflow, not a claim of measured organisational improvement.</p></section><section class="panel guide-card"><h2>Scope and privacy</h2><p>All example customers are fictional and use the reserved <strong>example.com</strong> domain. Data stays in the current browser's local storage. There is no login, shared server database, mailbox integration or real customer communication.</p><p>Use only synthetic data in this portfolio demonstration. For live customer information, authentication, access controls, retention policies and GDPR review would be required.</p><button class="btn btn-outline" data-action="reset">↺ &nbsp; Restore sample data</button></section></div>`; }
function render() { byId("content").innerHTML = ({ overview, enquiries, reporting, guide })[view](); byId("breadcrumb-current").textContent = ({ overview: "Overview", enquiries: "All enquiries", reporting: "Reporting", guide: "How it works" })[view]; byId("sidebar-count").textContent = String(summarise(data).open); document.querySelectorAll(".nav-link").forEach(b => { const active = b.dataset.view === view; b.classList.toggle("active", active); if (active)
    b.setAttribute("aria-current", "page");
else
    b.removeAttribute("aria-current"); }); }
function openDrawer(id) {
    const item = data.find(x => x.id === id);
    if (!item)
        return;
    selectedId = id;
    byId("drawer-root").innerHTML = `<div class="drawer-overlay" data-close-drawer="1"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-heading"><div class="drawer-top"><div><div class="eyebrow">${esc(item.id)}</div><h2 id="drawer-heading">${esc(item.subject)}</h2></div><button class="drawer-close" data-close-drawer="1" aria-label="Close enquiry">×</button></div><div class="drawer-person"><span class="avatar">${esc(initials(item.customer))}</span><div><strong>${esc(item.customer)}</strong><small>${esc(item.email)} · Received ${esc(dateTimeLabel(item.receivedAt))}</small></div></div><div class="label-small">CUSTOMER ENQUIRY</div><div class="message-card">${esc(item.message)}</div><form id="edit-form"><div class="field-grid"><div class="field"><label for="edit-category">Category</label><select id="edit-category" name="category">${choices(categories, item.category)}</select></div><div class="field"><label for="edit-priority">Priority</label><select id="edit-priority" name="priority">${choices(priorities, item.priority)}</select></div><div class="field"><label for="edit-owner">Assigned owner</label><select id="edit-owner" name="owner">${choices(owners, item.owner)}</select></div><div class="field"><label for="edit-status">Status</label><select id="edit-status" name="status">${choices(statuses, item.status)}</select></div></div><div class="field"><label for="edit-due">Target due date</label><input required type="datetime-local" id="edit-due" name="due" value="${esc(localDateInput(item.dueAt))}"/><small>Displayed in your browser's local time</small></div><div class="field"><label for="edit-notes">Internal notes</label><textarea id="edit-notes" name="notes" maxlength="1500" placeholder="Add next steps or a handover note...">${esc(item.notes)}</textarea></div><div class="drawer-actions"><button type="button" class="btn btn-outline" data-close-drawer="1">Cancel</button><button type="submit" class="btn btn-primary">Save changes</button></div></form></aside>`;
    document.querySelector("#edit-owner").focus();
}
function closeDrawer() { selectedId = null; byId("drawer-root").innerHTML = ""; }
function openNew() { byId("modal-root").innerHTML = `<div class="modal-overlay" data-close-modal="1"></div><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div class="drawer-top"><div><div class="eyebrow">NEW RECORD</div><h2 id="modal-heading">Add an enquiry</h2><p>Create a fictional enquiry to test the workflow.</p></div><button class="drawer-close" data-close-modal="1" aria-label="Close">×</button></div><form id="add-form"><div class="field-grid"><div class="field"><label for="add-customer">Customer name</label><input required id="add-customer" name="customer" maxlength="100" /></div><div class="field"><label for="add-email">Email</label><input required type="email" id="add-email" name="email" maxlength="180" /></div></div><div class="field"><label for="add-subject">Subject</label><input required id="add-subject" name="subject" maxlength="140" /></div><div class="field"><label for="add-message">Enquiry details</label><textarea required id="add-message" name="message" maxlength="1500"></textarea></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-close-modal="1">Cancel</button><button type="submit" class="btn btn-primary">Create enquiry</button></div></form></section>`; document.querySelector("#add-customer").focus(); }
function closeModal() { byId("modal-root").innerHTML = ""; }
function resetPrompt() { byId("modal-root").innerHTML = `<div class="modal-overlay" data-close-modal="1"></div><section class="modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-heading"><h2 id="reset-heading">Restore the demonstration?</h2><p>This replaces all changes in this browser with the original 18 fictional enquiries. Export any data you want to retain first.</p><div class="danger-note">This cannot be undone.</div><div class="modal-actions"><button class="btn btn-outline" data-close-modal="1">Keep my changes</button><button class="btn btn-danger" data-action="confirm-reset">Reset demo</button></div></section>`; }
function reset() { data = makeSample(); persist(); closeModal(); closeDrawer(); render(); notify("Demo restored to the original 18 fictional enquiries."); }
function csvTemplate() { const sample = 'customer,email,subject,message,receivedAt\n"Taylor Jones","taylor.jones@example.com","Invoice question","Could you check our latest invoice?","2026-10-19T09:00:00Z"\n'; download(sample, "enquiry-import-template.csv", "text/csv;charset=utf-8"); }
async function handleImport(input) { const file = input.files?.[0]; if (!file)
    return; try {
    if (file.size > 1_000_000)
        throw Error("CSV exceeds 1 MB demonstration limit");
    const { accepted, rejected } = importEnquiries(await file.text(), data);
    if (accepted.length) {
        data = [...accepted, ...data];
        persist();
        render();
    }
    notify(`${accepted.length} enquiry(s) imported. ${rejected.length} rejected.${rejected.length ? "\n" + rejected.slice(0, 4).join("\n") + (rejected.length > 4 ? "\n…and more rows rejected." : "") : ""}`);
}
catch (error) {
    notify(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
}
finally {
    input.value = "";
} }
function submitEdit(form) {
    if (!selectedId)
        return;
    const old = data.find(x => x.id === selectedId);
    if (!old)
        return;
    const values = new FormData(form);
    const date = Date.parse(String(values.get("due")));
    if (!Number.isFinite(date)) {
        notify("Enter a valid target date.");
        return;
    }
    const status = String(values.get("status"));
    const updated = { ...old, category: String(values.get("category")), priority: String(values.get("priority")), owner: String(values.get("owner")), status, dueAt: new Date(date).toISOString(), notes: String(values.get("notes") ?? "").slice(0, 1500), resolvedAt: status === "Resolved" ? (old.resolvedAt ?? new Date().toISOString()) : null };
    data = data.map(x => x.id === old.id ? updated : x);
    persist();
    closeDrawer();
    render();
    notify(`${old.id} updated successfully.`);
}
function submitAdd(form) {
    const values = new FormData(form);
    const customer = String(values.get("customer") ?? "").trim(), email = String(values.get("email") ?? "").trim(), subject = String(values.get("subject") ?? "").trim(), message = String(values.get("message") ?? "").trim();
    if (!customer || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        notify("Enter a name, valid email, subject and message.");
        return;
    }
    const now = Date.now();
    const { category, priority } = classify(subject, message);
    const dueAt = new Date(now + slaHours(category, priority) * msHour).toISOString();
    const id = `ENQ-${[...crypto.getRandomValues(new Uint8Array(4))].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    data = [{ id, customer, email, subject, message, receivedAt: new Date(now).toISOString(), dueAt, category, priority, owner: "Unassigned", status: "New", notes: "", resolvedAt: null }, ...data];
    persist();
    closeModal();
    setView("enquiries");
    notify(`${id} created. Rule-based category: ${category}; priority: ${priority}.`);
}
function performAction(name) { if (name === "import") {
    byId("csv-upload").click();
}
else if (name === "add")
    openNew();
else if (name === "reset")
    resetPrompt();
else if (name === "confirm-reset")
    reset();
else if (name === "exportreport") {
    download(operationalReport(data), "operations-inbox-summary.md", "text/markdown;charset=utf-8");
    notify("Operational summary downloaded.");
}
else if (name === "exportcsv") {
    download(toCSV(data), "operations-inbox-enquiries.csv", "text/csv;charset=utf-8");
    notify("Enquiry dataset exported to CSV.");
}
else if (name === "template")
    csvTemplate(); }
// Delegated events keep all views and freshly rendered elements functional.
document.addEventListener("click", event => { const el = event.target; if (!(el instanceof Element))
    return; const nav = el.closest("[data-view]"); if (nav?.dataset.view) {
    setView(nav.dataset.view);
    return;
} const action = el.closest("[data-action]"); if (action?.dataset.action) {
    performAction(action.dataset.action);
    return;
} const opening = el.closest("[data-open]"); if (opening?.dataset.open) {
    openDrawer(opening.dataset.open);
    return;
} if (el.closest("[data-close-modal]")) {
    closeModal();
    return;
} if (el.closest("[data-close-drawer]")) {
    closeDrawer();
    return;
} });
document.addEventListener("keydown", event => { const el = event.target; if (event.key === "Escape") {
    closeDrawer();
    closeModal();
}
else if ((event.key === "Enter" || event.key === " ") && el instanceof Element) {
    const row = el.closest("tr[data-open]");
    if (row && !(el instanceof HTMLButtonElement)) {
        event.preventDefault();
        openDrawer(row.dataset.open);
    }
} });
document.addEventListener("submit", event => { const form = event.target; if (!(form instanceof HTMLFormElement))
    return; if (form.id === "add-form" || form.id === "edit-form") {
    event.preventDefault();
    if (form.id === "add-form")
        submitAdd(form);
    else
        submitEdit(form);
} });
document.addEventListener("click", event => { const el = event.target; if (el instanceof Element && el.closest("#reset-btn"))
    resetPrompt(); });
document.addEventListener("input", event => { const el = event.target; if (el instanceof HTMLInputElement && el.id === "search-input") {
    const start = el.selectionStart;
    search = el.value;
    const content = byId("queue-panel");
    if (content) {
        const fresh = document.createElement("div");
        fresh.innerHTML = queuePanel(view === "overview" ? 7 : undefined);
        content.replaceWith(fresh.firstElementChild);
        const next = document.querySelector("#search-input");
        next?.focus();
        if (next && start !== null)
            next.setSelectionRange(start, start);
    }
} });
document.addEventListener("change", event => { const el = event.target; if (el instanceof HTMLInputElement && el.id === "csv-upload")
    void handleImport(el); if (el instanceof HTMLSelectElement && el.id === "sort-select") {
    sort = el.value;
    render();
} });
document.addEventListener("click", event => { const el = event.target; if (!(el instanceof Element))
    return; const f = el.closest("[data-filter]"); if (f?.dataset.filter) {
    filter = f.dataset.filter;
    const content = byId("queue-panel");
    if (content) {
        const fresh = document.createElement("div");
        fresh.innerHTML = queuePanel(view === "overview" ? 7 : undefined);
        content.replaceWith(fresh.firstElementChild);
    }
} });
render();

