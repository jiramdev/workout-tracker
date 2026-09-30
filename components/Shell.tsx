import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAnalytics, getDashboard, getSchedule } from "@/lib/queries";
import AppTabs from "@/components/AppTabs";
import HomePanel from "@/components/HomePanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import ScheduleManager from "@/app/schedule/ScheduleManager";
import AccountForm from "@/app/account/AccountForm";

function TabHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center px-1 py-1">
      <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
        <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
          {title}
        </span>
      </div>
    </header>
  );
}

export default async function Shell({ tab }: { tab: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const [dashboard, schedule, analytics, accountUser, latestWeight, unreadCount] = await Promise.all([
    getDashboard(userId),
    getSchedule(userId),
    getAnalytics(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, age: true, heightCm: true, sex: true },
    }),
    prisma.bodyWeightLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: "desc" },
      select: { weight: true },
    }),
    prisma.appNotification.count({
      where: { userId, read: false, title: { not: "Rust voorbij" } },
    }),
  ]);

  if (!accountUser) redirect("/login");

  const displayName = dashboard.profileName || dashboard.profileEmail?.split("@")[0] || "ATHLETE";

  return (
    <AppTabs
      initialTab={tab}
      panels={[
        <HomePanel
          key="home"
          displayName={displayName}
          image={session.user.image}
          dayOfWeek={dashboard.dayOfWeek}
          todayPlan={dashboard.todayPlan}
          sessionCount={dashboard.sessionCount}
          latestWeight={dashboard.latestWeight}
          unreadCount={unreadCount}
        />,
        <div key="schedule" className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
          <main className="max-w-sm mx-auto space-y-3.5">
            <TabHeader title="SCHEMA & ROOSTER" />
            <ScheduleManager plans={schedule.plans} initialDays={schedule.initialDays} />
          </main>
        </div>,
        <AnalyticsPanel key="analytics" workouts={analytics.workouts} weightLogs={analytics.weightLogs} />,
        <div key="account" className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
          <main className="max-w-sm mx-auto space-y-3.5">
            <TabHeader title="Account" />
            <AccountForm
              initial={{
                name: accountUser.name ?? "",
                email: accountUser.email,
                age: accountUser.age != null ? String(accountUser.age) : "",
                heightCm: accountUser.heightCm != null ? String(accountUser.heightCm) : "",
                sex: accountUser.sex ?? "",
                weight: latestWeight ? String(latestWeight.weight) : "",
              }}
            />
          </main>
        </div>,
      ]}
    />
  );
}
