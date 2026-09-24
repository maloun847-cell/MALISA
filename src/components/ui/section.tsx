import type { ComponentProps } from "react";

type SectionProps = ComponentProps<"section"> & {
  /** Draw the hairline rule (and registration marks) along the top edge. */
  rule?: boolean;
};

/**
 * A row of the page frame: rails on both sides, a hairline rule on top, and
 * small registration marks where the rule meets the rails.
 */
export function Section({ className = "", rule = true, children, ...rest }: SectionProps) {
  return (
    <section className={`frame ${rule ? "border-t" : ""} ${className}`} {...rest}>
      {rule && (
        <>
          <span className="reg-mark" data-side="left" aria-hidden />
          <span className="reg-mark" data-side="right" aria-hidden />
        </>
      )}
      {children}
    </section>
  );
}

/** An empty band between sections, keeping the blueprint rhythm. */
export function Spacer({ className = "h-14 sm:h-20" }: { className?: string }) {
  return <div className={`frame border-t ${className}`} aria-hidden />;
}
