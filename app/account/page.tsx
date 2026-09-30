import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, latestWeight] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        age: true,
        heightCm: true,
        sex: true,
      },
    }),
    prisma.bodyWeightLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { loggedAt: "desc" },
      select: { weight: true },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        <header className="flex items-center px-1 py-1">
          <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              Account
            </span>
          </div>
        </header>

        <AccountForm
          initial={{
            name: user.name ?? "",
            email: user.email,
            age: user.age != null ? String(user.age) : "",
            heightCm: user.heightCm != null ? String(user.heightCm) : "",
            sex: user.sex ?? "",
            weight: latestWeight ? String(latestWeight.weight) : "",
          }}
        />
      </main>
    </div>
  );
}
