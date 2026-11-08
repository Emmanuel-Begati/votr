"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { applyVerifiedPayment } from "@/lib/votes";
import { fromLocalInput, slugify } from "@/lib/util";
import { rateLimit } from "@/lib/ratelimit";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!rateLimit(`login:${email}`, 5, 5 * 60_000)) return { error: "Too many attempts. Wait a few minutes." };
  const admin = await db.admin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const ContestInput = z
  .object({
    title: z.string().min(3).max(120),
    slug: z.string().max(60).optional(),
    description: z.string().max(2000).default(""),
    priceNaira: z.coerce.number().positive().max(1_000_000),
    minVotes: z.coerce.number().int().min(1),
    maxVotes: z.coerce.number().int().min(1).max(1_000_000),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    status: z.enum(["DRAFT", "LIVE", "CLOSED"]),
    showLiveResults: z.boolean(),
  })
  .refine((v) => v.maxVotes >= v.minVotes, { message: "Max votes must be at least min votes." });

function parseContest(form: FormData) {
  return ContestInput.safeParse({
    title: form.get("title"),
    slug: form.get("slug") || undefined,
    description: form.get("description") ?? "",
    priceNaira: form.get("priceNaira"),
    minVotes: form.get("minVotes"),
    maxVotes: form.get("maxVotes"),
    startsAt: form.get("startsAt"),
    endsAt: form.get("endsAt"),
    status: form.get("status"),
    showLiveResults: form.get("showLiveResults") === "on",
  });
}

function contestData(v: z.infer<typeof ContestInput>) {
  return {
    title: v.title,
    slug: slugify(v.slug || v.title),
    description: v.description,
    pricePerVote: Math.round(v.priceNaira * 100),
    minVotes: v.minVotes,
    maxVotes: v.maxVotes,
    startsAt: fromLocalInput(v.startsAt),
    endsAt: fromLocalInput(v.endsAt),
    status: v.status,
    showLiveResults: v.showLiveResults,
  };
}

export async function createContest(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseContest(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = contestData(parsed.data);
  if (data.endsAt <= data.startsAt) return { error: "End date must be after start date." };
  if (await db.contest.findUnique({ where: { slug: data.slug } })) return { error: "That URL slug is already taken." };
  const c = await db.contest.create({ data });
  redirect(`/admin/contests/${c.id}`);
}

export async function updateContest(id: string, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseContest(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = contestData(parsed.data);
  if (data.endsAt <= data.startsAt) return { error: "End date must be after start date." };
  const clash = await db.contest.findUnique({ where: { slug: data.slug } });
  if (clash && clash.id !== id) return { error: "That URL slug is already taken." };
  await db.contest.update({ where: { id }, data });
  revalidatePath(`/admin/contests/${id}`);
  return { ok: "Saved." };
}

const Status = z.enum(["DRAFT", "LIVE", "CLOSED"]);

/** Quick status switch from the dashboard or the contest page. */
export async function setContestStatus(id: string, form: FormData) {
  await requireAdmin();
  const status = Status.parse(form.get("status"));
  const c = await db.contest.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath(`/admin/contests/${id}`);
  revalidatePath("/");
  revalidatePath("/contests");
  revalidatePath(`/c/${c.slug}`);
}

export async function deleteContest(id: string) {
  await requireAdmin();
  const paid = await db.transaction.count({ where: { contestId: id, status: "SUCCESS" } });
  if (paid > 0) throw new Error("Can't delete a contest with paid votes. Close it instead.");
  await db.contest.delete({ where: { id } });
  redirect("/admin");
}

const ContestantInput = z.object({
  name: z.string().min(1).max(80),
  handle: z.string().max(80).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(1000).default(""),
});

export async function addContestant(contestId: string, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = ContestantInput.safeParse({
    name: form.get("name"),
    handle: form.get("handle") || undefined,
    photoUrl: form.get("photoUrl") || "",
    bio: form.get("bio") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const v = parsed.data;

  let slug = slugify(v.name) || "contestant";
  const existing = await db.contestant.findMany({ where: { contestId }, select: { slug: true, code: true } });
  const slugs = new Set(existing.map((e) => e.slug));
  if (slugs.has(slug)) {
    let n = 2;
    while (slugs.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  const maxCode = existing.reduce((m, e) => Math.max(m, parseInt(e.code.replace(/\D/g, ""), 10) || 0), 0);
  const code = `C${String(maxCode + 1).padStart(2, "0")}`;

  await db.contestant.create({
    data: { contestId, slug, code, name: v.name, handle: v.handle || null, photoUrl: v.photoUrl || null, bio: v.bio },
  });
  revalidatePath(`/admin/contests/${contestId}`);
  return { ok: `${v.name} added.` };
}

export async function updateContestant(id: string, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = ContestantInput.safeParse({
    name: form.get("name"),
    handle: form.get("handle") || undefined,
    photoUrl: form.get("photoUrl") || "",
    bio: form.get("bio") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const v = parsed.data;
  const c = await db.contestant.update({
    where: { id },
    data: { name: v.name, handle: v.handle || null, photoUrl: v.photoUrl || null, bio: v.bio },
  });
  revalidatePath(`/admin/contests/${c.contestId}`);
  return { ok: "Saved." };
}

export async function deleteContestant(id: string) {
  await requireAdmin();
  const c = await db.contestant.findUniqueOrThrow({ where: { id } });
  const paid = await db.transaction.count({ where: { contestantId: id, status: "SUCCESS" } });
  if (paid > 0) throw new Error("Can't delete a contestant who has paid votes.");
  await db.contestant.delete({ where: { id } });
  revalidatePath(`/admin/contests/${c.contestId}`);
}

export async function reverifyTransaction(reference: string) {
  await requireAdmin();
  try {
    await applyVerifiedPayment(reference);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/admin/transactions");
}

export async function recomputeVoteCounts(contestId: string) {
  await requireAdmin();
  const sums = await db.transaction.groupBy({
    by: ["contestantId"],
    where: { contestId, status: "SUCCESS" },
    _sum: { votes: true },
  });
  const map = new Map(sums.map((s) => [s.contestantId, s._sum.votes ?? 0]));
  const contestants = await db.contestant.findMany({ where: { contestId } });
  await db.$transaction(
    contestants.map((c) => db.contestant.update({ where: { id: c.id }, data: { voteCount: map.get(c.id) ?? 0 } })),
  );
  revalidatePath(`/admin/contests/${contestId}`);
}
