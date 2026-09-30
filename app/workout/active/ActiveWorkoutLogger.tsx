// app/workout/active/ActiveWorkoutLogger.tsx
"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Plus } from "lucide-react";
import { finishWorkout } from "./actions";

interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  restSeconds?: number;
}

interface PreviousSet {
  weight: number;
  reps: number;
}

interface ActiveWorkoutLoggerProps {
  planId?: string | null;
  exercises: Exercise[];
  previousSets: Record<string, PreviousSet[]>;
}

interface SetRow {
  setNumber: number;
  weight: string;
  reps: string;
  isCompleted: boolean;
}

const STORAGE_TARGET_KEY = "active_workout_rest_target";
const STORAGE_EXERCISE_KEY = "active_workout_rest_exercise";
const STORAGE_SETS_KEY = "active_workout_sets_data_v2";
const STORAGE_START_KEY = "active_workout_started_at";
const EMPTY_ROWS: SetRow[] = [];

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

function readRestTarget() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_TARGET_KEY);
  if (!stored) return null;
  const target = parseInt(stored, 10);
  if (!target || target <= Date.now()) {
    localStorage.removeItem(STORAGE_TARGET_KEY);
    localStorage.removeItem(STORAGE_EXERCISE_KEY);
    return null;
  }
  return target;
}

function RestTimer({
  target,
  onAdd,
  onCancel,
  onExpire,
}: {
  target: number | null;
  onAdd: () => void;
  onCancel: () => void;
  onExpire: () => void;
}) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (target == null) {
      setSecondsRemaining(null);
      return;
    }

    let stopped = false;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      if (remaining <= 0) {
        if (!stopped) {
          stopped = true;
          setSecondsRemaining(null);
          onExpireRef.current();
        }
        return;
      }
      setSecondsRemaining((current) => (current === remaining ? current : remaining));
    };

    tick();
    const interval = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [target]);

  if (secondsRemaining == null) return null;

  return (
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
            onClick={onAdd}
            className="h-8 px-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-[11px] font-semibold flex items-center gap-1 transition apple-press"
          >
            <Plus className="w-3 h-3 text-[#baa3d0]" />
            30s
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#a1a1aa] hover:text-white flex items-center justify-center transition apple-press"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

const ExerciseSection = memo(function ExerciseSection({
  exercise,
  rows,
  previousSets,
  onUpdate,
  onToggle,
}: {
  exercise: Exercise;
  rows: SetRow[];
  previousSets?: PreviousSet[];
  onUpdate: (
    exerciseName: string,
    setIndex: number,
    field: "weight" | "reps",
    value: string
  ) => void;
  onToggle: (exerciseName: string, setIndex: number, restDuration: number) => void;
}) {
  const restDuration = exercise.restSeconds || 90;

  return (
    <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-editorial text-[22px] tracking-wide text-white leading-none">
          {exercise.name}
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
          const previous = previousSets?.[idx];

          return (
            <div
              key={row.setNumber}
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
                placeholder={previous ? String(previous.weight) : "—"}
                value={row.weight}
                disabled={isDone}
                onChange={(e) => onUpdate(exercise.name, idx, "weight", e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none placeholder:text-[#71717a] focus:border-[#baa3d0] disabled:opacity-40"
              />

              <input
                type="number"
                inputMode="numeric"
                placeholder={previous ? String(previous.reps) : "—"}
                value={row.reps}
                disabled={isDone}
                onChange={(e) => onUpdate(exercise.name, idx, "reps", e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none placeholder:text-[#71717a] focus:border-[#baa3d0] disabled:opacity-40"
              />

              <button
                type="button"
                onClick={() => onToggle(exercise.name, idx, restDuration)}
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
});

function setsStorageKey(planId?: string | null) {
  return `${STORAGE_SETS_KEY}:${planId ?? "none"}`;
}

function loggedNumber(typed: string, previous: number | undefined, asInteger = false) {
  if (typed.trim() === "") return previous ?? 0;
  const parsed = asInteger ? parseInt(typed, 10) : Number(typed);
  return Number.isFinite(parsed) ? parsed : previous ?? 0;
}

export default function ActiveWorkoutLogger({
  planId,
  exercises,
  previousSets = {},
}: ActiveWorkoutLoggerProps) {
  const router = useRouter();

  const [startedAt] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedStart = localStorage.getItem(STORAGE_START_KEY);
      if (savedStart) return savedStart;
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_START_KEY, now);
      return now;
    }
    return new Date().toISOString();
  });

  const [isFinishing, setIsFinishing] = useState(false);
  const [restTarget, setRestTarget] = useState<number | null>(null);
  const setsRef = useRef<Record<string, SetRow[]>>({});

  const [setsData, setSetsData] = useState<Record<string, SetRow[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(setsStorageKey(planId));
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Fout bij uitlezen sets cache:", e);
        }
      }
    }

    const initial: Record<string, SetRow[]> = {};
    exercises.forEach((ex) => {
      initial[ex.name] = Array.from({ length: ex.targetSets || 3 }, (_, idx) => ({
        setNumber: idx + 1,
        weight: "",
        reps: "",
        isCompleted: false,
      }));
    });
    return initial;
  });

  setsRef.current = setsData;

  useEffect(() => {
    setRestTarget(readRestTarget());
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registreren mislukt:", err);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(setsStorageKey(planId), JSON.stringify(setsData));
  }, [planId, setsData]);

  const scheduleServerPush = useCallback(
    (seconds: number, exerciseName: string) => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;

      navigator.serviceWorker.ready
        .then(async (reg) => {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
          }

          if (sub) {
            fetch("/api/rest-timer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription: sub,
                delaySeconds: seconds,
                exerciseName,
                planId,
              }),
            }).catch((err) => console.error("Achtergrond push plannen mislukt:", err));
          }
        })
        .catch((err) => console.error("Achtergrond push plannen mislukt:", err));
    },
    [planId]
  );

  const clearTimer = useCallback(() => {
    localStorage.removeItem(STORAGE_TARGET_KEY);
    localStorage.removeItem(STORAGE_EXERCISE_KEY);
    setRestTarget(null);
  }, []);

  const startRestTimer = useCallback(
    (seconds: number, exerciseName: string) => {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      }

      const targetTimestamp = Date.now() + seconds * 1000;
      localStorage.setItem(STORAGE_TARGET_KEY, targetTimestamp.toString());
      localStorage.setItem(STORAGE_EXERCISE_KEY, exerciseName);
      setRestTarget(targetTimestamp);
      scheduleServerPush(seconds, exerciseName);
    },
    [scheduleServerPush]
  );

  const addTime = useCallback(() => {
    const storedTarget = localStorage.getItem(STORAGE_TARGET_KEY);
    const exerciseName = localStorage.getItem(STORAGE_EXERCISE_KEY) || "";
    const base = storedTarget ? parseInt(storedTarget, 10) : Date.now();
    const newTarget = Math.max(Date.now(), base) + 30 * 1000;

    localStorage.setItem(STORAGE_TARGET_KEY, newTarget.toString());
    setRestTarget(newTarget);

    const remainingSecs = Math.max(1, Math.ceil((newTarget - Date.now()) / 1000));
    scheduleServerPush(remainingSecs, exerciseName);
  }, [scheduleServerPush]);

  const handleUpdate = useCallback(
    (exerciseName: string, setIndex: number, field: "weight" | "reps", value: string) => {
      setSetsData((prev) => {
        const rows = prev[exerciseName];
        if (!rows) return prev;
        const nextRows = [...rows];
        nextRows[setIndex] = { ...nextRows[setIndex], [field]: value };
        return { ...prev, [exerciseName]: nextRows };
      });
    },
    []
  );

  const handleToggleSet = useCallback(
    (exerciseName: string, setIndex: number, restDuration: number = 90) => {
      const current = setsRef.current[exerciseName]?.[setIndex];
      if (!current) return;
      const nextState = !current.isCompleted;

      setSetsData((prev) => {
        const rows = prev[exerciseName];
        if (!rows) return prev;
        const nextRows = [...rows];
        nextRows[setIndex] = { ...nextRows[setIndex], isCompleted: nextState };
        return { ...prev, [exerciseName]: nextRows };
      });

      if (nextState) startRestTimer(restDuration, exerciseName);
    },
    [startRestTimer]
  );

  const handleFinish = async () => {
    const completedSets = Object.entries(setsData).flatMap(([exerciseName, rows]) =>
      rows
        .filter((r) => r.isCompleted)
        .map((r) => ({
          exerciseName,
          setNumber: r.setNumber,
          weight: loggedNumber(r.weight, previousSets[exerciseName]?.[r.setNumber - 1]?.weight),
          reps: loggedNumber(r.reps, previousSets[exerciseName]?.[r.setNumber - 1]?.reps, true),
        }))
    );

    if (completedSets.length === 0) {
      if (!confirm("Nog geen sets afgevinkt. Toch voltooien?")) return;
    }

    clearTimer();
    localStorage.removeItem(setsStorageKey(planId));
    localStorage.removeItem("active_workout_sets_data");
    localStorage.removeItem(STORAGE_START_KEY);

    setIsFinishing(true);
    await finishWorkout({ planId, startedAt, sets: completedSets });
    router.push("/");
  };

  return (
    <div className="space-y-3.5">
      <RestTimer
        target={restTarget}
        onAdd={addTime}
        onCancel={clearTimer}
        onExpire={clearTimer}
      />

      {exercises.map((ex) => (
        <ExerciseSection
          key={ex.id}
          exercise={ex}
          rows={setsData[ex.name] ?? EMPTY_ROWS}
          previousSets={previousSets[ex.name]}
          onUpdate={handleUpdate}
          onToggle={handleToggleSet}
        />
      ))}

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
