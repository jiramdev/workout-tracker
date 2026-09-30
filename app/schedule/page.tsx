// app/schedule/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedule } from "@/lib/queries";
import { redirect } from "next/navigation";
import ScheduleManager from "./ScheduleManager";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { plans, initialDays } = await getSchedule(session.user.id);

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        {/* Header */}
        <header className="flex items-center px-1 py-1">
          <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              SCHEMA & ROOSTER
            </span>
          </div>
        </header>

        {/* Manager component */}
        <ScheduleManager plans={plans} initialDays={initialDays} />
      </main>
    </div>
  );
}