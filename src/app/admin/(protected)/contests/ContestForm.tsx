"use client";
import { useActionState } from "react";
import type { FormState } from "../../actions";

type Defaults = {
  title?: string;
  slug?: string;
  description?: string;
  priceNaira?: number;
  minVotes?: number;
  maxVotes?: number;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  showLiveResults?: boolean;
};

export function ContestForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" required className="input" defaultValue={defaults.title} placeholder="Comedian of the Year 2026" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="slug">URL slug (optional, generated from the title)</label>
        <input id="slug" name="slug" className="input" defaultValue={defaults.slug} placeholder="comedian-of-the-year-2026" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} className="input" defaultValue={defaults.description} />
      </div>
      <div>
        <label className="label" htmlFor="priceNaira">Price per vote (₦)</label>
        <input id="priceNaira" name="priceNaira" type="number" min="1" step="any" required className="input" defaultValue={defaults.priceNaira ?? 100} />
      </div>
      <div>
        <label className="label" htmlFor="status">Status</label>
        <select id="status" name="status" className="input" defaultValue={defaults.status ?? "DRAFT"}>
          <option value="DRAFT">Draft (hidden)</option>
          <option value="LIVE">Live</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="minVotes">Min votes per payment</label>
        <input id="minVotes" name="minVotes" type="number" min="1" required className="input" defaultValue={defaults.minVotes ?? 1} />
      </div>
      <div>
        <label className="label" htmlFor="maxVotes">Max votes per payment</label>
        <input id="maxVotes" name="maxVotes" type="number" min="1" required className="input" defaultValue={defaults.maxVotes ?? 10000} />
      </div>
      <div>
        <label className="label" htmlFor="startsAt">Voting opens (Lagos time)</label>
        <input id="startsAt" name="startsAt" type="datetime-local" required className="input" defaultValue={defaults.startsAt} />
      </div>
      <div>
        <label className="label" htmlFor="endsAt">Voting closes (Lagos time)</label>
        <input id="endsAt" name="endsAt" type="datetime-local" required className="input" defaultValue={defaults.endsAt} />
      </div>
      <label className="flex items-center gap-3 sm:col-span-2">
        <input type="checkbox" name="showLiveResults" defaultChecked={defaults.showLiveResults ?? true} className="h-5 w-5 accent-[var(--stage)]" />
        <span>Show live vote counts and leaderboard publicly</span>
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
        {state?.error && <span className="text-sm text-down">{state.error}</span>}
        {state?.ok && <span className="text-sm text-green-400">{state.ok}</span>}
      </div>
    </form>
  );
}
