// Generated from src/lib/storyteller/types.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
export class StorytellerInputError extends Error {
    detail;
    constructor(error) {
        super(error.message);
        this.name = "StorytellerInputError";
        this.detail = error.detail;
    }
}
