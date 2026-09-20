import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./lib/chain", async () => {
  const actual = await vi.importActual<typeof import("./lib/chain")>("./lib/chain");
  return {
    ...actual,
    loadNetwork: vi.fn(async () => ({
      status: "unverified" as const,
      reason: "rpc refused",
    })),
    loadWalletState: vi.fn(),
  };
});

describe("App fail-closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prints CAN'T VERIFY instead of a fake healthy board", async () => {
    render(<App />);
    expect(await screen.findByText("CAN'T VERIFY COOKIE CHAIN")).toBeInTheDocument();
    expect(screen.getByText("rpc refused")).toBeInTheDocument();
    expect(screen.getAllByText("CAN'T VERIFY").length).toBeGreaterThan(0);
  });
});
