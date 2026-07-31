import { describe, it, expect } from "vitest";
import { isBreached, slaRemainingHours, slaState } from "./sla.js";
import { priorityWeight, triageSort } from "./index.js";

// NOTE (course): these starter tests have high line coverage but weak assertions —
// each function is exercised, but nothing pins its behavior at the boundaries. The
// mutation-testing chapter reveals the surviving mutants (e.g. `>` vs `>=` in
// isBreached, the slaState thresholds, the triage tie-break) and strengthens these
// with boundary cases and a property-based test.

describe("slaRemainingHours", () => {
  it("returns a number", () => {
    expect(typeof slaRemainingHours(10, 4)).toBe("number");
  });
});

describe("isBreached", () => {
  it("flags a clearly overdue ticket", () => {
    expect(isBreached(10, 50)).toBe(true);
  });

  it("does not flag a brand-new ticket", () => {
    expect(isBreached(10, 0)).toBe(false);
  });
});

describe("slaState", () => {
  it("returns a valid SLA state", () => {
    expect(["ok", "due-soon", "overdue"]).toContain(slaState("high", 100, 10));
  });

  it("is overdue when well past the deadline", () => {
    expect(slaState("high", 10, 100)).toBe("overdue");
  });
});

describe("priorityWeight", () => {
  it("gives urgent more weight than low", () => {
    expect(priorityWeight("urgent")).toBeGreaterThan(priorityWeight("low"));
  });
});

describe("triageSort", () => {
  it("returns the same tickets it was given", () => {
    const sorted = triageSort([
      { id: "a", priority: "low", ageHours: 1, slaHours: 24 },
      { id: "b", priority: "urgent", ageHours: 1, slaHours: 1 },
    ]);
    expect(sorted).toHaveLength(2);
  });
});
