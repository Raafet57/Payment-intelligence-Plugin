// Generated from src/lib/insights/timeline.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
function roleLabel(doc) {
    if (doc.kind === "pacs.008")
        return "Initiating payment";
    if (doc.kind === "pacs.009")
        return "FI credit transfer";
    if (doc.kind === "pacs.002")
        return `Status report${doc.status?.code ? ` (${doc.status.code})` : ""}`;
    if (doc.kind === "pacs.004")
        return `Return${doc.status?.reasonCode ? ` (${doc.status.reasonCode})` : ""}`;
    if (doc.kind === "camt.052")
        return "Account report";
    if (doc.kind === "camt.053")
        return "Statement";
    if (doc.kind === "camt.056")
        return `Cancellation request${doc.status?.reasonCode ? ` (${doc.status.reasonCode})` : ""}`;
    if (doc.kind === "camt.029")
        return `Resolution of investigation${doc.status?.code ? ` (${doc.status.code})` : ""}`;
    if (doc.kind === "camt.110")
        return caseDetail(doc);
    if (doc.kind === "camt.111")
        return `Investigation response${doc.status?.code ? ` (${doc.status.code})` : ""}`;
    return "Credit notification";
}
function caseDetail(doc) {
    const c = doc.story.support === "structured" ? doc.story.data.case : undefined;
    if (c?.requestedAction)
        return `Investigation follow-up (${c.requestedAction})`;
    return `Investigation request${c?.investigationType ? ` (${c.investigationType})` : ""}`;
}
export function eventTimestamp(doc) {
    return doc.createdAt ?? doc.settlementDate ?? null;
}
export function buildTimeline(documents) {
    return [...documents]
        .sort((a, b) => {
        const at = eventTimestamp(a);
        const bt = eventTimestamp(b);
        if (at && bt && at !== bt)
            return at.localeCompare(bt);
        if (at && !bt)
            return -1;
        if (!at && bt)
            return 1;
        return a.fileIndex - b.fileIndex;
    })
        .map((doc) => ({
        id: `event:${doc.id}`,
        documentId: doc.id,
        fileName: doc.fileName,
        kind: doc.kind,
        label: roleLabel(doc),
        timestamp: eventTimestamp(doc),
        amount: doc.amount,
        status: doc.status,
    }));
}
