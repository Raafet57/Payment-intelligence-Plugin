// Generated from src/lib/insights/classify.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { parseStory, StorytellerInputError } from "../storyteller/index.mjs";
import { extractRecord } from "./extract.mjs";
export function classifyDocument(text, fileName = "(pasted)", fileIndex = 0) {
    try {
        const story = parseStory(text);
        if (story.support === "unsupported") {
            return {
                ok: false,
                id: `${fileIndex}:${fileName}`,
                fileName,
                fileIndex,
                error: { message: "Unsupported ISO 20022 message type for Payment Insights Lite." },
            };
        }
        return extractRecord(story, fileName, fileIndex);
    }
    catch (error) {
        if (error instanceof StorytellerInputError) {
            return {
                ok: false,
                id: `${fileIndex}:${fileName}`,
                fileName,
                fileIndex,
                error: error.detail
                    ? { message: error.message, detail: error.detail }
                    : { message: error.message },
            };
        }
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, id: `${fileIndex}:${fileName}`, fileName, fileIndex, error: { message } };
    }
}
export function classifyDocuments(docs) {
    return docs.map((doc, index) => classifyDocument(doc.text, doc.fileName, index));
}
