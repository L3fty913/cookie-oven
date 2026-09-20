import { describe, expect, it } from "vitest";
import { COPY, displayOrUnverified, labelForPhase } from "./status";

describe("displayOrUnverified", () => {
  it("never prints a silent zero for unverified reads", () => {
    expect(
      displayOrUnverified({ status: "unverified", reason: "rpc down" }),
    ).toBe(COPY.UNAVAILABLE);
  });

  it("shows loading, then the verified value", () => {
    expect(displayOrUnverified({ status: "loading" })).toBe(COPY.LOADING);
    expect(displayOrUnverified({ status: "ok", value: "12.4" })).toBe("12.4");
  });
});

describe("labelForPhase", () => {
  it("names every bake phase the work order prints", () => {
    expect(labelForPhase("wallet-confirmation")).toBe("WAITING ON NIGHTLY");
    expect(labelForPhase("pending")).toBe("PENDING");
    expect(labelForPhase("confirmed")).toBe("CONFIRMED");
    expect(labelForPhase("failed")).toBe("FAILED");
  });
});
