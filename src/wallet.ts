import { PublicKey, Transaction } from "@solana/web3.js";

export function getNightly() {
  return window.nightly?.solana ?? null;
}

function asPublicKey(value: unknown): PublicKey {
  if (value instanceof PublicKey) return value;
  if (value && typeof value === "object" && "publicKey" in value) {
    const inner = (value as { publicKey: unknown }).publicKey;
    if (inner instanceof PublicKey) return inner;
    if (typeof inner === "string") return new PublicKey(inner);
    if (inner && typeof inner === "object" && "toBase58" in inner) {
      return new PublicKey((inner as PublicKey).toBase58());
    }
  }
  if (typeof value === "string") return new PublicKey(value);
  throw new Error("Nightly did not return a public key");
}

export async function connectNightly(): Promise<PublicKey> {
  const nightly = getNightly();
  if (!nightly) {
    throw new Error(
      "Nightly wallet not found. Install it from nightly.app, then reload.",
    );
  }
  const result = await nightly.connect();
  const key = nightly.publicKey ?? asPublicKey(result);
  return key;
}

export async function disconnectNightly() {
  const nightly = getNightly();
  if (nightly?.disconnect) await nightly.disconnect();
}

export async function signWithNightly(tx: Transaction): Promise<Transaction> {
  const nightly = getNightly();
  if (!nightly?.signTransaction) {
    throw new Error("Nightly cannot sign transactions in this browser");
  }
  return nightly.signTransaction(tx);
}
