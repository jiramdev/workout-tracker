import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
