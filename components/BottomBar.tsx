// components/BottomBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Calendar, Activity, User } from "lucide-react";

export default function BottomBar() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: LayoutGrid, label: "Workouts" },
    { href: "/schedule", icon: Calendar, label: "Schema" },
    { href: "/plans", icon: Activity, label: "Plannen" },
    { href: "/weight/log", icon: User, label: "Profiel" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-8 pt-3 bg-black/80 backdrop-blur-2xl border-t border-white/[0.08]">
      <div className="max-w-md mx-auto px-8 flex justify-between items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`p-2.5 rounded-full transition apple-press ${
                isActive ? "text-white" : "text-[#8e8e93] hover:text-[#aeaeb2]"
              }`}
            >
              <Icon className="w-6 h-6 stroke-[1.75]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}