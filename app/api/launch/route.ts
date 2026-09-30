import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboard, getSchedule } from "@/lib/queries";

const TABS = ["/", "/schedule", "/analytics", "/account"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ hrefs: [] });

    const [dashboard, schedule] = await Promise.all([
      getDashboard(session.user.id),
      getSchedule(session.user.id),
    ]);

    const hrefs = [...TABS];
    for (const plan of schedule.plans) hrefs.push(`/plans/${plan.id}`);
    if (dashboard.todayPlan) hrefs.push(`/workout/active?planId=${dashboard.todayPlan.id}`);

    return Response.json({ hrefs });
  } catch {
    return Response.json({ hrefs: TABS });
  }
}
