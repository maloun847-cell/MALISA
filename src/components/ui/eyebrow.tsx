import type { ReactNode } from "react";

export function Eyebrow({ children, glass = false }: { children: ReactNode; glass?: boolean }) {
  return <span className={glass ? "eyebrow-glass" : "eyebrow"}>{children}</span>;
}
