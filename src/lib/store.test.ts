import { describe, expect, it } from "vitest";
import { budgetError, completedCount, demoExperiments, type Experiment } from "./store";

const mk = (i: number, status: Experiment["status"]): Experiment => ({
  ...demoExperiments()[0], id: `x${i}`, run: i, status,
});

describe("experiment budget", () => {
  it("blocks the 16th completed run", () => {
    const list = Array.from({ length: 15 }, (_, i) => mk(i, "completed"));
    expect(budgetError(list, mk(99, "completed"))).not.toBeNull();
  });
  it("allows planned runs beyond the cap", () => {
    const list = Array.from({ length: 15 }, (_, i) => mk(i, "completed"));
    expect(budgetError(list, mk(99, "planned"))).toBeNull();
  });
  it("does not count planned runs", () => {
    expect(completedCount([mk(1, "planned"), mk(2, "completed")])).toBe(1);
  });
});
