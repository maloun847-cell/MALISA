import type { ReactNode } from "react";

type Props = {
  lead: ReactNode;
  tone: ReactNode;
  as?: "h1" | "h2";
  className?: string;
  /** Put the quieter half on its own line. */
  stacked?: boolean;
};

/** Two-tone heading: a light sans lead followed by a serif-italic phrase. */
export function SplitHeading({ lead, tone, as: Tag = "h2", className = "", stacked = true }: Props) {
  return (
    <Tag className={`display text-balance ${className}`}>
      {lead}
      {stacked ? <br /> : " "}
      <span className="tone">{tone}</span>
    </Tag>
  );
}
