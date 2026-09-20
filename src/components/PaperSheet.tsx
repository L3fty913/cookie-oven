import type { ReactNode } from "react";
import styles from "./PaperSheet.module.css";

type Tone = "dark" | "cream" | "manila";

export function PaperSheet({
  children,
  tone = "dark",
  kicker,
}: {
  children: ReactNode;
  tone?: Tone;
  kicker?: string;
}) {
  return (
    <section className={styles.wrap} data-tone={tone}>
      <span className={styles.backing} aria-hidden />
      <div className={styles.face}>
        {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function Metric({
  kicker,
  value,
  unverified,
}: {
  kicker: string;
  value: string;
  unverified?: boolean;
}) {
  return (
    <PaperSheet tone="manila" kicker={kicker}>
      <div className={styles.value} data-unverified={unverified ? "true" : "false"}>
        {value}
      </div>
    </PaperSheet>
  );
}
