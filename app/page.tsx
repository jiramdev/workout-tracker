// app/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const todayIndex = new Date().getDay(); // 0 = zondag, 1 = maandag, ...

  // Haal plan voor vandaag op
  const scheduleDay = await prisma.scheduleDay.findFirst({
    where: {
      schedule: { userId: session.user.id },
      dayOfWeek: todayIndex,
    },
    include: {
      plan: {
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });

  // Haal aantal sessies deze maand op
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyWorkoutCount = await prisma.workoutLog.count({
    where: {
      userId: session.user.id,
      completedAt: { gte: startOfMonth },
    },
  });

  // Haal laatste lichaamsgewicht op
  const latestWeight = await prisma.bodyWeightLog.findFirst({
    where: { userId: session.user.id },
    orderBy: { loggedAt: "desc" },
  });

  const plan = scheduleDay?.plan;

  const dayNames = [
    "Zondag",
    "Maandag",
    "Dinsdag",
    "Woensdag",
    "Donderdag",
    "Vrijdag",
    "Zaterdag",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-24 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            {dayNames[todayIndex]}
          </p>
          <h1 className="text-2xl font-black tracking-tight">
            Hoi, {session.user.name || "Sporter"} 👋
          </h1>
        </div>
        <Link
          href="/schedule"
          className="text-xs font-semibold px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"
        >
          Weekschema
        </Link>
      </header>

      {/* Statistieken widget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Workouts deze maand
          </p>
          <p className="text-3xl font-extrabold mt-1 text-white">
            {monthlyWorkoutCount}
          </p>
          <span className="text-[11px] text-zinc-500">Sessies afgerond</span>
        </div>

        <Link
          href="/weight/log"
          className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition block"
        >
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Huidig Gewicht
          </p>
          <p className="text-3xl font-extrabold mt-1 text-white">
            {latestWeight ? `${latestWeight.weight} kg` : "--"}
          </p>
          <span className="text-[11px] text-blue-400 font-medium">
            + Nieuwe meting invoeren
          </span>
        </Link>
      </div>

      {/* Plan voor Vandaag */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Workout voor Vandaag
          </p>
          {plan && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
              Klaar om te starten
            </span>
          )}
        </div>

        {plan ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">{plan.name}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {plan.exercises.length} oefeningen ingeroosterd
              </p>
            </div>

            <ul className="divide-y divide-zinc-800 text-sm">
              {plan.exercises.map((ex) => (
                <li key={ex.id} className="py-2.5 flex justify-between items-center">
                  <span className="font-medium text-zinc-200">{ex.name}</span>
                  <span className="text-xs text-zinc-400">
                    {ex.targetSets} sets • {ex.restSeconds}s rust
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={`/workout/active?planId=${plan.id}`}
              className="block w-full py-4 text-center bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition text-base shadow-lg cursor-pointer"
            >
              Start Workout Nu 🔥
            </Link>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <p className="text-zinc-400 text-sm">
              Geen workout ingepland voor vandaag. Tijd voor rust of kies zelf een plan!
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/schedule"
                className="text-xs px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700"
              >
                Plan toewijzen aan vandaag
              </Link>
              <Link
                href="/plans"
                className="text-xs px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700"
              >
                Kies uit alle plannen
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Snelle acties onderaan */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/plans"
          className="p-3 text-center border border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-900"
        >
          Mijn Plannen
        </Link>
        <Link
          href="/schedule"
          className="p-3 text-center border border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-900"
        >
          Weekschema
        </Link>
      </div>
    </main>
  );
}