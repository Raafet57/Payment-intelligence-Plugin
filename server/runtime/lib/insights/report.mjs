// Generated from src/lib/insights/report.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { humanizeThreadKey } from "./format.mjs";
import { REASON_CODE_CAVEAT } from "./reasonCodes.mjs";
const PRIVACY_BANNER = "Local lifecycle insight over files you provide · not live payment tracking.";
const PRIVACY_NOTE = "Files are parsed in memory in this tab. Nothing is uploaded, persisted, logged, or analysed.";
function formatMoney(amount) {
    if (!amount)
        return "·";
    return amount.currency ? `${amount.value} ${amount.currency}` : amount.value;
}
function threadHeading(thread, index) {
    return `## Thread ${index + 1} · ${humanizeThreadKey(thread.strongestKey.kind)}: ${thread.strongestKey.value}`;
}
export function insightsToMarkdown(analysis) {
    const lines = [
        "# Payment Insights Lite report",
        "",
        `> ${PRIVACY_BANNER}`,
        `> ${PRIVACY_NOTE}`,
        "",
        "## Summary",
        "",
        `- Documents: ${analysis.stats.docs}`,
        `- Parsed: ${analysis.stats.parsed}`,
        `- Failed: ${analysis.stats.failed}`,
        `- Threads: ${analysis.stats.threads}`,
        `- Warnings: ${analysis.stats.warnings}`,
        "",
    ];
    analysis.threads.forEach((thread, index) => {
        lines.push(threadHeading(thread, index), "");
        lines.push(`- Linked: ${thread.linked ? "yes" : "singleton"}`);
        lines.push(`- Documents: ${thread.documents.map((doc) => `${doc.kind} (${doc.fileName})`).join(", ")}`);
        lines.push("");
        lines.push("### Timeline", "");
        for (const event of thread.events) {
            const status = event.status?.reasonCode ?? event.status?.code;
            lines.push(`- ${event.timestamp ?? "No timestamp"} · ${event.label} · ${event.fileName} · ${formatMoney(event.amount)}${status ? ` · ${status}` : ""}`);
        }
        if (thread.warnings.length > 0) {
            lines.push("", "### Warnings", "");
            for (const warning of thread.warnings) {
                lines.push(`- ${warning.severity.toUpperCase()} ${warning.id}: ${warning.message}`);
            }
        }
        lines.push("");
    });
    const failed = analysis.documents.filter((doc) => !doc.ok);
    if (failed.length > 0) {
        lines.push("## Parse errors", "");
        for (const doc of failed) {
            lines.push(`- ${doc.fileName}: ${doc.error.message}`);
        }
        lines.push("");
    }
    lines.push("## Caveats", "");
    lines.push(`- ${REASON_CODE_CAVEAT}`);
    lines.push("- This is not live payment tracking, settlement monitoring, VOP, SEPA reachability, or live bank lookup.");
    return `${lines.join("\n")}\n`;
}
export function insightsToJson(analysis) {
    const safe = {
        _caveats: [
            PRIVACY_BANNER,
            PRIVACY_NOTE,
            REASON_CODE_CAVEAT,
            "No live tracking, VOP, SEPA reachability, settlement monitoring, or live bank lookup.",
        ],
        stats: analysis.stats,
        documents: analysis.documents.map((doc) => doc.ok
            ? {
                ok: true,
                fileName: doc.fileName,
                kind: doc.kind,
                keys: doc.keys,
                status: doc.status,
            }
            : { ok: false, fileName: doc.fileName, error: doc.error }),
        threads: analysis.threads.map((thread) => ({
            id: thread.id,
            strongestKey: thread.strongestKey,
            linked: thread.linked,
            events: thread.events,
            warnings: thread.warnings,
        })),
    };
    return JSON.stringify(safe, null, 2);
}
