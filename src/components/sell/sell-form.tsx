"use client";

import { useActionState, useState, type ReactNode } from "react";
import { createLotAction, type FormState } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { keepValues } from "@/lib/forms";

export function SellForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createLotAction, {});
  const [preview, setPreview] = useState<string | null>(null);
  const err = state.errors ?? {};

  return (
    <form onSubmit={keepValues(action)} noValidate>
      <Step index={1} title="The object">
        <Field label="Title" error={err.title} className="sm:col-span-2">
          <input name="title" required maxLength={90} placeholder="e.g. Steel chronograph with tachymeter bezel" className="field" aria-invalid={!!err.title} />
        </Field>
        <Field label="Maker or origin">
          <input name="maker" placeholder="e.g. Swiss-made, Florentine workshop" className="field" />
        </Field>
        <Field label="Period">
          <input name="period" placeholder="e.g. 1970s, c. 1890" className="field" />
        </Field>
        <Field label="Category" error={err.category} className="sm:col-span-2">
          <select name="category" required defaultValue="" className="field" aria-invalid={!!err.category}>
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description" error={err.description} className="sm:col-span-2">
          <textarea
            name="description"
            rows={5}
            required
            placeholder="What it is, what state it is in, and anything a careful buyer would want to know."
            className="field resize-y"
            aria-invalid={!!err.description}
          />
        </Field>
      </Step>

      <Step index={2} title="Photograph">
        <div className="sm:col-span-2">
          <label
            className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-dashed bg-paper-2 text-center transition-colors hover:border-ink-3 ${
              err.image ? "border-signal" : "border-line-2"
            }`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={preview} alt="Preview of your photograph" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <span className="grid size-10 place-items-center rounded-full border border-line-2 bg-paper text-ink-3">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </span>
                <span className="mt-3 text-[15px]">Add a photograph</span>
                <span className="label mt-1">JPEG, PNG or WebP · up to 5 MB</span>
              </>
            )}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview((old) => {
                  if (old) URL.revokeObjectURL(old);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
            />
          </label>
          {err.image && <p className="mt-1.5 text-sm text-signal">{err.image}</p>}
          <p className="mt-2 text-[13px] text-ink-3">
            Use daylight and a plain background. Photograph any damage: honest pictures sell for more.
          </p>
        </div>
      </Step>

      <Step index={3} title="Pricing">
        <Field label="Starting bid (€)" error={err.startingBid}>
          <input name="startingBid" inputMode="numeric" required placeholder="100" className="field" aria-invalid={!!err.startingBid} />
        </Field>
        <Field label="Reserve (€, optional)" error={err.reserve} hint="Confidential minimum. Leave empty for no reserve.">
          <input name="reserve" inputMode="numeric" placeholder="—" className="field" aria-invalid={!!err.reserve} />
        </Field>
        <Field label="Estimate (€)" error={err.estimate} className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <input name="estimateLow" inputMode="numeric" required placeholder="Low" className="field" aria-invalid={!!err.estimate} />
            <span className="text-ink-3">–</span>
            <input name="estimateHigh" inputMode="numeric" required placeholder="High" className="field" aria-invalid={!!err.estimate} />
          </div>
        </Field>
        <Field label="Duration" error={err.duration} className="sm:col-span-2">
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 5, 7].map((d) => (
              <label key={d} className="relative">
                <input type="radio" name="duration" value={d} defaultChecked={d === 7} className="peer sr-only" />
                <span className="flex h-11 cursor-pointer items-center justify-center rounded-full border border-line text-[14px] transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-paper-3 hover:border-ink-3">
                  {d} {d === 1 ? "day" : "days"}
                </span>
              </label>
            ))}
          </div>
        </Field>
      </Step>

      <Step index={4} title="Details" last>
        <Field label="Specifications" hint="One per line, as “Label: value”." className="sm:col-span-2">
          <textarea name="specs" rows={4} placeholder={"Dimensions: 56 × 30 × 28 cm\nMaterial: Full-grain leather"} className="field resize-y font-mono text-[13px]" />
        </Field>
        <Field label="Known wear" hint="One per line, as “Area: note”. These become the lettered notes in your condition report." className="sm:col-span-2">
          <textarea name="notes" rows={3} placeholder={"Base: Scuffs on the corners\nHandles: Stitching intact"} className="field resize-y font-mono text-[13px]" />
        </Field>
        <Field label="Ships from" error={err.location} className="sm:col-span-2">
          <input name="location" required placeholder="City, country" className="field" aria-invalid={!!err.location} />
        </Field>
      </Step>

      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-[14px] ${state.message || Object.keys(err).length ? "text-signal" : "text-ink-3"}`} aria-live="polite">
          {state.message ?? (Object.keys(err).length ? "Please check the highlighted fields." : "Bidding opens as soon as you submit.")}
        </p>
        <button type="submit" className="btn btn-ink h-12 px-7" disabled={pending}>
          {pending ? "Listing…" : "List this lot"}
        </button>
      </div>
    </form>
  );
}

function Step({ index, title, last = false, children }: { index: number; title: string; last?: boolean; children: ReactNode }) {
  return (
    <fieldset className={`grid gap-8 py-8 md:grid-cols-[180px_1fr] ${last ? "" : "border-b border-line"}`}>
      <legend className="contents">
        <span className="flex items-baseline gap-3 text-[20px] tracking-[-0.02em]">
          <span className="font-mono text-[12px] text-ink-3">[{index}]</span>
          {title}
        </span>
      </legend>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block">
        <span className="label">{label}</span>
        <div className="mt-1.5">{children}</div>
      </label>
      {error ? (
        <p className="mt-1.5 text-sm text-signal">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}
