import styles from "./Receipt.module.css";

export function Receipt({
  stamp,
  rows,
}: {
  stamp: string;
  rows: { k: string; v: string; href?: string }[];
}) {
  return (
    <aside className={styles.receipt}>
      <p className={styles.stamp}>{stamp}</p>
      {rows.map((row) => (
        <div className={styles.row} key={row.k}>
          <span>{row.k}</span>
          {row.href ? (
            <a className={styles.mono} href={row.href} target="_blank" rel="noreferrer">
              {row.v}
            </a>
          ) : (
            <span className={styles.mono}>{row.v}</span>
          )}
        </div>
      ))}
    </aside>
  );
}
