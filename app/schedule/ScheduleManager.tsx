// app/schedule/ScheduleManager.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Prefetch from "@/components/Prefetch";
import { popTransition } from "@/lib/motion";
import { Plus, Dumbbell, ChevronRight, ChevronDown, Moon, Check, Calendar } from "lucide-react";
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
  { day: 1, name: "Maandag" },
  { day: 2, name: "Dinsdag" },
  { day: 3, name: "Woensdag" },
  { day: 4, name: "Donderdag" },
  { day: 5, name: "Vrijdag" },
  { day: 6, name: "Zaterdag" },
  { day: 0, name: "Zondag" },
];

export default function ScheduleManager({ plans, initialDays }: ScheduleManagerProps) {
  const [dayAssignments, setDayAssignments] = useState(initialDays);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [dayMenu, setDayMenu] = useState<{
    day: number;
    top: number;
    left: number;
    width: number;
    origin: "top" | "bottom";
  } | null>(null);

  // Koppel plan aan een dag
  const handleSelectPlanForDay = async (day: number, planId: string | null) => {
    setDayAssignments((prev) => {
      const copy = { ...prev };
      if (planId) copy[day] = planId;
      else delete copy[day];
      return copy;
    });
    setDayMenu(null);
    await assignPlanToDay(day, planId);
  };

  const openDayMenu = (day: number, button: HTMLButtonElement) => {
    if (dayMenu?.day === day) {
      setDayMenu(null);
      return;
    }
    const rect = button.getBoundingClientRect();
    const menuHeight = (1 + plans.length) * 48 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 96 && rect.top > menuHeight + 16;
    setDayMenu({
      day,
      top: openUp ? rect.top - menuHeight - 8 : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      origin: openUp ? "bottom" : "top",
    });
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
      <Prefetch hrefs={plans.map((plan) => `/plans/${plan.id}`)} />
      {/* 1. Weekrooster overzicht (Ma t/m Zo) */}
      <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
            Weekrooster
          </span>
          <Calendar className="w-3.5 h-3.5 text-[#baa3d0]" />
        </div>

        <div className="space-y-2 pt-1">
          {DAYS_OF_WEEK.map(({ day, name }) => {
            const assignedPlanId = dayAssignments[day];
            const currentPlan = plans.find((p) => p.id === assignedPlanId);

            return (
              <button
                key={day}
                onClick={(event) => openDayMenu(day, event.currentTarget)}
                className="w-full bg-[#1b1b1e] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-white/[0.04] apple-press"
              >
                <span className="text-[14px] font-medium text-white shrink-0">{name}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`min-w-0 font-editorial text-[18px] tracking-wider leading-none truncate ${
                      currentPlan ? "text-[#baa3d0]" : "text-[#71717a]"
                    }`}
                  >
                    {currentPlan ? currentPlan.name : "Rustdag"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-[#52525b] transition-transform ${
                      dayMenu?.day === day ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Trainingsplannen Beheren & Aanmaken */}
      <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
            Mijn Schema's
          </span>
          <button
            type="button"
            onClick={() => setIsCreatingPlan(!isCreatingPlan)}
            aria-label="Nieuw plan"
            className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nieuw
          </button>
        </div>

        <AnimatePresence>
        {isCreatingPlan && (
          <motion.form
            onSubmit={handleCreatePlan}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={popTransition}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Bijv. Push A"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              autoFocus
              className="flex-1 bg-[#1b1b1e] border border-white/[0.04] rounded-2xl px-4 py-3 text-[14px] text-white placeholder-[#71717a] outline-none focus:border-[#baa3d0]"
            />
            <button
              type="submit"
              className="bg-[#baa3d0] text-[#141416] font-semibold px-4 rounded-2xl text-[12px] uppercase tracking-wider apple-press"
            >
              Opslaan
            </button>
          </motion.form>
        )}
        </AnimatePresence>

        <div className="space-y-2 pt-1">
          {plans.length === 0 ? (
            <div className="bg-[#1b1b1e] rounded-2xl px-4 py-3 flex items-center justify-between border border-white/[0.04]">
              <span className="text-[14px] font-medium text-[#71717a]">Nog geen schema's</span>
            </div>
          ) : (
            plans.map((p) => (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                prefetch={true}
                className="bg-[#1b1b1e] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-white/[0.04] apple-press"
              >
                <span className="text-[14px] font-medium text-white truncate">{p.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-editorial text-[22px] text-[#baa3d0] tracking-wider leading-none">
                    {p.exercisesCount}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#52525b]" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <AnimatePresence>
        {dayMenu && (
          <motion.button
            key="day-menu-backdrop"
            type="button"
            aria-label="Sluiten"
            className="fixed inset-0 z-[60] bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setDayMenu(null)}
          />
        )}
        {dayMenu && (
          <motion.div
            key="day-menu"
            role="menu"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={popTransition}
            style={{
              top: dayMenu.top,
              left: dayMenu.left,
              width: dayMenu.width,
              transformOrigin: dayMenu.origin === "bottom" ? "bottom center" : "top center",
            }}
            className="fixed z-[70] overflow-hidden rounded-[14px] border border-white/10 bg-[#2c2c2e]/92 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelectPlanForDay(dayMenu.day, null)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left text-[16px] text-white active:bg-white/10"
            >
              <Moon className="w-4 h-4 text-[#a1a1aa]" />
              <span className="flex-1">Rustdag</span>
              {!dayAssignments[dayMenu.day] && <Check className="w-4 h-4 text-[#baa3d0]" />}
            </button>
            {plans.length > 0 && <div className="h-px bg-white/10" />}
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="menuitem"
                onClick={() => handleSelectPlanForDay(dayMenu.day, plan.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-[16px] text-white active:bg-white/10"
              >
                <Dumbbell className="w-4 h-4 text-[#a1a1aa]" />
                <span className="flex-1 truncate">{plan.name}</span>
                <span className="text-[12px] text-[#8e8e93]">{plan.exercisesCount}</span>
                {dayAssignments[dayMenu.day] === plan.id && (
                  <Check className="w-4 h-4 text-[#baa3d0]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}