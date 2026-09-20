# Superteam submission pack

Bounty: [Create an App on Cookie Chain](https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app/)
Deadline: 2026-09-22 21:59 UTC
Prize: $500 / $500 (two winners), $1,000 USDC total

## Form fields

| Field | Value |
| --- | --- |
| Live application URL | https://l3fty913.github.io/cookie-oven/ |
| GitHub repository | https://github.com/L3fty913/cookie-oven |
| Addresses | After the first bake, paste the connected wallet + memo tx from Cookiescan |

## You still have to do (human-only listing)

1. Sign in at https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app/
2. Install [Nightly](https://nightly.app), add Cookie RPC `https://rpc.cookiescan.io`
3. Bridge a tiny amount of COOK: https://hyperlane.cookiescan.io
4. Open the live app, Connect Nightly, Bake a receipt
5. Copy the tx link from Cookiescan into the addresses field
6. Post this X thread, then share it in https://t.me/TheCookieNetChain

## X thread draft

1/ Cookie Oven is live on Cookie Chain.

Nightly in. Live SVM slot/TPS board. DAS tokens. On-chain bake receipts.

https://l3fty913.github.io/cookie-oven/

2/ Cookie Chain is not in Wallet Standard's chain enum. If a dApp calls signAndSend as solana:mainnet, Nightly can broadcast to the wrong cluster.

Ovenboard only asks Nightly to sign, then submits the bytes itself to rpc.cookiescan.io.

3/ Stack:
- RPC https://rpc.cookiescan.io
- WS wss://ws.cookiescan.io
- DAS https://api.cookiescan.io
- Memo program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr

Source: https://github.com/L3fty913/cookie-oven

4/ Bridge COOK first if the wallet is empty: https://hyperlane.cookiescan.io
EOF
