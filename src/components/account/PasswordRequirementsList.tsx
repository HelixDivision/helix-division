"use client";

import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Live password-policy checklist, shared by RegisterForm, ResetPasswordForm,
 * and ChangePasswordForm (it was copy-pasted across all three until the
 * pre-Phase-9 architecture review). Each rule mirrors one `.regex()` check in
 * `passwordSchema` (lib/validations/auth.ts) — if the policy there changes,
 * this list must change with it; they are the same policy stated twice
 * (zod enforces, this displays).
 */
const passwordRequirements: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 12 characters", test: (v) => v.length >= 12 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordRequirementsList({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {passwordRequirements.map((requirement) => {
        const met = requirement.test(password);
        return (
          <li
            key={requirement.label}
            className={cn(
              "flex items-center gap-1.5",
              met ? "text-state-success" : "text-foreground-muted",
            )}
          >
            {met ? (
              <Check className="size-3.5 shrink-0" />
            ) : (
              <Circle className="size-3.5 shrink-0" />
            )}
            {requirement.label}
          </li>
        );
      })}
    </ul>
  );
}
