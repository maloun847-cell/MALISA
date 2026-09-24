"use client";

import { createContext, useActionState, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { registerAction, type FormState } from "@/app/actions";
import { keepValues } from "@/lib/forms";

const RegisterContext = createContext<{ open: () => void }>({ open: () => {} });

export function useRegister() {
  return useContext(RegisterContext);
}

export function RegisterProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = useCallback(() => dialog.current?.showModal(), []);

  return (
    <RegisterContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="register-title"
        className="m-auto w-[min(440px,calc(100vw-2rem))] rounded-[18px] border border-line bg-paper p-0 text-ink shadow-[0_40px_120px_-40px_rgba(31,28,25,0.55)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <RegisterForm onDone={() => dialog.current?.close()} />
      </dialog>
    </RegisterContext.Provider>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});

  useEffect(() => {
    if (!state.ok) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [state, onDone]);

  return (
    <form onSubmit={keepValues(action)} className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="eyebrow">Bidder registration</span>
        <button
          type="button"
          onClick={onDone}
          className="-m-2 grid size-9 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
      </div>
      <h2 id="register-title" className="display mt-5 text-[32px] leading-[1.05]">
        Get your <span className="tone">paddle</span>
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        Your paddle number is how you appear in the saleroom. Other bidders only see the number and your initials.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="label">Full name</span>
          <input name="name" autoComplete="name" required className="field mt-1.5" aria-invalid={!!state.errors?.name} />
          {state.errors?.name && <span className="mt-1 block text-sm text-signal">{state.errors.name}</span>}
        </label>
        <label className="block">
          <span className="label">E-mail</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field mt-1.5"
            aria-invalid={!!state.errors?.email}
          />
          {state.errors?.email && <span className="mt-1 block text-sm text-signal">{state.errors.email}</span>}
        </label>
      </div>

      <button type="submit" className="btn btn-ink mt-6 w-full" disabled={pending || state.ok}>
        {state.ok ? state.message : pending ? "Issuing paddle…" : "Register to bid"}
      </button>
      <p className="mt-4 text-center font-mono text-[11px] tracking-[0.04em] text-ink-3 uppercase">
        Free · No card needed to register
      </p>
    </form>
  );
}
