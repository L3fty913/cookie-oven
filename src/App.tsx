import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { FailClosed } from "./components/FailClosed";
import { Metric, PaperSheet } from "./components/PaperSheet";
import { PaperButton } from "./components/PaperButton";
import { Receipt } from "./components/Receipt";
import {
  COOKIE_BRIDGE,
  COOKIE_DOCS,
  COOKIE_EXPLORER,
  connection,
  explorerAddr,
  explorerTx,
  loadNetwork,
  loadWalletState,
  type DasAsset,
  type NetworkSnapshot,
  type SignatureRow,
  buildBakeTx,
} from "./lib/chain";
import { formatCook, formatInt, shortAddr, tpsFromSamples } from "./lib/format";
import {
  COPY,
  type BakePhase,
  type VerifyState,
  displayOrUnverified,
  labelForPhase,
} from "./lib/status";
import { connectNightly, disconnectNightly, signWithNightly } from "./lib/wallet";

function metricText(state: VerifyState<string>): { value: string; unverified: boolean } {
  if (state.status === "ok") return { value: state.value, unverified: false };
  return { value: displayOrUnverified(state), unverified: state.status !== "loading" };
}

export function App() {
  const [network, setNetwork] = useState<VerifyState<NetworkSnapshot>>({
    status: "loading",
  });
  const [owner, setOwner] = useState<PublicKey | null>(null);
  const [lamports, setLamports] = useState<VerifyState<number>>({ status: "loading" });
  const [das, setDas] = useState<VerifyState<DasAsset[]>>({ status: "loading" });
  const [sigs, setSigs] = useState<VerifyState<SignatureRow[]>>({ status: "loading" });
  const [memo, setMemo] = useState("COOKIE OVEN · BAKE RECEIPT");
  const [phase, setPhase] = useState<BakePhase>("disconnected");
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshNetwork = useCallback(async () => {
    setNetwork(await loadNetwork());
  }, []);

  const refreshWallet = useCallback(async (key: PublicKey) => {
    const state = await loadWalletState(key);
    setLamports(state.lamports);
    setDas(state.das);
    setSigs(state.sigs);
  }, []);

  useEffect(() => {
    void refreshNetwork();
    const id = window.setInterval(() => void refreshNetwork(), 15_000);
    return () => window.clearInterval(id);
  }, [refreshNetwork]);

  async function onConnect() {
    setError(null);
    try {
      const key = await connectNightly();
      setOwner(key);
      setPhase("ready");
      await refreshWallet(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("disconnected");
    }
  }

  async function onDisconnect() {
    await disconnectNightly();
    setOwner(null);
    setPhase("disconnected");
    setLamports({ status: "loading" });
    setDas({ status: "loading" });
    setSigs({ status: "loading" });
  }

  async function onBake() {
    if (!owner) return;
    setError(null);
    setPhase("wallet-confirmation");
    try {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const tx = buildBakeTx(owner, memo, blockhash);
      const signed = await signWithNightly(tx);
      setPhase("pending");
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );
      setLastSig(sig);
      setPhase("confirmed");
      await refreshWallet(owner);
    } catch (err) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const slot = metricText(
    network.status === "ok"
      ? {
          status: "ok",
          value: `${formatInt(network.value.epoch.absoluteSlot)} / ${formatInt(network.value.epoch.epoch)}`,
        }
      : network.status === "loading"
        ? { status: "loading" }
        : { status: "unverified", reason: network.reason },
  );
  const tps = metricText(
    network.status === "ok"
      ? (() => {
          const n = tpsFromSamples(network.value.samples);
          return n === null
            ? { status: "unverified" as const, reason: "no samples" }
            : { status: "ok" as const, value: n.toFixed(2) };
        })()
      : network.status === "loading"
        ? { status: "loading" }
        : { status: "unverified", reason: network.reason },
  );
  const cook = metricText(
    !owner
      ? { status: "unverified", reason: COPY.DISCONNECTED }
      : lamports.status === "ok"
        ? { status: "ok", value: formatCook(lamports.value) }
        : lamports,
  );

  return (
    <div className="stage">
      <header className="mast">
        <div>
          <p className="kicker">Cookie Chain workbench</p>
          <h1>COOKIE OVEN</h1>
          <p className="lede">
            Paper on a well. Nightly signs. This desk broadcasts to Cookie RPC.
            Unverified reads print CAN&apos;T VERIFY — never a silent zero.
          </p>
        </div>
        <div className="actions">
          <a className="linkish" href={COOKIE_DOCS} target="_blank" rel="noreferrer">
            Docs
          </a>
          <a className="linkish" href={COOKIE_EXPLORER} target="_blank" rel="noreferrer">
            Cookiescan
          </a>
          <a className="linkish" href={COOKIE_BRIDGE} target="_blank" rel="noreferrer">
            Bridge COOK
          </a>
          {owner ? (
            <PaperButton tone="ghost" onClick={() => void onDisconnect()}>
              Close wallet
            </PaperButton>
          ) : (
            <PaperButton tone="money" onClick={() => void onConnect()}>
              Open Nightly
            </PaperButton>
          )}
        </div>
      </header>

      {network.status === "unverified" ? (
        <FailClosed
          kicker="RPC"
          title="CAN'T VERIFY COOKIE CHAIN"
          body={network.reason}
        />
      ) : null}

      <div className="metrics">
        <Metric
          kicker="RPC health"
          value={
            network.status === "ok"
              ? network.value.health.toUpperCase()
              : displayOrUnverified(network.status === "loading" ? { status: "loading" } : network)
          }
          unverified={network.status !== "ok"}
        />
        <Metric kicker="Slot / epoch" value={slot.value} unverified={slot.unverified} />
        <Metric kicker="Non-vote TPS" value={tps.value} unverified={tps.unverified} />
        <Metric kicker="Wallet COOK" value={cook.value} unverified={cook.unverified} />
      </div>

      <div className="rooms">
        <PaperSheet tone="cream" kicker="Work order · bake">
          <p>
            Connected:{" "}
            {owner ? (
              <a href={explorerAddr(owner.toBase58())} target="_blank" rel="noreferrer">
                {owner.toBase58()}
              </a>
            ) : (
              COPY.DISCONNECTED
            )}
          </p>
          <p>
            Phase <strong>{labelForPhase(phase)}</strong>
          </p>
          <label htmlFor="memo">Memo (stamped on-chain, 180 chars)</label>
          <textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <div className="row">
            <PaperButton
              tone="money"
              disabled={!owner || phase === "wallet-confirmation" || phase === "pending"}
              onClick={() => void onBake()}
            >
              Bake receipt
            </PaperButton>
            <PaperButton
              disabled={!owner}
              onClick={() => owner && void refreshWallet(owner)}
            >
              Refresh desk
            </PaperButton>
          </div>
          {error ? <p className="fail">{error}</p> : null}
        </PaperSheet>

        <div>
          {lastSig ? (
            <Receipt
              stamp={phase === "confirmed" ? "BAKED" : labelForPhase(phase)}
              rows={[
                { k: "tx", v: shortAddr(lastSig), href: explorerTx(lastSig) },
                {
                  k: "wallet",
                  v: owner ? shortAddr(owner.toBase58()) : COPY.DISCONNECTED,
                },
                { k: "cluster", v: "Cookie Chain" },
              ]}
            />
          ) : (
            <PaperSheet tone="dark" kicker="Receipt">
              <p>No bake on this desk yet. Open Nightly, then stamp a memo.</p>
            </PaperSheet>
          )}
        </div>
      </div>

      <div className="rooms" style={{ marginTop: "1rem" }}>
        <PaperSheet tone="cream" kicker="DAS tokens">
          {das.status === "unverified" ? (
            <p className="fail">{COPY.UNAVAILABLE}: {das.reason}</p>
          ) : das.status === "loading" ? (
            <p>{COPY.LOADING}</p>
          ) : das.value.length === 0 ? (
            <p>{COPY.EMPTY}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Mint</th>
                </tr>
              </thead>
              <tbody>
                {das.value.slice(0, 12).map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      {asset.content?.metadata?.symbol ||
                        asset.content?.metadata?.name ||
                        asset.interface}
                    </td>
                    <td>
                      <a href={explorerAddr(asset.id)} target="_blank" rel="noreferrer">
                        {shortAddr(asset.id)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PaperSheet>
        <PaperSheet tone="cream" kicker="Recent signatures">
          {sigs.status === "unverified" ? (
            <p className="fail">{COPY.UNAVAILABLE}: {sigs.reason}</p>
          ) : sigs.status === "loading" ? (
            <p>{COPY.LOADING}</p>
          ) : sigs.value.length === 0 ? (
            <p>{COPY.EMPTY}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sig</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sigs.value.map((row) => (
                  <tr key={row.signature}>
                    <td>
                      <a href={explorerTx(row.signature)} target="_blank" rel="noreferrer">
                        {shortAddr(row.signature)}
                      </a>
                    </td>
                    <td>{formatInt(row.slot)}</td>
                    <td className={row.err ? "fail" : "ok"}>
                      {row.err ? "FAIL" : "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PaperSheet>
      </div>
    </div>
  );
}
