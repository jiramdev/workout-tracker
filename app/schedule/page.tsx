// app/schedule/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserSchedule, updateDayPlan } from "@/app/actions/schedule";
import { getUserPlans } from "@/app/actions/plans";
import Link from "next/link";

const DAYS_OF_WEEK = [
  { index: 1, name: "Maandag" },
  { index: 2, name: "Dinsdag" },
  { index: 3, name: "Woensdag" },
  { index: 4, name: "Donderdag" },
  { index: 5, name: "Vrijdag" },
  { index: 6, name: "Zaterdag" },
  { index: 0, name: "Zondag" },
];

export default function SchedulePage() {
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [dayAssignments, setDayAssignments] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const [fetchedPlans, fetchedSchedule] = await Promise.all([
        getUserPlans(),
        getUserSchedule(),
      ]);

      setPlans(fetchedPlans);

      const mapping: Record<number, string | null> = {};
      fetchedSchedule?.days.forEach((d) => {
        mapping[d.dayOfWeek] = d.planId;
      });
      setDayAssignments(mapping);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handlePlanChange(dayOfWeek: number, value: string) {
    const selectedPlanId = value === "rest" ? null : value;
    setSavingDay(dayOfWeek);

    setDayAssignments((prev) => ({
      ...prev,
      [dayOfWeek]: selectedPlanId,
    }));

    await updateDayPlan(dayOfWeek, selectedPlanId);
    setSavingDay(null);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20 max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">Weekschema</h1>
        </div>
        <Link
          href="/plans"
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-800 rounded-lg"
        >
          Mijn plannen
        </Link>
      </div>

      <p className="text-sm text-zinc-400">
        Koppel per dag een workout plan. Op die dag staat dit plan direct klaar op je dashboard.
      </p>

      {loading ? (
        <div className="p-8 text-center text-zinc-500 text-sm">Schema laden...</div>
      ) : (
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const currentPlanId = dayAssignments[day.index] || "rest";
            return (
              <div
                key={day.index}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-semibold text-sm block">{day.name}</span>
                  <span className="text-xs text-zinc-500">
                    {savingDay === day.index
                      ? "Opslaan..."
                      : currentPlanId === "rest"
                      ? "Rustdag"
                      : plans.find((p) => p.id === currentPlanId)?.name || "Plan"}
                  </span>
                </div>

                <select
                  value={currentPlanId}
                  onChange={(e) => handlePlanChange(day.index, e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  <option value="rest">Rustdag / Geen plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}