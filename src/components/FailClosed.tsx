import styles from "./FailClosed.module.css";

export function FailClosed({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <aside className={styles.well} role="status">
      <p className={styles.kicker}>{kicker}</p>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
    </aside>
  );
}
