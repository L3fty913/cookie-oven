export function formatCook(lamports: number): string {
  if (!Number.isFinite(lamports) || lamports < 0) return "CAN'T VERIFY";
  const whole = lamports / 1_000_000_000;
  return `${whole.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
  })} COOK`;
}

export function shortAddr(addr: string): string {
  if (!addr) return "CAN'T VERIFY";
  return addr.length > 12 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}

export function formatInt(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "CAN'T VERIFY";
  return n.toLocaleString();
}

export function tpsFromSamples(
  samples: { numNonVoteTransactions: number; samplePeriodSecs: number }[],
): number | null {
  if (!samples.length) return null;
  const recent = samples.slice(0, 5);
  const txs = recent.reduce((n, s) => n + (s.numNonVoteTransactions || 0), 0);
  const secs = recent.reduce((n, s) => n + (s.samplePeriodSecs || 0), 0);
  if (!secs) return null;
  return txs / secs;
}

export function clampMemo(message: string): string {
  return message.trim().slice(0, 180);
}
