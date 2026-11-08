import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password === "change-me") {
    throw new Error("Set ADMIN_PASSWORD in .env to something strong before seeding.");
  }
  await db.admin.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12) },
    create: { email, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin ready: ${email}`);

  if (process.argv.includes("--demo")) {
    const now = Date.now();
    const contest = await db.contest.upsert({
      where: { slug: "demo-comedy-awards" },
      update: {},
      create: {
        slug: "demo-comedy-awards",
        title: "Demo Comedy Awards",
        description: "A demo contest. Vote for the funniest comedian.",
        pricePerVote: 10000, // ₦100
        startsAt: new Date(now - 3600_000),
        endsAt: new Date(now + 14 * 86400_000),
        status: "LIVE",
      },
    });
    const names = ["Ada Laughs", "Tunde Jokes", "Chioma Cracks", "Emeka Banter", "Kemi Punchline", "Bayo Roast"];
    for (const [i, name] of names.entries()) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      await db.contestant.upsert({
        where: { contestId_slug: { contestId: contest.id, slug } },
        update: {},
        create: {
          contestId: contest.id,
          slug,
          code: `C${String(i + 1).padStart(2, "0")}`,
          name,
          handle: `@${slug.replace(/-/g, "")}`,
        },
      });
    }
    // Fake paid votes so the leaderboard has something to show. Marked with a demo_ reference.
    const existingDemo = await db.transaction.count({ where: { contestId: contest.id, reference: { startsWith: "demo_" } } });
    if (existingDemo === 0) {
      const people = await db.contestant.findMany({ where: { contestId: contest.id } });
      const weights = [9, 7, 6, 4, 3, 2];
      const fans = ["Chidi", "Amaka", "Segun", "Ngozi", "Femi", "Zainab", "Ifeanyi", "Tolu", null, null, "Uche", "Bisi"];
      const packs = [1, 10, 10, 25, 50, 50, 100, 500];
      let n = 0;
      for (const [i, p] of people.entries()) {
        const count = weights[i % weights.length] * 4;
        for (let k = 0; k < count; k++) {
          const votes = packs[Math.floor(Math.random() * packs.length)];
          const paidAt = new Date(now - Math.random() * 5 * 86400_000);
          const fan = fans[Math.floor(Math.random() * fans.length)];
          await db.transaction.create({
            data: {
              reference: `demo_${i}_${k}_${Date.now()}`,
              contestId: contest.id,
              contestantId: p.id,
              votes,
              amountKobo: votes * contest.pricePerVote,
              email: `${(fan ?? "anon").toLowerCase()}${k % 3}@example.com`,
              voterName: fan,
              status: "SUCCESS",
              paidAt,
              createdAt: paidAt,
              note: "Demo data",
            },
          });
          n++;
        }
      }
      for (const p of people) {
        const sum = await db.transaction.aggregate({ where: { contestantId: p.id, status: "SUCCESS" }, _sum: { votes: true } });
        await db.contestant.update({ where: { id: p.id }, data: { voteCount: sum._sum.votes ?? 0 } });
      }
      console.log(`Added ${n} demo payments`);
    }
    console.log(`Demo contest: /c/${contest.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
