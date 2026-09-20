import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import "./style.css";

(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
import {
  COOKIE_BRIDGE,
  COOKIE_DOCS,
  COOKIE_EXPLORER,
  GENESIS_HASH,
  buildBakeTx,
  connection,
  explorerAddr,
  explorerTx,
  formatCook,
  loadNetwork,
  loadWalletState,
  shortAddr,
  tpsFromSamples,
  type DasAsset,
  type PerfSample,
} from "./chain";
import { connectNightly, disconnectNightly, getNightly, signWithNightly } from "./wallet";

const app = document.querySelector<HTMLDivElement>("#app")!;

let owner: PublicKey | null = null;
let samples: PerfSample[] = [];

app.innerHTML = `
  <header class="top">
    <div class="brand">
      <div class="mark" aria-hidden="true"></div>
      <div>
        <h1>Cookie Oven</h1>
        <p class="sub">Live SVM ops board for Cookie Chain. Nightly in, memo out, explorer back.</p>
      </div>
    </div>
    <div class="actions">
      <a class="btn" href="${COOKIE_DOCS}" target="_blank" rel="noreferrer">Docs</a>
      <a class="btn" href="${COOKIE_EXPLORER}" target="_blank" rel="noreferrer">Cookiescan</a>
      <a class="btn" href="${COOKIE_BRIDGE}" target="_blank" rel="noreferrer">Bridge COOK</a>
      <button id="connect" class="primary">Connect Nightly</button>
    </div>
  </header>

  <section class="metrics">
    <div class="card"><div class="k">RPC health</div><div class="v" id="health">…</div></div>
    <div class="card"><div class="k">Slot / epoch</div><div class="v" id="slot">…</div></div>
    <div class="card"><div class="k">Non-vote TPS</div><div class="v" id="tps">…</div></div>
    <div class="card"><div class="k">Wallet COOK</div><div class="v" id="bal">—</div></div>
  </section>

  <section class="grid">
    <div class="card">
      <div class="k">Network</div>
      <p class="hint" id="netline">Reading Cookie Chain RPC…</p>
      <svg class="spark" id="spark" viewBox="0 0 300 72" preserveAspectRatio="none"></svg>
      <table>
        <tbody>
          <tr><th>Genesis</th><td class="mono" id="genesis">…</td></tr>
          <tr><th>SVM core</th><td class="mono" id="core">…</td></tr>
          <tr><th>Block height</th><td class="mono" id="height">…</td></tr>
          <tr><th>Tx count</th><td class="mono" id="txcount">…</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="k">Bake a receipt</div>
      <p class="hint">Signs a Memo program transaction with Nightly, then this app broadcasts it on <span class="mono">rpc.cookiescan.io</span>. The wallet never gets a fake Solana mainnet chain id.</p>
      <label for="memo">On-chain memo</label>
      <textarea id="memo">ovenboard bake · cookie chain</textarea>
      <div class="row">
        <button id="bake" class="primary" disabled>Bake on-chain</button>
        <button id="refresh" disabled>Refresh wallet</button>
      </div>
      <div class="status" id="status"></div>
      <p class="mono" id="wallet">wallet: not connected</p>
    </div>
  </section>

  <section class="grid" style="margin-top:14px">
    <div class="card">
      <div class="k">DAS tokens</div>
      <div id="tokens"><p class="hint">Connect Nightly to load Cookie DAS assets.</p></div>
    </div>
    <div class="card">
      <div class="k">Recent signatures</div>
      <div id="sigs"><p class="hint">No activity yet.</p></div>
    </div>
  </section>
`;

function el<T extends Element = HTMLElement>(id: string) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing`);
  return node as unknown as T;
}
const statusEl = el("status");

function setStatus(msg: string, kind: "" | "ok" | "bad" = "") {
  statusEl.className = `status ${kind}`;
  statusEl.textContent = msg;
}

function drawSpark(points: number[]) {
  const svg = el<SVGSVGElement>("spark");
  if (!points.length) {
    svg.innerHTML = "";
    return;
  }
  const max = Math.max(...points, 0.01);
  const w = 300;
  const h = 72;
  const path = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w;
      const y = h - (p / max) * (h - 8) - 4;
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  svg.innerHTML = `<path d="${path}" fill="none" stroke="#e3a24b" stroke-width="2"/>`;
}

async function refreshNetwork() {
  const net = await loadNetwork();
  samples = net.samples;
  const tps = tpsFromSamples(samples);
  el("health").textContent = net.health;
  el("health").className = `v ${net.health === "ok" ? "ok" : "bad"}`;
  el("slot").textContent = `${net.epoch.absoluteSlot.toLocaleString()} / ${net.epoch.epoch}`;
  el("tps").textContent = tps.toFixed(2);
  el("genesis").textContent = net.genesis;
  el("genesis").style.color = net.genesis === GENESIS_HASH ? "" : "var(--bad)";
  el("core").textContent = net.version["solana-core"];
  el("height").textContent = net.epoch.blockHeight.toLocaleString();
  el("txcount").textContent = net.epoch.transactionCount.toLocaleString();
  const pct = ((net.epoch.slotIndex / net.epoch.slotsInEpoch) * 100).toFixed(1);
  el("netline").textContent =
    `Cookie Chain healthy. Epoch ${net.epoch.epoch} is ${pct}% through ${net.epoch.slotsInEpoch.toLocaleString()} slots.`;
  drawSpark(
    [...samples]
      .reverse()
      .map((s) => (s.samplePeriodSecs ? s.numNonVoteTransactions / s.samplePeriodSecs : 0)),
  );
}

function renderTokens(items: DasAsset[]) {
  const root = el("tokens");
  if (!items.length) {
    root.innerHTML = `<p class="hint">No DAS assets on this wallet yet. Bridge COOK or hold SPL on Cookie Chain.</p>`;
    return;
  }
  root.innerHTML = `<table><thead><tr><th>Asset</th><th>Mint</th></tr></thead><tbody>${items
    .slice(0, 12)
    .map((a) => {
      const name = a.content?.metadata?.symbol || a.content?.metadata?.name || a.interface || "asset";
      return `<tr><td>${name}</td><td class="mono"><a href="${explorerAddr(a.id)}" target="_blank" rel="noreferrer">${shortAddr(a.id)}</a></td></tr>`;
    })
    .join("")}</tbody></table>`;
}

function renderSigs(
  sigs: { signature: string; err: unknown; slot: number }[],
) {
  const root = el("sigs");
  if (!sigs.length) {
    root.innerHTML = `<p class="hint">No signatures yet. Bake a receipt to land the first one.</p>`;
    return;
  }
  root.innerHTML = `<table><thead><tr><th>Sig</th><th>Slot</th><th>Status</th></tr></thead><tbody>${sigs
    .map((s) => {
      const ok = s.err ? "fail" : "ok";
      return `<tr><td class="mono"><a href="${explorerTx(s.signature)}" target="_blank" rel="noreferrer">${shortAddr(s.signature)}</a></td><td class="mono">${s.slot}</td><td class="${s.err ? "bad" : "ok"}">${ok}</td></tr>`;
    })
    .join("")}</tbody></table>`;
}

async function refreshWallet() {
  if (!owner) return;
  const state = await loadWalletState(owner);
  el("bal").textContent = formatCook(state.lamports);
  el("wallet").innerHTML = `wallet: <a href="${explorerAddr(owner.toBase58())}" target="_blank" rel="noreferrer">${owner.toBase58()}</a>`;
  renderTokens(state.das.items || []);
  renderSigs(state.sigs);
}

async function onConnect() {
  try {
    setStatus("Opening Nightly…");
    owner = await connectNightly();
    el("connect").textContent = "Disconnect";
    el<HTMLButtonElement>("bake").disabled = false;
    el<HTMLButtonElement>("refresh").disabled = false;
    setStatus(`Connected ${shortAddr(owner.toBase58())}`, "ok");
    await refreshWallet();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), "bad");
  }
}

async function onDisconnect() {
  await disconnectNightly();
  owner = null;
  el("connect").textContent = "Connect Nightly";
  el<HTMLButtonElement>("bake").disabled = true;
  el<HTMLButtonElement>("refresh").disabled = true;
  el("bal").textContent = "—";
  el("wallet").textContent = "wallet: not connected";
  setStatus("Disconnected");
}

el("connect").addEventListener("click", async () => {
  if (owner) await onDisconnect();
  else await onConnect();
});

el("refresh").addEventListener("click", async () => {
  try {
    await Promise.all([refreshNetwork(), refreshWallet()]);
    setStatus("Refreshed", "ok");
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), "bad");
  }
});

el("bake").addEventListener("click", async () => {
  if (!owner) return;
  const memo = el<HTMLTextAreaElement>("memo").value;
  try {
    el<HTMLButtonElement>("bake").disabled = true;
    setStatus("Fetching blockhash…");
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    const tx = buildBakeTx(owner, memo, blockhash);
    setStatus("Waiting for Nightly signature…");
    const signed = await signWithNightly(tx);
    setStatus("Broadcasting on Cookie Chain…");
    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
    });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    setStatus(`Baked. ${sig}`, "ok");
    await refreshWallet();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), "bad");
  } finally {
    el<HTMLButtonElement>("bake").disabled = !owner;
  }
});

refreshNetwork().catch((err) => {
  el("health").textContent = "down";
  el("health").className = "v bad";
  el("netline").textContent = err instanceof Error ? err.message : String(err);
});

if (getNightly()?.isConnected && getNightly()?.publicKey) {
  owner = getNightly()!.publicKey!;
  el("connect").textContent = "Disconnect";
  el<HTMLButtonElement>("bake").disabled = false;
  el<HTMLButtonElement>("refresh").disabled = false;
  refreshWallet().catch(() => undefined);
}

setInterval(() => {
  refreshNetwork().catch(() => undefined);
}, 15_000);
