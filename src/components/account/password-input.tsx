"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/** Password box with a show/hide eye. Labels are monospace caps to match the account popup. */
export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#9ba1ab]">{label}</span>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          className={`field w-full rounded-[3px] !border-[#2a2e36] !bg-[#0e1016] text-[#c9ccd3] px-3.5 py-3 pr-11 text-[15px] ${invalid ? "!border-[#e5484d]" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9ba1ab] hover:text-white"
        >
          {show ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
        </button>
      </div>
    </label>
  );
}
