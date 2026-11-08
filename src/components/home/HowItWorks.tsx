const STEPS = [
  { title: "Pick a comedian", body: "Open a contest and tap the comedian you like." },
  { title: "Choose your votes", body: "Pick how many votes you want. You see the price before you pay." },
  { title: "Pay", body: "Pay with card, bank transfer or USSD. Your votes are added as soon as the payment is confirmed." },
];

/** Three real steps in order, so they are numbered. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-title">
      <h2 id="how-title" className="display-tight mb-6 text-2xl sm:text-3xl">
        How to vote
      </h2>
      <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative sm:pr-4">
            <div className="flex items-center gap-3">
              <span className="num grid h-11 w-11 shrink-0 place-items-center rounded-full bg-band text-xl text-saffron">{i + 1}</span>
              <span aria-hidden className="hidden h-px flex-1 bg-line-strong sm:block" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
            <p className="mt-1 text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
