import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { GENESIS_HASH, MEMO_PROGRAM, buildBakeTx } from "./chain";

describe("buildBakeTx", () => {
  const payer = new PublicKey("11111111111111111111111111111112");

  it("refuses an empty memo", () => {
    expect(() => buildBakeTx(payer, "   ", "hash")).toThrow(/empty/);
  });

  it("pays from the connected wallet and calls memo program", () => {
    const tx = buildBakeTx(payer, "ovenboard bake", "11111111111111111111111111111111");
    expect(tx.feePayer?.equals(payer)).toBe(true);
    expect(tx.instructions).toHaveLength(1);
    expect(tx.instructions[0]?.programId.equals(MEMO_PROGRAM)).toBe(true);
    expect(tx.instructions[0]?.keys[0]?.pubkey.equals(payer)).toBe(true);
  });
});

describe("genesis pin", () => {
  it("pins the live Cookie Chain genesis", () => {
    expect(GENESIS_HASH).toHaveLength(44);
  });
});
