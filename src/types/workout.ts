export type WorkoutSet = {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
  lastWeight?: string;
  lastReps?: string;
  done: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  targetMuscle: string;
  restSeconds: number;
  sets: WorkoutSet[];
};

export type RoutinePlan = {
  id: string;
  title: string;
  category: "Push" | "Pull" | "Legs" | "Upper" | "Full Body" | "Cardio";
  exercises: Exercise[];
};

export type WeekSchedule = {
  [dayIndex: number]: string; // 0=Zondag, 1=Maandag, etc.
};
