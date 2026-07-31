import { describe, it, expect } from "vitest";
import { formatTicketId } from "./ticket-id.js";

// NOTE (course): weak starter test — only the bare-id happy path, so a mutant that
// drops the already-prefixed guard survives. The mutation-testing chapter adds the
// missing case.
describe("formatTicketId", () => {
  it("returns a T-prefixed id", () => {
    expect(formatTicketId("1004")).toBe("T-1004");
  });
});
