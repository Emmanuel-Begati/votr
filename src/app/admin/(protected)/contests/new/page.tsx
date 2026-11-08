import { createContest } from "../../../actions";
import { ContestForm } from "../ContestForm";

export default function NewContest() {
  return (
    <div className="card max-w-3xl p-6">
      <h1 className="mb-6 font-display text-2xl font-extrabold">New contest</h1>
      <ContestForm action={createContest} submitLabel="Create contest" />
    </div>
  );
}
