import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isBreached, slaRemainingHours, slaState } from "./sla.js";
import { priorityWeight, triageSort, type TicketSummary } from "./index.js";
import type { Priority } from "./priority.js";

describe("slaRemainingHours", () => {
  it("computes remaining hours (positive when time is left)", () => {
    expect(slaRemainingHours(10, 4)).toBe(6);
  });

  it("goes negative once past the deadline", () => {
    expect(slaRemainingHours(10, 14)).toBe(-4);
  });
});

describe("isBreached (boundary)", () => {
  it("is NOT breached at the exact SLA boundary (ageHours === slaHours)", () => {
    // The subtle case: `>` vs `>=`. Equal age must not count as breached.
    expect(isBreached(10, 10)).toBe(false);
  });

  it("is breached one moment past the boundary", () => {
    expect(isBreached(10, 10.001)).toBe(true);
  });

  it("is not breached just before the boundary", () => {
    expect(isBreached(10, 9.999)).toBe(false);
  });
});

// Each priority has a distinct "due-soon" window; drive slaState across them so a
// mutant to any urgencyWindow case (or the boundary operators) is caught.
const windows: Array<[Priority, number]> = [
  ["urgent", 1],
  ["high", 4],
  ["normal", 12],
  ["low", 24],
];

describe.each(windows)("slaState boundaries for %s (window %i h)", (priority, window) => {
  const slaHours = 100;

  it("is overdue exactly at the deadline (remaining === 0)", () => {
    expect(slaState(priority, slaHours, slaHours)).toBe("overdue");
  });

  it("is overdue past the deadline", () => {
    expect(slaState(priority, slaHours, slaHours + 5)).toBe("overdue");
  });

  it("is due-soon just inside the deadline (remaining > 0)", () => {
    expect(slaState(priority, slaHours, slaHours - 0.5)).toBe("due-soon");
  });

  it("is due-soon exactly at the window edge (remaining === window)", () => {
    expect(slaState(priority, slaHours, slaHours - window)).toBe("due-soon");
  });

  it("is ok just outside the window (remaining === window + 1)", () => {
    expect(slaState(priority, slaHours, slaHours - window - 1)).toBe("ok");
  });
});

describe("priorityWeight", () => {
  it("assigns strictly increasing weight: low < normal < high < urgent", () => {
    expect(priorityWeight("low")).toBe(0);
    expect(priorityWeight("normal")).toBe(1);
    expect(priorityWeight("high")).toBe(2);
    expect(priorityWeight("urgent")).toBe(3);
  });
});

describe("triageSort", () => {
  it("orders higher priority first", () => {
    const sorted = triageSort([
      { id: "low", priority: "low", ageHours: 1, slaHours: 24 },
      { id: "urgent", priority: "urgent", ageHours: 1, slaHours: 1 },
      { id: "normal", priority: "normal", ageHours: 1, slaHours: 12 },
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["urgent", "normal", "low"]);
  });

  it("breaks ties within a priority by least SLA remaining first", () => {
    const sorted = triageSort([
      { id: "more-remaining", priority: "high", ageHours: 1, slaHours: 20 }, // remaining 19
      { id: "less-remaining", priority: "high", ageHours: 8, slaHours: 10 }, // remaining 2
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["less-remaining", "more-remaining"]);
  });

  // Property: for any queue, the result is a same-length reordering that is
  // non-increasing in priority and, within a priority, non-decreasing in SLA remaining.
  it("is ordered by priority desc, then least SLA remaining (property)", () => {
    const summaryArb: fc.Arbitrary<TicketSummary> = fc.record({
      id: fc.string(),
      priority: fc.constantFrom<Priority>("low", "normal", "high", "urgent"),
      ageHours: fc.integer({ min: 0, max: 100 }),
      slaHours: fc.integer({ min: 0, max: 100 }),
    });

    fc.assert(
      fc.property(fc.array(summaryArb, { maxLength: 30 }), (tickets) => {
        const sorted = triageSort(tickets);
        expect(sorted).toHaveLength(tickets.length);

        for (let i = 1; i < sorted.length; i += 1) {
          const prev = sorted[i - 1];
          const cur = sorted[i];
          const wPrev = priorityWeight(prev.priority);
          const wCur = priorityWeight(cur.priority);

          expect(wPrev).toBeGreaterThanOrEqual(wCur);
          if (wPrev === wCur) {
            const remPrev = prev.slaHours - prev.ageHours;
            const remCur = cur.slaHours - cur.ageHours;
            expect(remPrev).toBeLessThanOrEqual(remCur);
          }
        }
      })
    );
  });
});
