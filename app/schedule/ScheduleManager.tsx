// app/schedule/ScheduleManager.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Dumbbell, ChevronRight, Moon, Sparkles } from "lucide-react";
import { assignPlanToDay, createWorkoutPlan } from "./actions";

interface Plan {
  id: string;
  name: string;
  exercisesCount: number;
}

interface ScheduleManagerProps {
  plans: Plan[];
  initialDays: Record<number, string>; // dayOfWeek -> planId
}

const DAYS_OF_WEEK = [
  { day: 1, name: "MAANDAG", short: "MA" },
  { day: 2, name: "DINSDAG", short: "DI" },
  { day: 3, name: "WOENSDAG", short: "WO" },
  { day: 4, name: "DONDERDAG", short: "DO" },
  { day: 5, name: "VRIJDAG", short: "VR" },
  { day: 6, name: "ZATERDAG", short: "ZA" },
  { day: 0, name: "ZONDAG", short: "ZO" },
];

export default function ScheduleManager({ plans, initialDays }: ScheduleManagerProps) {
  const [dayAssignments, setDayAssignments] = useState(initialDays);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [activeDayPicker, setActiveDayPicker] = useState<number | null>(null);

  // Koppel plan aan een dag
  const handleSelectPlanForDay = async (day: number, planId: string | null) => {
    setDayAssignments((prev) => {
      const copy = { ...prev };
      if (planId) copy[day] = planId;
      else delete copy[day];
      return copy;
    });
    setActiveDayPicker(null);
    await assignPlanToDay(day, planId);
  };

  // Nieuw plan aanmaken
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    await createWorkoutPlan(newPlanName);
    setNewPlanName("");
    setIsCreatingPlan(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. Weekrooster overzicht (Ma t/m Zo) */}
      <section className="bg-[#141416] border border-white/[0.08] rounded-[34px] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.25)] space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
            Weekrooster
          </span>
          <span className="text-[11px] text-[#71717a] font-medium">Tik om te koppelen</span>
        </div>

        <div className="space-y-2 pt-1">
          {DAYS_OF_WEEK.map(({ day, name, short }) => {
            const assignedPlanId = dayAssignments[day];
            const currentPlan = plans.find((p) => p.id === assignedPlanId);

            return (
              <div key={day} className="relative">
                <button
                  onClick={() => setActiveDayPicker(activeDayPicker === day ? null : day)}
                  className="w-full bg-[#1b1b1e] hover:bg-[#202024] border border-white/[0.04] rounded-2xl px-4 py-3 flex items-center justify-between transition apple-press"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#242429] text-[11px] font-bold text-[#baa3d0] flex items-center justify-center">
                      {short}
                    </span>
                    <span className="font-editorial text-[16px] tracking-wide text-white leading-none">
                      {name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[13px] font-medium ${
                        currentPlan ? "text-[#baa3d0]" : "text-[#71717a]"
                      }`}
                    >
                      {currentPlan ? currentPlan.name : "Rustdag"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#52525b]" />
                  </div>
                </button>

                {/* Dropdown / Modal om plan te kiezen voor deze dag */}
                {activeDayPicker === day && (
                  <div className="mt-2 bg-[#202026] border border-white/[0.08] rounded-2xl p-2 space-y-1 shadow-[0_12px_28px_rgba(0,0,0,0.4)] z-20">
                    <button
                      onClick={() => handleSelectPlanForDay(day, null)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-[13px] flex items-center gap-2 transition ${
                        !assignedPlanId
                          ? "bg-[#baa3d0] text-[#141416] font-bold"
                          : "text-[#a1a1aa] hover:bg-white/[0.05]"
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Rustdag (Geen workout)</span>
                    </button>

                    {plans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPlanForDay(day, p.id)}
                        className={`w-full px-3 py-2.5 rounded-xl text-left text-[13px] flex items-center justify-between transition ${
                          assignedPlanId === p.id
                            ? "bg-[#baa3d0] text-[#141416] font-bold"
                            : "text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          <span>{p.name}</span>
                        </div>
                        <span className="text-[11px] opacity-70">
                          {p.exercisesCount} oefeningen
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Trainingsplannen Beheren & Aanmaken */}
      <section className="bg-[#141416] border border-white/[0.08] rounded-[34px] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.25)] space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
            Mijn Schema's ({plans.length})
          </span>
          <button
            onClick={() => setIsCreatingPlan(!isCreatingPlan)}
            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#baa3d0] uppercase hover:text-white transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nieuw Plan
          </button>
        </div>

        {/* Inline formulier om nieuw plan aan te maken */}
        {isCreatingPlan && (
          <form onSubmit={handleCreatePlan} className="pt-1 pb-2 flex gap-2">
            <input
              type="text"
              placeholder="Bijv. Push A of Upper Body"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              autoFocus
              className="flex-1 bg-[#1b1b1e] border border-white/[0.1] rounded-2xl px-4 py-2.5 text-[13px] text-white placeholder-[#71717a] outline-none focus:border-[#baa3d0]"
            />
            <button
              type="submit"
              className="bg-[#baa3d0] text-[#141416] font-semibold px-4 rounded-2xl text-[12px] uppercase tracking-wider hover:opacity-90 transition apple-press"
            >
              Opslaan
            </button>
          </form>
        )}

        {/* Lijst met gemaakte plannen */}
        <div className="space-y-2 pt-1">
          {plans.length === 0 ? (
            <div className="py-6 text-center text-[#71717a] text-[13px]">
              Je hebt nog geen trainingsplannen gemaakt. Maak er hierboven een aan.
            </div>
          ) : (
            plans.map((p) => (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                className="bg-[#1b1b1e] hover:bg-[#202024] border border-white/[0.04] rounded-2xl px-4 py-3 flex items-center justify-between transition apple-press group"
              >
                <div>
                  <h3 className="font-editorial text-[18px] text-white tracking-wide group-hover:text-[#baa3d0] transition">
                    {p.name}
                  </h3>
                  <p className="text-[12px] text-[#71717a] mt-0.5">
                    {p.exercisesCount} oefeningen ingedeeld
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#baa3d0] font-medium">
                  <span>Bewerk</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}