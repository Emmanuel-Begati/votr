import Link from "next/link";
import { db } from "@/lib/db";
import { applyVerifiedPayment } from "@/lib/votes";
import { getLiveData } from "@/lib/standings";
import { Avatar } from "@/components/Avatar";
import { Confetti } from "@/components/Confetti";
import { CrownIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ reference?: string; trxref?: string }> };

export default async function Callback({ searchParams }: Props) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;
  const tx = reference
    ? await db.transaction.findUnique({ where: { reference }, include: { contestant: true, contest: true } })
    : null;

  if (!reference || !tx) return <Shell title="Payment not found" body="We could not find this payment." />;

  let status: string = tx.status;
  try {
    status = (await applyVerifiedPayment(reference)).status;
  } catch (e) {
    console.error(e);
  }

  const back = `/c/${tx.contest.slug}/${tx.contestant.slug}`;

  if (status === "SUCCESS") {
    const live = await getLiveData(tx.contestId, tx.contest.showLiveResults);
    const me = live.standings.find((s) => s.id === tx.contestantId);
    const first = tx.contestant.name.split(/\s+/)[0];
    return (
      <>
        <Confetti />
        <div className="panel relative mx-auto max-w-lg overflow-hidden text-center">
          <div className="on-band bg-band px-8 pb-8 pt-12 text-white">
            <div className="relative mx-auto w-fit">
              {me?.rank === 1 && <CrownIcon className="absolute -top-7 left-1/2 h-9 w-9 -translate-x-1/2 text-saffron" />}
              <Avatar name={tx.contestant.name} src={tx.contestant.photoUrl} className={`h-28 w-28 rounded-2xl text-4xl ${me?.rank === 1 ? "ring-gold" : ""}`} />
            </div>
            <div className="num mt-6 text-7xl text-saffron">+{tx.votes.toLocaleString()}</div>
            <h1 className="display mt-3 text-3xl">Thank you</h1>
            <p className="mt-2 text-band-muted">Your votes for {tx.contestant.name} have been added.</p>
          </div>
          <div className="p-6 sm:p-8">

            {me && live.showResults && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-2 p-4">
                  <div className="num text-4xl">{me.rank}</div>
                  <div className="eyebrow mt-1">Position now</div>
                </div>
                <div className="rounded-xl bg-surface-2 p-4">
                  <div className="num text-4xl">{me.votes.toLocaleString()}</div>
                  <div className="eyebrow mt-1">Total votes</div>
                </div>
              </div>
            )}
            {me && live.showResults && (
              <p className="mt-4 text-sm">
                {me.rank === 1 ? (
                  <b className="text-gold">{first} is number 1.</b>
                ) : (
                  <span>
                    {first} needs <b>{me.gapToNext?.toLocaleString()}</b> more votes to be number {me.rank - 1}.
                  </span>
                )}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={back} className="btn-stage">Vote again</Link>
              <Link href={`/c/${tx.contest.slug}`} className="btn-ghost">See ranking</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (status === "PENDING") {
    return (
      <Shell
        title="Checking your payment…"
        body="Please wait a few minutes. Your votes will be added soon. Do not pay again."
        href={back}
        cta={`Back to ${tx.contestant.name}`}
      />
    );
  }
  if (status === "FLAGGED") {
    return (
      <Shell
        title="We need to check this payment"
        body={`We got your payment, but we could not add the votes (maybe voting had ended). Please contact us with this code: ${reference}`}
        href={back}
        cta="Back"
      />
    );
  }
  return <Shell title="Payment failed" body="No votes were added. Please try again." href={back} cta="Try again" />;
}

function Shell({ title, body, href = "/", cta = "Home" }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="panel mx-auto max-w-md p-8 text-center sm:p-10">
      <h1 className="display-tight text-2xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <Link href={href} className="btn-stage mt-8">
        {cta}
      </Link>
    </div>
  );
}
