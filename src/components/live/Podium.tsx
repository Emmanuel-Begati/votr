"use client";
import Link from "next/link";
import { motion } from "motion/react";
import type { Standing } from "@/lib/standings";
import { Avatar } from "@/components/Avatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { CrownIcon } from "@/components/icons";
import { METAL, Movement } from "./Badges";

const STEP = { 1: "h-24 sm:h-32", 2: "h-16 sm:h-24", 3: "h-11 sm:h-16" } as const;
const AVATAR = {
  1: "h-16 w-16 sm:h-24 sm:w-24 text-xl sm:text-3xl",
  2: "h-14 w-14 sm:h-20 sm:w-20 text-base sm:text-2xl",
  3: "h-14 w-14 sm:h-20 sm:w-20 text-base sm:text-2xl",
} as const;
const STEP_BG = { 1: "bg-saffron text-band", 2: "bg-[#d9dcea] text-silver", 3: "bg-[#ecd3bf] text-bronze" } as const;

export function Podium({ top, contestSlug }: { top: Standing[]; contestSlug: string }) {
  // Visual order: 2nd, 1st, 3rd
  const slots = [top[1], top[0], top[2]];
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-2 sm:gap-4">
      {slots.map((s, i) => {
        if (!s) return <div key={i} />;
        const place = (i === 1 ? 1 : i === 0 ? 2 : 3) as 1 | 2 | 3;
        const m = METAL[place];
        return (
          <motion.div key={s.id} layout transition={{ type: "spring", stiffness: 160, damping: 22 }} className="flex min-w-0 flex-col items-center">
            <Link href={`/c/${contestSlug}/${s.slug}`} className="group flex min-w-0 max-w-full flex-col items-center px-1 text-center">
              <div className="relative mb-3">
                {place === 1 && <CrownIcon className="absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2 text-saffron sm:-top-8 sm:h-8 sm:w-8" />}
                <Avatar name={s.name} src={s.photoUrl} className={`rounded-2xl ${AVATAR[place]} ${m.ring}`} />
              </div>
              <div className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-stage sm:text-base">{s.name}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <AnimatedNumber value={s.votes} className="num text-lg sm:text-2xl" />
                <Movement value={s.movement} />
              </div>
            </Link>
            <motion.div
              className={`mt-3 grid w-full origin-bottom place-items-center rounded-t-xl ${STEP[place]} ${STEP_BG[place]}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.7, delay: 0.1 + (3 - place) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="num text-3xl sm:text-5xl">{place}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
