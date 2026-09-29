import { RoutinePlan, WeekSchedule } from "@/types/workout";

export const EXERCISE_LIBRARY = [
  { name: "90° HSPU (Parallettes)", target: "Schouders / Triceps", defaultRest: 180 },
  { name: "Freestanding HSPU", target: "Schouders / Balans", defaultRest: 150 },
  { name: "Weighted Dips", target: "Borst / Triceps", defaultRest: 120 },
  { name: "Incline DB Press", target: "Bovenkant Borst", defaultRest: 90 },
  { name: "Lateral Raises", target: "Zijkant Schouders", defaultRest: 60 },
  { name: "Front Lever Holds", target: "Lats / Core", defaultRest: 180 },
  { name: "Weighted Pull-ups", target: "Lats / Biceps", defaultRest: 150 },
  { name: "Chest Supported Row", target: "Bovenrug", defaultRest: 90 },
  { name: "Incline DB Curl", target: "Biceps", defaultRest: 60 },
  { name: "Hack Squat", target: "Quads", defaultRest: 150 },
  { name: "Leg Press", target: "Benen", defaultRest: 120 },
  { name: "Romanian Deadlift", target: "Hamstrings / Glutes", defaultRest: 150 },
  { name: "Standing Calf Raises", target: "Kuiten", defaultRest: 60 },
  { name: "Hanging Leg Raises", target: "Buiksperen", defaultRest: 60 }
];

export const DEFAULT_PLANS: RoutinePlan[] = [
  {
    id: "plan-push",
    title: "Push Strength & HSPU",
    category: "Push",
    exercises: [
      {
        id: "ex-1",
        name: "90° HSPU (Parallettes)",
        targetMuscle: "Schouders",
        restSeconds: 150,
        sets: [
          { id: "s-1-1", setNumber: 1, weight: "BW", reps: "2", lastWeight: "BW", lastReps: "2", done: false },
          { id: "s-1-2", setNumber: 2, weight: "BW", reps: "2", lastWeight: "BW", lastReps: "1", done: false },
          { id: "s-1-3", setNumber: 3, weight: "BW", reps: "1", lastWeight: "BW", lastReps: "1", done: false }
        ]
      },
      {
        id: "ex-2",
        name: "Weighted Dips",
        targetMuscle: "Borst / Triceps",
        restSeconds: 120,
        sets: [
          { id: "s-2-1", setNumber: 1, weight: "40", reps: "8", lastWeight: "37.5", lastReps: "8", done: false },
          { id: "s-2-2", setNumber: 2, weight: "40", reps: "7", lastWeight: "37.5", lastReps: "7", done: false },
          { id: "s-2-3", setNumber: 3, weight: "40", reps: "6", lastWeight: "37.5", lastReps: "6", done: false }
        ]
      }
    ]
  },
  {
    id: "plan-pull",
    title: "Pull & Lever Focus",
    category: "Pull",
    exercises: [
      {
        id: "ex-3",
        name: "Front Lever Holds",
        targetMuscle: "Lats",
        restSeconds: 180,
        sets: [
          { id: "s-3-1", setNumber: 1, weight: "BW", reps: "5s", lastWeight: "BW", lastReps: "5s", done: false },
          { id: "s-3-2", setNumber: 2, weight: "BW", reps: "5s", lastWeight: "BW", lastReps: "4s", done: false }
        ]
      },
      {
        id: "ex-4",
        name: "Weighted Pull-ups",
        targetMuscle: "Rug",
        restSeconds: 150,
        sets: [
          { id: "s-4-1", setNumber: 1, weight: "20", reps: "6", lastWeight: "17.5", lastReps: "6", done: false },
          { id: "s-4-2", setNumber: 2, weight: "20", reps: "5", lastWeight: "17.5", lastReps: "5", done: false }
        ]
      }
    ]
  },
  {
    id: "plan-legs",
    title: "Legs Hypertrophy",
    category: "Legs",
    exercises: [
      {
        id: "ex-5",
        name: "Hack Squat",
        targetMuscle: "Quads",
        restSeconds: 150,
        sets: [
          { id: "s-5-1", setNumber: 1, weight: "30", reps: "8", lastWeight: "25", lastReps: "8", done: false },
          { id: "s-5-2", setNumber: 2, weight: "35", reps: "6", lastWeight: "30", lastReps: "6", done: false }
        ]
      }
    ]
  }
];

export const DEFAULT_SCHEDULE: WeekSchedule = {
  1: "plan-push",
  2: "plan-legs",
  3: "plan-pull",
  4: "",
  5: "plan-legs",
  6: "plan-push",
  0: ""
};
