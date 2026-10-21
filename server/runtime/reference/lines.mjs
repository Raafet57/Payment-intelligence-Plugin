// Generated from plugins/payment-intelligence/server/src/reference/lines.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Line-by-line file reading in fixed-size chunks, so reference files of any size
 * (a full SWIFTRef Payments Directory IDENTIFIERS file is over 600 MB) never have to
 * fit in memory at once.
 */
import { closeSync, openSync, readSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
const CHUNK_BYTES = 8 * 1024 * 1024;
/**
 * Calls `onLine` for every line of the file, without its line ending. `lineNo` is
 * 1-based. Return `false` from `onLine` to stop early.
 */
export function forEachLine(filePath, onLine) {
    const fd = openSync(filePath, "r");
    const decoder = new StringDecoder("utf8");
    const buffer = Buffer.allocUnsafe(CHUNK_BYTES);
    let rest = "";
    let lineNo = 0;
    try {
        for (;;) {
            const read = readSync(fd, buffer, 0, buffer.length, null);
            const text = rest + (read > 0 ? decoder.write(buffer.subarray(0, read)) : decoder.end());
            const lines = text.split("\n");
            rest = read > 0 ? lines.pop() : "";
            for (const raw of lines) {
                lineNo++;
                const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
                if (lineNo === 1 && line === "" && read === 0)
                    return;
                if (onLine(lineNo === 1 ? line.replace(/^\uFEFF/, "") : line, lineNo) === false)
                    return;
            }
            if (read === 0)
                return;
        }
    }
    finally {
        closeSync(fd);
    }
}
/** The first line of a file, without reading the rest. */
export function firstLine(filePath) {
    let header = "";
    forEachLine(filePath, (line) => {
        header = line;
        return false;
    });
    return header;
}
