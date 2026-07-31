import { describe, it, expect } from "vitest";
import { formatTicketId } from "./ticket-id.js";

describe("formatTicketId", () => {
  it("adds the T- prefix to a bare id", () => {
    expect(formatTicketId("1004")).toBe("T-1004");
  });

  it("leaves an already-prefixed id unchanged", () => {
    expect(formatTicketId("T-1004")).toBe("T-1004");
  });
});
