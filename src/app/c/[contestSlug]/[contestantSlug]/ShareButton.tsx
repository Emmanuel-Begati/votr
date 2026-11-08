"use client";
import { useState } from "react";
import { ShareIcon } from "@/components/icons";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function open(base: string) {
    const text = encodeURIComponent(`${title} ${window.location.href}`);
    window.open(`${base}${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="rounded-[14px] bg-band p-5 text-white sm:p-7">
      <h2 className="display-tight text-xl">Ask your friends to vote</h2>
      <p className="mt-1 text-band-muted">Send this page on WhatsApp or X so they can vote too.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => open("https://wa.me/?text=")} className="btn-saffron !px-5 !py-2.5">
          Share on WhatsApp
        </button>
        <button
          type="button"
          onClick={() => open("https://twitter.com/intent/tweet?text=")}
          className="inline-flex items-center rounded-full border border-band-line px-5 py-2.5 font-bold transition-colors hover:bg-band-2"
        >
          Share on X
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-2 rounded-full border border-band-line px-5 py-2.5 font-bold transition-colors hover:bg-band-2"
        >
          <ShareIcon className="h-4 w-4" />
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
