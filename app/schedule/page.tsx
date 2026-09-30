// app/schedule/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedule } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ScheduleManager from "./ScheduleManager";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { plans, initialDays } = await getSchedule(session.user.id);

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        {/* Header */}
        <header className="flex justify-between items-center px-1 py-1">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition apple-press shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </Link>

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