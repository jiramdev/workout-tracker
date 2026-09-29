// app/plans/page.tsx
import { getUserPlans } from "@/app/actions/plans";
import Link from "next/link";

export default async function PlansPage() {
  const plans = await getUserPlans();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20 max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">Mijn Workout Plannen</h1>
        </div>
        <Link
          href="/plans/new"
          className="px-3.5 py-2 bg-white text-zinc-950 text-sm font-semibold rounded-lg hover:bg-zinc-200"
        >
          + Nieuw Plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
          <p className="text-zinc-400 text-sm">
            Je hebt nog geen workout plannen aangemaakt.
          </p>
          <Link
            href="/plans/new"
            className="inline-block px-4 py-2 bg-white text-zinc-950 text-sm font-semibold rounded-lg"
          >
            Maak je eerste plan aan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  <p className="text-xs text-zinc-400">
                    {plan.exercises.length} oefeningen
                  </p>
                </div>
              </div>

              <ul className="divide-y divide-zinc-800 text-sm">
                {plan.exercises.map((ex) => (
                  <li key={ex.id} className="py-2 flex justify-between">
                    <span className="font-medium text-zinc-200">{ex.name}</span>
                    <span className="text-zinc-400 text-xs">
                      {ex.targetSets} sets • {ex.restSeconds}s rust
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}