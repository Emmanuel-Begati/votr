import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Anybody, Atkinson_Hyperlegible } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const body = Atkinson_Hyperlegible({ variable: "--font-body", subsets: ["latin"], weight: ["400", "700"] });
const display = Anybody({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Votr: vote for your favourite comedian", template: "%s | Votr" },
  description: "Choose a contest. Pick a comedian. Pay to vote. Easy and safe.",
};

export const viewport: Viewport = { themeColor: "#171b55" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="flex flex-col font-sans antialiased">
        <header className="on-band sticky top-0 z-40 bg-band text-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
            <Link href="/" className="rounded-md font-display text-2xl font-extrabold tracking-tight" style={{ fontStretch: "125%" }}>
              Votr
            </Link>
            <Link
              href="/contests"
              className="rounded-full border border-band-line px-4 py-1.5 text-sm font-bold text-white transition-colors hover:border-saffron hover:text-saffron"
            >
              All contests
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:pb-20 sm:pt-10">
          <MotionProvider>{children}</MotionProvider>
        </main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display font-bold text-text" style={{ fontStretch: "120%" }}>
              Votr
            </span>
            <span>Payments are handled by Paystack. Votes count only after payment is confirmed.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
