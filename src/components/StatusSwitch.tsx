"use client";
import { useFormStatus } from "react-dom";
import { setContestStatus } from "@/app/admin/actions";

const OPTIONS = [
  { value: "LIVE", label: "Live", hint: "Shown on the site. Voting follows the open and close dates." },
  { value: "CLOSED", label: "Closed", hint: "Shown as ended. No more votes." },
  { value: "DRAFT", label: "Draft", hint: "Hidden from the site." },
] as const;

const ON = { LIVE: "bg-up text-white", CLOSED: "bg-text text-white", DRAFT: "bg-saffron text-band" } as const;

/** Three-way switch for a contest's status. Each button submits on its own. */
export function StatusSwitch({ id, status }: { id: string; status: string }) {
  return (
    <form action={setContestStatus.bind(null, id)} className="inline-flex rounded-full border border-line bg-surface-2 p-0.5" aria-label="Contest status">
      <Buttons status={status} />
    </form>
  );
}

/** Inside the form so it can see when a change is saving. */
function Buttons({ status }: { status: string }) {
  const { pending, data } = useFormStatus();
  const shown = pending ? String(data?.get("status") ?? status) : status;
  return (
    <>
      {OPTIONS.map((o) => {
        const active = shown === o.value;
        return (
          <button
            key={o.value}
            name="status"
            value={o.value}
            title={o.hint}
            aria-pressed={active}
            disabled={active || pending}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:cursor-default ${
              active ? `${ON[o.value]} ${pending ? "opacity-60" : ""}` : "text-muted-foreground hover:bg-surface hover:text-text"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </>
  );
}
