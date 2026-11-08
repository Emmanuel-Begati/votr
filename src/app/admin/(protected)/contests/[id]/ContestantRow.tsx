"use client";
import { useState, useTransition } from "react";
import { deleteContestant, updateContestant } from "../../../actions";
import { ContestantForm } from "./ContestantForm";

type C = { id: string; name: string; handle: string | null; photoUrl: string | null; bio: string };

export function ContestantRow({ contestant, summary }: { contestant: C; summary: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm(`Remove ${contestant.name}?`)) return;
    setError("");
    start(async () => {
      try {
        await deleteContestant(contestant.id);
      } catch (e) {
        setError((e as Error).message || "Could not delete");
      }
    });
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">{summary}</div>
        <button type="button" onClick={() => setEditing((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground">
          {editing ? "Close" : "Edit"}
        </button>
        <button type="button" onClick={remove} disabled={pending} className="text-sm text-down hover:underline">
          Delete
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-down">{error}</p>}
      {editing && (
        <div className="mt-4">
          <ContestantForm action={updateContestant.bind(null, contestant.id)} defaults={contestant} submitLabel="Save" />
        </div>
      )}
    </div>
  );
}
