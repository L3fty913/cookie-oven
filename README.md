# Cookie Oven

Cookie Chain workbench. Paper sheets on a well. Nightly signs. This desk broadcasts.

Built against the Cash Apes frontend canon (paper cutout, offset shadows, fail-closed reads) and The Tape kill list (no generic crypto HUD, no fake activity).

Live: https://l3fty913.github.io/cookie-oven/

## Invariants

- Unverified RPC / DAS / balance reads print **CAN'T VERIFY**. Never a silent zero.
- Empty wallet state prints **NONE ON RECORD**, distinct from unverified.
- Bake phases: idle → ready → waiting on Nightly → pending → confirmed | failed.
- Nightly **signs only**. Broadcast is `rpc.cookiescan.io` + `wss://ws.cookiescan.io`. Cookie Chain is not in Wallet Standard's chain enum; `signAndSendTransaction` as `solana:mainnet` is a cluster bug.
- Genesis pin: `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2`. Mismatch fails closed.

## Stack

Vite, React, TypeScript, Vitest. Tokens and grain from the Cash Apes paper system. No ape traits.

```bash
npm install
npm test
npm run dev
```

## Bounty

[Create an App on Cookie Chain](https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app/) — $1,000 USDC, due 22 Sep 2026. Submission pack: `SUBMISSION.md`.
