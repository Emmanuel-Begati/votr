"use client";
import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "../../../actions";

type Defaults = { name?: string; handle?: string | null; photoUrl?: string | null; bio?: string };

export function ContestantForm({
  action,
  defaults = {},
  submitLabel,
  resetOnSuccess,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input name="name" required placeholder="Name" className="input" defaultValue={defaults.name} />
      <input name="handle" placeholder="@handle (IG/TikTok)" className="input" defaultValue={defaults.handle ?? ""} />
      <input name="photoUrl" type="url" placeholder="Photo URL (https://…)" className="input sm:col-span-2" defaultValue={defaults.photoUrl ?? ""} />
      <textarea name="bio" rows={2} placeholder="Short bio" className="input sm:col-span-2" defaultValue={defaults.bio} />
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn !py-2" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
        {state?.error && <span className="text-sm text-down">{state.error}</span>}
        {state?.ok && <span className="text-sm text-green-400">{state.ok}</span>}
      </div>
    </form>
  );
}
