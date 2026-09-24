"use client";

import { useRegister } from "./register-provider";

export function RegisterButton({ label = "Register to continue", className = "btn btn-ink" }: { label?: string; className?: string }) {
  const { open } = useRegister();
  return (
    <button type="button" onClick={open} className={className}>
      {label}
    </button>
  );
}
