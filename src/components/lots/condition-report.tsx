"use client";

import Image from "next/image";
import { useState } from "react";
import type { Lot } from "@/lib/types";

type Props = {
  lot: Pick<Lot, "title" | "image" | "condition">;
  /** Show the grade as a glass panel floating over the photograph. */
  overlayGrade?: boolean;
  sizes?: string;
};

export function ConditionReport({ lot, overlayGrade = false, sizes = "(min-width: 1024px) 600px, 100vw" }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const { notes, grade } = lot.condition;
  const placed = notes.filter((n) => n.x != null && n.y != null);

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[var(--radius-card)] bg-paper-2"
        style={{ aspectRatio: `${lot.image.width} / ${lot.image.height}` }}
      >
        <Image
          src={lot.image.src}
          alt={`${lot.title}, annotated for condition`}
          fill
          sizes={sizes}
          className="object-cover"
          unoptimized={lot.image.src.startsWith("/api/")}
        />
        {placed.map((note) => {
          const on = active === note.key;
          return (
            <button
              key={note.key}
              type="button"
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${note.x}%`, top: `${note.y}%` }}
              onMouseEnter={() => setActive(note.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(note.key)}
              onBlur={() => setActive(null)}
              aria-label={`${note.key}: ${note.label}`}
            >
              <span
                className={`absolute inset-0 -m-2 rounded-full border transition-opacity ${
                  on ? "border-white/80 opacity-100" : "border-white/50 opacity-0 group-hover:opacity-100"
                }`}
                aria-hidden
              />
              <span
                className={`relative grid size-6 place-items-center rounded-full font-mono text-[11px] shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition-colors ${
                  on ? "bg-ink text-white" : "bg-white/90 text-ink backdrop-blur"
                }`}
              >
                {note.key}
              </span>
              <span
                className={`pointer-events-none absolute top-1/2 left-full ml-2.5 -translate-y-1/2 rounded-md bg-ink/80 px-2 py-1 font-mono text-[10.5px] tracking-[0.04em] whitespace-nowrap text-white uppercase backdrop-blur transition-opacity ${
                  on ? "opacity-100" : "opacity-0"
                }`}
              >
                {note.label}
              </span>
            </button>
          );
        })}
        {overlayGrade && grade > 0 && (
          <div className="glass absolute top-3 left-3 w-[min(270px,calc(100%-1.5rem))] p-4 max-sm:hidden">
            <GradeGauge grade={grade} dark />
          </div>
        )}
      </div>
      {overlayGrade && grade > 0 && (
        <div className="mt-5 sm:hidden">
          <GradeGauge grade={grade} />
        </div>
      )}

      {notes.length > 0 && (
        <ol className="mt-5 divide-y divide-line border-y border-line">
          {notes.map((note) => (
            <li
              key={note.key}
              className={`flex gap-4 py-3 transition-colors ${active === note.key ? "bg-paper-2" : ""}`}
              onMouseEnter={() => setActive(note.key)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="w-7 shrink-0 pl-1 font-mono text-[12px] text-ink-3">[{note.key}]</span>
              <span className="w-36 shrink-0 text-[14px] text-ink sm:w-44">{note.label}</span>
              <span className="text-[14px] leading-relaxed text-ink-2">{note.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const BANDS = ["Poor", "Fair", "Good", "Excellent"];

export function GradeGauge({ grade, dark = false }: { grade: number; dark?: boolean }) {
  const pct = Math.min(100, Math.max(0, grade * 10));
  const band = BANDS[Math.min(3, Math.floor(grade / 2.5))];
  const muted = dark ? "text-white/70" : "text-ink-3";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={`font-mono text-[11px] tracking-[0.06em] uppercase ${muted}`}>Condition grade</span>
        <span className={`font-mono text-[11px] tracking-[0.06em] uppercase ${muted}`}>{band}</span>
      </div>
      <p className="mt-1.5 text-[34px] leading-none font-light tracking-[-0.03em] tabular-nums">
        {grade.toFixed(1)}
        <span className={`ml-1 text-[15px] ${muted}`}>/ 10</span>
      </p>
      <div className="relative mt-4 h-1.5 rounded-full">
        <div className={`absolute inset-0 rounded-full ${dark ? "bg-white/20" : "bg-paper-3"}`} />
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${dark ? "bg-white" : "bg-ink"}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
            dark ? "border-white bg-sand-deep" : "border-ink bg-paper"
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className={`relative mt-2 h-3 font-mono text-[10px] tracking-[0.04em] ${muted}`}>
        {[0, 2.5, 5, 7.5, 10].map((tick) => (
          <span
            key={tick}
            className={`absolute top-0 ${tick === 0 ? "" : tick === 10 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${tick * 10}%` }}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}
