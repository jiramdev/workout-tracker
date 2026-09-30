// app/workout/active/ActiveWorkoutLogger.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Plus } from "lucide-react";
import { finishWorkout } from "./actions";

interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  restSeconds?: number;
}

interface ActiveWorkoutLoggerProps {
  planId?: string | null;
  exercises: Exercise[];
  previousLogsMap: Record<string, { weight: number; reps: number }>;
}

interface SetRow {
  setNumber: number;
  weight: string;
  reps: string;
  isCompleted: boolean;
}

const STORAGE_KEY = "active_workout_rest_target";

// Helper om base64 public key om te zetten naar Uint8Array voor push registration
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ActiveWorkoutLogger({
  planId,
  exercises,
  previousLogsMap,
}: ActiveWorkoutLoggerProps) {
  const router = useRouter();
  const [startedAt] = useState<string>(new Date().toISOString());
  const [isFinishing, setIsFinishing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const pushSubscriptionRef = useRef<PushSubscription | null>(null);

  const [setsData, setSetsData] = useState<Record<string, SetRow[]>>(() => {
    const initial: Record<string, SetRow[]> = {};
    exercises.forEach((ex) => {
      const prev = previousLogsMap[ex.name];
      initial[ex.name] = Array.from({ length: ex.targetSets || 3 }, (_, idx) => ({
        setNumber: idx + 1,
        weight: prev?.weight ? String(prev.weight) : "",
        reps: prev?.reps ? String(prev.reps) : "10",
        isCompleted: false,
      }));
    });
    return initial;
  });

  // Service Worker registreren bij laden
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          pushSubscriptionRef.current = sub;
        }
      });
    }
  }, []);

  // Sync timer vanuit localStorage (blijft kloppen na app-switch)
  const checkTimerSync = useCallback(() => {
    if (typeof window === "undefined") return;
    const storedTarget = localStorage.getItem(STORAGE_KEY);
    if (!storedTarget) {
      setSecondsRemaining(null);
      return;
    }

    const targetTime = parseInt(storedTarget, 10);
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((targetTime - now) / 1000));

    if (remaining <= 0) {
      localStorage.removeItem(STORAGE_KEY);
      setSecondsRemaining(null);
    } else {
      setSecondsRemaining(remaining);
    }
  }, []);

  const schedulePushNotification = async (seconds: number, exerciseName: string) => {
    try {
      if (!("serviceWorker" in navigator) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

      // Vraag permissie aan indien nodig
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      if (Notification.permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      let sub = pushSubscriptionRef.current;

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });
        pushSubscriptionRef.current = sub;
      }

      // Stuur background delay request naar Next.js API
      await fetch("/api/rest-timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub,
          delaySeconds: seconds,
          exerciseName,
        }),
      });
    } catch (e) {
      console.error("Push schedule fout:", e);
    }
  };

  const startRestTimer = (seconds: number, exerciseName: string) => {
    const targetTimestamp = Date.now() + seconds * 1000;
    localStorage.setItem(STORAGE_KEY, targetTimestamp.toString());
    setSecondsRemaining(seconds);

    // Stuur direct de push in voor op de achtergrond
    schedulePushNotification(seconds, exerciseName);
  };

  const addTime = (extraSeconds: number) => {
    const storedTarget = localStorage.getItem(STORAGE_KEY);
    const base = storedTarget ? parseInt(storedTarget, 10) : Date.now();
    const newTarget = Math.max(Date.now(), base) + extraSeconds * 1000;
    localStorage.setItem(STORAGE_KEY, newTarget.toString());
    checkTimerSync();
  };

  const cancelTimer = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSecondsRemaining(null);
  };

  useEffect(() => {
    checkTimerSync();
    const interval = setInterval(checkTimerSync, 500);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkTimerSync();
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkTimerSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkTimerSync);
    };
  }, [checkTimerSync]);

  const handleUpdate = (
    exerciseName: string,
    setIndex: number,
    field: "weight" | "reps",
    value: string
  ) => {
    setSetsData((prev) => {
      const rows = [...prev[exerciseName]];
      rows[setIndex] = { ...rows[setIndex], [field]: value };
      return { ...prev, [exerciseName]: rows };
    });
  };

  const handleToggleSet = (
    exerciseName: string,
    setIndex: number,
    restDuration: number = 90
  ) => {
    setSetsData((prev) => {
      const rows = [...prev[exerciseName]];
      const nextState = !rows[setIndex].isCompleted;
      rows[setIndex] = { ...rows[setIndex], isCompleted: nextState };

      if (nextState) {
        startRestTimer(restDuration, exerciseName);
      }
      return { ...prev, [exerciseName]: rows };
    });
  };

  const handleFinish = async () => {
    const completedSets = Object.entries(setsData).flatMap(([exerciseName, rows]) =>
      rows
        .filter((r) => r.isCompleted)
        .map((r) => ({
          exerciseName,
          setNumber: r.setNumber,
          weight: parseFloat(r.weight) || 0,
          reps: parseInt(r.reps, 10) || 0,
        }))
    );

    if (completedSets.length === 0) {
      if (!confirm("Nog geen sets afgevinkt. Toch voltooien?")) return;
    }

    cancelTimer();
    setIsFinishing(true);
    await finishWorkout({ planId, startedAt, sets: completedSets });
    router.push("/");
  };

  return (
    <div className="space-y-3.5">
      {/* Dynamic Floating Rusttimer bovenaan */}
      {secondsRemaining !== null && (
        <div className="fixed top-4 left-0 right-0 z-[999] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto bg-[#141416] border border-[#baa3d0]/40 rounded-full pl-5 pr-3 py-2 flex items-center gap-4 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-[24px] tracking-wider text-[#baa3d0] leading-none">
                {Math.floor(secondsRemaining / 60)}:
                {(secondsRemaining % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#a1a1aa] uppercase">
                Rust
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addTime(30)}
                className="h-8 px-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-[11px] font-semibold flex items-center gap-1 transition apple-press"
              >
                <Plus className="w-3 h-3 text-[#baa3d0]" />
                30s
              </button>

              <button
                type="button"
                onClick={cancelTimer}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#a1a1aa] hover:text-white flex items-center justify-center transition apple-press"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Oefeningenlijst */}
      {exercises.map((ex) => {
        const rows = setsData[ex.name] || [];
        const prev = previousLogsMap[ex.name];
        const restDuration = ex.restSeconds || 90;

        return (
          <section
            key={ex.id}
            className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="font-editorial text-[22px] tracking-wide text-white leading-none">
                {ex.name}
              </h2>
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
                {rows.length} {rows.length === 1 ? "SET" : "SETS"}
              </span>
            </div>

            <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2.5 px-2 text-[10px] uppercase font-semibold text-[#71717a] text-center">
              <span>#</span>
              <span>KG</span>
              <span>REPS</span>
              <span></span>
            </div>

            <div className="space-y-2">
              {rows.map((row, idx) => {
                const isDone = row.isCompleted;

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[28px_1fr_1fr_36px] gap-2.5 items-center rounded-2xl px-2 py-1.5 transition ${
                      isDone
                        ? "bg-[#1d1d22] border border-white/[0.06]"
                        : "bg-[#18181b] border border-transparent"
                    }`}
                  >
                    <span className="text-center font-editorial text-[16px] text-[#71717a]">
                      {row.setNumber}
                    </span>

                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={prev?.weight ? String(prev.weight) : "0"}
                      value={row.weight}
                      disabled={isDone}
                      onChange={(e) =>
                        handleUpdate(ex.name, idx, "weight", e.target.value)
                      }
                      className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none focus:border-[#baa3d0] disabled:opacity-40"
                    />

                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={prev?.reps ? String(prev.reps) : "10"}
                      value={row.reps}
                      disabled={isDone}
                      onChange={(e) =>
                        handleUpdate(ex.name, idx, "reps", e.target.value)
                      }
                      className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none focus:border-[#baa3d0] disabled:opacity-40"
                    />

                    <button
                      type="button"
                      onClick={() => handleToggleSet(ex.name, idx, restDuration)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition apple-press ${
                        isDone
                          ? "bg-[#baa3d0] text-[#141416]"
                          : "border border-white/20 text-transparent hover:border-[#baa3d0] hover:text-[#baa3d0]"
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <button
        onClick={handleFinish}
        disabled={isFinishing}
        className="w-full bg-[#141416] border border-white/[0.08] rounded-[30px] py-4 text-center transition apple-press shadow-[0_12px_28px_rgba(0,0,0,0.2)] disabled:opacity-50"
      >
        <span className="font-editorial text-[20px] tracking-wider text-[#baa3d0] uppercase leading-none block">
          {isFinishing ? "OPSLAAN..." : "SESSIE VOLTOOIEN"}
        </span>
      </button>
    </div>
  );
}