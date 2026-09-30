// app/workout/active/ActiveWorkoutLogger.tsx
"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { popTransition } from "@/lib/motion";
import { finishWorkout } from "./actions";

interface Exercise {
  id: string;
  exerciseId?: string | null;
  name: string;
  tracking?: "weight" | "reps" | "hold";
  targetSets: number;
  restSeconds?: number;
}

interface PreviousSet {
  weight: number;
  reps: number;
  durationSeconds?: number | null;
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
  duration: string;
  isCompleted: boolean;
}

const STORAGE_TARGET_KEY = "active_workout_rest_target";
const STORAGE_EXERCISE_KEY = "active_workout_rest_exercise";
const STORAGE_REST_TOKEN_KEY = "active_workout_rest_token";
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
  onCancel,
  onExpire,
}: {
  target: number | null;
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
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={popTransition}
      className="fixed top-3 left-0 right-0 z-[70] px-4 pointer-events-none"
    >
      <div className="pointer-events-auto relative mx-auto max-w-sm bg-[#141416] border border-[#baa3d0]/50 rounded-[34px] px-6 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Timer stoppen"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/[0.06] text-[#a1a1aa] flex items-center justify-center apple-press"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
        <p className="text-[12px] font-semibold tracking-[0.22em] text-[#baa3d0] uppercase">Rust</p>
        <p className="mt-2 font-editorial text-[92px] leading-none tracking-tight text-white">
          {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
        </p>
      </div>
    </motion.div>
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
    field: "weight" | "reps" | "duration",
    value: string
  ) => void;
  onToggle: (exerciseName: string, setIndex: number, restDuration: number) => void;
}) {
  const restDuration = exercise.restSeconds || 90;
  const tracking = exercise.tracking ?? "weight";
  const columns =
    tracking === "weight" ? "grid-cols-[28px_1fr_1fr_36px]" : "grid-cols-[28px_1fr_36px]";

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

      <div className={`grid ${columns} gap-2.5 px-2 text-[10px] uppercase font-semibold text-[#71717a] text-center`}>
        <span>#</span>
        {tracking === "weight" && <span>KG</span>}
        <span>{tracking === "hold" ? "SEC" : "REPS"}</span>
        <span></span>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => {
          const isDone = row.isCompleted;
          const previous = previousSets?.[idx];

          return (
            <div
              key={row.setNumber}
              className={`grid ${columns} gap-2.5 items-center rounded-2xl px-2 py-1.5 transition ${
                isDone
                  ? "bg-[#1d1d22] border border-white/[0.06]"
                  : "bg-[#18181b] border border-transparent"
              }`}
            >
              <span className="text-center font-editorial text-[16px] text-[#71717a]">
                {row.setNumber}
              </span>

              {tracking === "weight" && (
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={previous ? String(previous.weight) : "—"}
                  value={row.weight}
                  disabled={isDone}
                  onChange={(e) => onUpdate(exercise.name, idx, "weight", e.target.value)}
                  className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none placeholder:text-[#71717a] focus:border-[#baa3d0] disabled:opacity-40"
                />
              )}

              <input
                type="number"
                inputMode="numeric"
                placeholder={
                  tracking === "hold"
                    ? previous?.durationSeconds
                      ? String(previous.durationSeconds)
                      : "—"
                    : previous
                      ? String(previous.reps)
                      : "—"
                }
                value={tracking === "hold" ? row.duration : row.reps}
                disabled={isDone}
                onChange={(e) =>
                  onUpdate(exercise.name, idx, tracking === "hold" ? "duration" : "reps", e.target.value)
                }
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

function emptySets(exercises: Exercise[]): Record<string, SetRow[]> {
  const initial: Record<string, SetRow[]> = {};
  for (const ex of exercises) {
    initial[ex.name] = Array.from({ length: ex.targetSets || 3 }, (_, idx) => ({
      setNumber: idx + 1,
      weight: "",
      reps: "",
      duration: "",
      isCompleted: false,
    }));
  }
  return initial;
}

function readSets(planId: string | null | undefined, exercises: Exercise[]) {
  if (typeof window === "undefined") return emptySets(exercises);
  const saved = localStorage.getItem(setsStorageKey(planId));
  if (!saved) return emptySets(exercises);
  try {
    const parsed = JSON.parse(saved) as Record<string, SetRow[]>;
    for (const rows of Object.values(parsed)) {
      for (const row of rows) row.duration = row.duration ?? "";
    }
    return parsed;
  } catch (e) {
    console.error("Fout bij uitlezen sets cache:", e);
    return emptySets(exercises);
  }
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

  const [startedAt, setStartedAt] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [restTarget, setRestTarget] = useState<number | null>(null);
  const setsRef = useRef<Record<string, SetRow[]>>({});
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;
  const skipSave = useRef(true);
  const pushGen = useRef(0);

  const [setsData, setSetsData] = useState<Record<string, SetRow[]>>(() => emptySets(exercises));

  setsRef.current = setsData;

  useLayoutEffect(() => {
    const savedStart = localStorage.getItem(STORAGE_START_KEY);
    if (savedStart) {
      setStartedAt(savedStart);
    } else {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_START_KEY, now);
      setStartedAt(now);
    }

    skipSave.current = true;
    setSetsData(readSets(planId, exercisesRef.current));
  }, [planId]);

  useEffect(() => {
    setRestTarget(readRestTarget());
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registreren mislukt:", err);
    });
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    localStorage.setItem(setsStorageKey(planId), JSON.stringify(setsData));
  }, [planId, setsData]);

  const cancelRestNotification = useCallback((token: string) => {
    fetch("/api/rest-timer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch((err) => console.error("Rustmelding annuleren mislukt:", err));
  }, []);

  const dismissRestNotification = useCallback(() => {
    pushGen.current += 1;
    const token = localStorage.getItem(STORAGE_REST_TOKEN_KEY);
    localStorage.removeItem(STORAGE_REST_TOKEN_KEY);
    if (token) cancelRestNotification(token);
  }, [cancelRestNotification]);

  const scheduleServerPush = useCallback(
    (seconds: number, exerciseName: string) => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;

      const gen = ++pushGen.current;
      const token = crypto.randomUUID();

      navigator.serviceWorker.ready
        .then(async (reg) => {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
          }
          if (!sub || pushGen.current !== gen) return;

          const response = await fetch("/api/rest-timer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: sub,
              delaySeconds: seconds,
              exerciseName,
              planId,
              token,
            }),
          });
          if (!response.ok || pushGen.current !== gen) {
            cancelRestNotification(token);
            return;
          }
          localStorage.setItem(STORAGE_REST_TOKEN_KEY, token);
        })
        .catch((err) => console.error("Achtergrond push plannen mislukt:", err));
    },
    [cancelRestNotification, planId]
  );

  const clearTimer = useCallback(() => {
    localStorage.removeItem(STORAGE_TARGET_KEY);
    localStorage.removeItem(STORAGE_EXERCISE_KEY);
    setRestTarget(null);
  }, []);

  const stopTimer = useCallback(() => {
    dismissRestNotification();
    clearTimer();
  }, [clearTimer, dismissRestNotification]);

  const startRestTimer = useCallback(
    (seconds: number, exerciseName: string) => {
      const targetTimestamp = Date.now() + seconds * 1000;
      localStorage.setItem(STORAGE_TARGET_KEY, targetTimestamp.toString());
      localStorage.setItem(STORAGE_EXERCISE_KEY, exerciseName);
      setRestTarget(targetTimestamp);
      dismissRestNotification();
      scheduleServerPush(seconds, exerciseName);
    },
    [dismissRestNotification, scheduleServerPush]
  );

  const handleUpdate = useCallback(
    (exerciseName: string, setIndex: number, field: "weight" | "reps" | "duration", value: string) => {
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
        .map((r) => {
          const exercise = exercises.find((item) => item.name === exerciseName);
          const previous = previousSets[exerciseName]?.[r.setNumber - 1];
          const mode = exercise?.tracking ?? "weight";
          return {
            exerciseId: exercise?.exerciseId,
            exerciseName,
            setNumber: r.setNumber,
            weight: mode === "weight" ? loggedNumber(r.weight, previous?.weight) : 0,
            reps: mode === "hold" ? 0 : loggedNumber(r.reps, previous?.reps, true),
            durationSeconds:
              mode === "hold"
                ? loggedNumber(r.duration, previous?.durationSeconds ?? undefined, true)
                : null,
          };
        })
    );

    if (completedSets.length === 0) {
      if (!confirm("Nog geen sets afgevinkt. Toch voltooien?")) return;
    }

    setIsFinishing(true);
    setSaveError(null);
    try {
      const result = await finishWorkout({ planId, startedAt, sets: completedSets });
      if (!result?.success) {
        setSaveError(result?.error ?? "Opslaan mislukt. Je sets staan nog op dit apparaat.");
        setIsFinishing(false);
        return;
      }
    } catch {
      setSaveError("Opslaan mislukt. Je sets staan nog op dit apparaat.");
      setIsFinishing(false);
      return;
    }

    stopTimer();
    localStorage.removeItem(setsStorageKey(planId));
    localStorage.removeItem("active_workout_sets_data");
    localStorage.removeItem(STORAGE_START_KEY);
    router.push("/");
  };

  function handleCancel() {
    if (!confirm("Workout annuleren? Er wordt niets opgeslagen.")) return;
    stopTimer();
    localStorage.removeItem(setsStorageKey(planId));
    localStorage.removeItem("active_workout_sets_data");
    localStorage.removeItem(STORAGE_START_KEY);
    router.push("/");
  }

  return (
    <div className="space-y-3.5">
      <header className="flex items-center justify-between px-1 py-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isFinishing}
          aria-label="Workout annuleren"
          className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-white apple-press shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50"
        >
          <X className="w-5 h-5 stroke-[1.8]" />
        </button>
        <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
          <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
            Workout
          </span>
        </div>
      </header>

      <RestTimer target={restTarget} onCancel={stopTimer} onExpire={clearTimer} />

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

      {saveError && (
        <p role="alert" className="px-1 text-[13px] text-red-300">
          {saveError}
        </p>
      )}

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
