export const categories = ["Booking", "Billing", "Complaint", "Service", "Partnership", "General"];
export const priorities = ["Urgent", "High", "Normal", "Low"];
export const statuses = ["New", "In progress", "Waiting", "Resolved"];
export const owners = ["Unassigned", "Alex Morgan", "Sam Taylor", "Jordan Lee"];
export const msHour = 3_600_000;
const categoryRules = [
    { value: "Complaint", terms: ["complaint", "unhappy", "dissatisfied", "disappointed", "damaged", "broken", "refund", "unacceptable", "angry"] },
    { value: "Billing", terms: ["invoice", "payment", "charged", "charge", "receipt", "billing", "price", "deposit"] },
    { value: "Booking", terms: ["book", "reservation", "reschedule", "appointment", "availability", "cancel", "date change"] },
    { value: "Service", terms: ["repair", "service", "technician", "delivery", "install", "maintenance", "support"] },
    { value: "Partnership", terms: ["partner", "wholesale", "collaboration", "supplier", "trade"] }
];
export function classify(subject, message) {
    const value = `${subject} ${message}`.toLowerCase();
    const category = categoryRules.find(rule => rule.terms.some(term => value.includes(term)))?.value ?? "General";
    const priority = /\b(urgent|immediately|asap|safety|unsafe|emergency)\b/i.test(value) ? "Urgent" :
        /\b(today|complaint|refund|broken|late|failed|cancel)\b/i.test(value) ? "High" :
            category === "Partnership" ? "Low" : "Normal";
    return { category, priority };
}
export function slaHours(category, priority) {
    if (priority === "Urgent")
        return 4;
    if (priority === "High")
        return 24;
    return { Booking: 24, Billing: 48, Complaint: 24, Service: 48, Partnership: 120, General: 72 }[category];
}
export function isOverdue(item, now = Date.now()) {
    return item.status !== "Resolved" && Number.isFinite(Date.parse(item.dueAt)) && Date.parse(item.dueAt) < now;
}
export function summarise(items, now = Date.now()) {
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
export function parseCSV(text) {
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
export function importEnquiries(csv, existing = []) {
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
export function toCSV(items) {
    const fields = ["id", "customer", "email", "subject", "message", "receivedAt", "dueAt", "category", "priority", "owner", "status", "notes", "resolvedAt"];
    const escaped = (x) => `"${String(x ?? "").replaceAll('"', '""')}"`;
    return [fields.join(","), ...items.map(item => fields.map(k => escaped(item[k])).join(","))].join("\r\n");
}
export function operationalReport(items, now = Date.now()) {
    const s = summarise(items, now);
    const top = items.filter(x => isOverdue(x, now)).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
    const line = (e) => `- ${e.id}: ${e.subject} | ${e.customer} | ${e.owner} | due ${new Date(e.dueAt).toISOString().slice(0, 16).replace("T", " ")} UTC`;
    return [`# Operations Inbox | Operational summary`, `Generated: ${new Date(now).toISOString()}`, `Scope: fictional demonstration dataset. Local browser state; not a live service.`, "", `## Performance snapshot`, `- Total enquiries: ${s.total}`, `- Open: ${s.open}`, `- Overdue open: ${s.overdue}`, `- Unassigned open: ${s.unassigned}`, `- Urgent open: ${s.urgentOpen}`, `- Resolved: ${s.resolved} (${s.resolvedRate}% of all enquiries)`, "", `## Category breakdown`, ...categories.map(c => `- ${c}: ${s.byCategory[c]}`), "", `## Overdue work (oldest due first)`, ...(top.length ? top.map(line) : ["- None"]), "", `## Management actions`, `- Review overdue and urgent requests first.`, `- Assign an owner to each unassigned open enquiry.`, `- Confirm priorities and service-level expectations with the team.`, "", "Note: These are dataset counts, not measured business impact."].join("\n");
}
