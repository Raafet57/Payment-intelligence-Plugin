// Generated from src/lib/insights/analyze.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { classifyDocuments } from "./classify.mjs";
import { correlateDocuments } from "./correlate.mjs";
export function analyzeDocuments(sources) {
    const documents = classifyDocuments(sources);
    const parsed = documents.filter((doc) => doc.ok);
    const threads = correlateDocuments(parsed);
    const warningCount = threads.reduce((sum, thread) => sum + thread.warnings.length, 0);
    return {
        documents,
        threads,
        stats: {
            docs: documents.length,
            parsed: parsed.length,
            failed: documents.length - parsed.length,
            threads: threads.length,
            singletonThreads: threads.filter((thread) => !thread.linked).length,
            linkedThreads: threads.filter((thread) => thread.linked).length,
            warnings: warningCount,
        },
    };
}
