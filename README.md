# Cookie Oven

Live ops cApp on **Cookie Chain** (SVM). Built for the Superteam Earn bounty [Create an App on Cookie Chain](https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app/).

## What it does

- Connects **Nightly** (required by the bounty)
- Reads live Cookie Chain health, slot, epoch, genesis, and non-vote TPS from `https://rpc.cookiescan.io`
- Shows COOK balance plus **Cookie DAS** assets from `https://api.cookiescan.io`
- Bakes an on-chain **memo receipt**: Nightly signs, the app broadcasts on Cookie RPC (it does not ask the wallet to send as `solana:mainnet`)
- Links out to Cookiescan, docs, and the Hyperlane COOK bridge

## Why the send path is this way

Cookie Chain is Solana-compatible but is not in the Wallet Standard chain enum. If the app calls `signAndSendTransaction` with `solana:mainnet`, Nightly can broadcast to the wrong cluster. Ovenboard only asks Nightly to **sign**, then submits the signed bytes itself through the Cookie Connection (`rpc.cookiescan.io` + `wss://ws.cookiescan.io`).

## Run locally

```bash
npm install
npm run dev
```

Install [Nightly](https://nightly.app), add Cookie Chain RPC `https://rpc.cookiescan.io`, bridge a little COOK from Solana, then Connect Nightly → Bake on-chain.

## Network

| | |
| --- | --- |
| RPC | https://rpc.cookiescan.io |
| WebSocket | wss://ws.cookiescan.io |
| DAS | https://api.cookiescan.io |
| Explorer | https://cookiescan.io |
| Bridge | https://hyperlane.cookiescan.io |
| Genesis | `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2` |
| Memo program | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |

## Submit

1. Live app URL (GitHub Pages after deploy)
2. This repository
3. After the first bake: the memo transaction signature / wallet address
