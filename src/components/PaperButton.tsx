import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./PaperButton.module.css";

export function PaperButton({
  children,
  tone = "cream",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "cream" | "money" | "ghost";
}) {
  const toneClass =
    tone === "money" ? styles.money : tone === "ghost" ? styles.ghost : "";
  return (
    <button className={`${styles.btn} ${toneClass}`} {...props}>
      {children}
    </button>
  );
}
