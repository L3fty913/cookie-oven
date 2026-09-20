/// <reference types="vite/client" />

import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

interface NightlySolana {
  publicKey?: PublicKey;
  isConnected?: boolean;
  connect(): Promise<{ publicKey: PublicKey } | PublicKey>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
}

interface NightlyProvider {
  solana?: NightlySolana;
}

declare global {
  interface Window {
    nightly?: NightlyProvider;
  }
}

export {};
