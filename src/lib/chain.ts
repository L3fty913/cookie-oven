import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { clampMemo } from "./format";
import type { VerifyState } from "./status";
import { COPY } from "./status";

export const COOKIE_RPC = "https://rpc.cookiescan.io";
export const COOKIE_WS = "wss://ws.cookiescan.io";
export const COOKIE_DAS = "https://api.cookiescan.io";
export const COOKIE_EXPLORER = "https://cookiescan.io";
export const COOKIE_BRIDGE = "https://hyperlane.cookiescan.io";
export const COOKIE_DOCS = "https://docs.cookiechain.wtf";
export const GENESIS_HASH = "9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2";
export const MEMO_PROGRAM = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export const connection = new Connection(COOKIE_RPC, {
  commitment: "confirmed",
  wsEndpoint: COOKIE_WS,
});

export type PerfSample = {
  numSlots: number;
  numTransactions: number;
  numNonVoteTransactions: number;
  samplePeriodSecs: number;
  slot: number;
};

export type EpochInfo = {
  absoluteSlot: number;
  blockHeight: number;
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  transactionCount: number;
};

export type DasAsset = {
  id: string;
  interface?: string;
  content?: { metadata?: { name?: string; symbol?: string } };
};

export type NetworkSnapshot = {
  health: string;
  version: { "solana-core": string; "feature-set": number };
  epoch: EpochInfo;
  samples: PerfSample[];
  genesis: string;
};

export type SignatureRow = {
  signature: string;
  err: unknown;
  slot: number;
};

export async function rpc<T>(
  url: string,
  method: string,
  params: unknown[] | Record<string, unknown> = [],
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`${method} HTTP ${res.status}`);
  const body = (await res.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(body.error.message);
  return body.result as T;
}

export async function loadNetwork(): Promise<VerifyState<NetworkSnapshot>> {
  try {
    const [health, version, epoch, samples, genesis] = await Promise.all([
      rpc<string>(COOKIE_RPC, "getHealth"),
      rpc<{ "solana-core": string; "feature-set": number }>(
        COOKIE_RPC,
        "getVersion",
      ),
      rpc<EpochInfo>(COOKIE_RPC, "getEpochInfo"),
      rpc<PerfSample[]>(COOKIE_RPC, "getRecentPerformanceSamples", [20]),
      rpc<string>(COOKIE_RPC, "getGenesisHash"),
    ]);
    if (genesis !== GENESIS_HASH) {
      return { status: "unverified", reason: COPY.WRONG_CLUSTER };
    }
    return {
      status: "ok",
      value: { health, version, epoch, samples, genesis },
    };
  } catch (err) {
    return {
      status: "unverified",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function loadWalletState(owner: PublicKey): Promise<{
  lamports: VerifyState<number>;
  das: VerifyState<DasAsset[]>;
  sigs: VerifyState<SignatureRow[]>;
}> {
  const lamports = await connection
    .getBalance(owner, "confirmed")
    .then((value): VerifyState<number> => ({ status: "ok", value }))
    .catch(
      (err): VerifyState<number> => ({
        status: "unverified",
        reason: err instanceof Error ? err.message : String(err),
      }),
    );

  const das = await rpc<{ items?: DasAsset[] }>(COOKIE_DAS, "getAssetsByOwner", {
    ownerAddress: owner.toBase58(),
    page: 1,
    limit: 50,
  })
    .then(
      (value): VerifyState<DasAsset[]> => ({
        status: "ok",
        value: value.items ?? [],
      }),
    )
    .catch(
      (err): VerifyState<DasAsset[]> => ({
        status: "unverified",
        reason: err instanceof Error ? err.message : String(err),
      }),
    );

  const sigs = await connection
    .getSignaturesForAddress(owner, { limit: 12 })
    .then(
      (rows): VerifyState<SignatureRow[]> => ({
        status: "ok",
        value: rows.map((row) => ({
          signature: row.signature,
          err: row.err,
          slot: row.slot,
        })),
      }),
    )
    .catch(
      (err): VerifyState<SignatureRow[]> => ({
        status: "unverified",
        reason: err instanceof Error ? err.message : String(err),
      }),
    );

  return { lamports, das, sigs };
}

export function buildBakeTx(
  payer: PublicKey,
  message: string,
  blockhash: string,
): Transaction {
  const memo = clampMemo(message);
  if (!memo) throw new Error("Bake message is empty");
  const ix = new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM,
    data: Buffer.from(new TextEncoder().encode(memo)),
  });
  const tx = new Transaction();
  tx.feePayer = payer;
  tx.recentBlockhash = blockhash;
  tx.add(ix);
  return tx;
}

export function explorerTx(sig: string) {
  return `${COOKIE_EXPLORER}/tx/${sig}`;
}

export function explorerAddr(addr: string) {
  return `${COOKIE_EXPLORER}/address/${addr}`;
}
