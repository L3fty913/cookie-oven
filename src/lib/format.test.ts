import { describe, expect, it } from "vitest";
import { clampMemo, formatCook, formatInt, shortAddr, tpsFromSamples } from "./format";

describe("formatCook", () => {
  it("prints whole COOK with full remainder", () => {
    expect(formatCook(1_500_000_000)).toBe("1.5 COOK");
  });

  it("does not invent a zero from garbage", () => {
    expect(formatCook(Number.NaN)).toBe("CAN'T VERIFY");
    expect(formatCook(-1)).toBe("CAN'T VERIFY");
  });
});

describe("shortAddr", () => {
  it("keeps short keys intact", () => {
    expect(shortAddr("abcd")).toBe("abcd");
  });

  it("clips base58", () => {
    expect(shortAddr("So11111111111111111111111111111111111111112")).toBe(
      "So11…1112",
    );
  });
});

describe("tpsFromSamples", () => {
  it("returns null instead of a fake zero when empty", () => {
    expect(tpsFromSamples([])).toBeNull();
  });

  it("uses non-vote txs over sample seconds", () => {
    expect(
      tpsFromSamples([
        { numNonVoteTransactions: 120, samplePeriodSecs: 60 },
        { numNonVoteTransactions: 60, samplePeriodSecs: 60 },
      ]),
    ).toBe(1.5);
  });
});

describe("formatInt", () => {
  it("fails closed on missing", () => {
    expect(formatInt(undefined)).toBe("CAN'T VERIFY");
  });
});

describe("clampMemo", () => {
  it("trims and caps at 180", () => {
    expect(clampMemo("  hi  ")).toBe("hi");
    expect(clampMemo("x".repeat(200)).length).toBe(180);
  });
});
