import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

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
  content?: {
    metadata?: { name?: string; symbol?: string };
  };
  token_info?: {
    balance?: number;
    decimals?: number;
    symbol?: string;
    price_info?: { price_per_token?: number };
  };
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

export async function loadNetwork() {
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
  return { health, version, epoch, samples, genesis };
}

export function tpsFromSamples(samples: PerfSample[]): number {
  if (!samples.length) return 0;
  const recent = samples.slice(0, 5);
  const txs = recent.reduce((n, s) => n + (s.numNonVoteTransactions || 0), 0);
  const secs = recent.reduce((n, s) => n + (s.samplePeriodSecs || 0), 0);
  return secs ? txs / secs : 0;
}

export async function loadWalletState(owner: PublicKey) {
  const [lamports, das, sigs] = await Promise.all([
    connection.getBalance(owner, "confirmed"),
    rpc<{ items?: DasAsset[]; total?: number }>(COOKIE_DAS, "getAssetsByOwner", {
      ownerAddress: owner.toBase58(),
      page: 1,
      limit: 50,
    }).catch(() => ({ items: [], total: 0 })),
    connection.getSignaturesForAddress(owner, { limit: 12 }),
  ]);
  return { lamports, das, sigs };
}

export function buildBakeTx(
  payer: PublicKey,
  message: string,
  blockhash: string,
): Transaction {
  const memo = message.trim().slice(0, 180);
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

export function formatCook(lamports: number) {
  return (lamports / 1_000_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export function shortAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}
