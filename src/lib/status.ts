export type BakePhase =
  | "idle"
  | "ready"
  | "wallet-confirmation"
  | "pending"
  | "confirmed"
  | "failed"
  | "disconnected";

export type VerifyState<T> =
  | { status: "loading" }
  | { status: "ok"; value: T }
  | { status: "unverified"; reason: string };

export const COPY = {
  LOADING: "LOADING",
  UNAVAILABLE: "CAN'T VERIFY",
  EMPTY: "NONE ON RECORD",
  DISCONNECTED: "WALLET CLOSED",
  WRONG_CLUSTER: "GENESIS MISMATCH — NOT COOKIE CHAIN",
} as const;

export function labelForPhase(phase: BakePhase): string {
  switch (phase) {
    case "idle":
      return "IDLE";
    case "ready":
      return "READY";
    case "wallet-confirmation":
      return "WAITING ON NIGHTLY";
    case "pending":
      return "PENDING";
    case "confirmed":
      return "CONFIRMED";
    case "failed":
      return "FAILED";
    case "disconnected":
      return COPY.DISCONNECTED;
  }
}

export function displayOrUnverified(
  state: VerifyState<string>,
  loading = COPY.LOADING,
): string {
  if (state.status === "loading") return loading;
  if (state.status === "unverified") return COPY.UNAVAILABLE;
  return state.value;
}
