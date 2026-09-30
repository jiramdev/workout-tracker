// components/BottomBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Calendar, BarChart3, User } from "lucide-react";

export default function BottomBar() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const tabs = [
    { href: "/", icon: LayoutGrid, label: "Workouts" },
    { href: "/schedule", icon: Calendar, label: "Schema" },
    { href: "/analytics", icon: BarChart3, label: "Stats" },
    { href: "/weight/log", icon: User, label: "Gewicht" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-[#141416]/90 backdrop-blur-2xl border border-white/[0.1] px-6 py-3 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex items-center gap-8 transition-all">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`p-2 rounded-full transition apple-press flex items-center justify-center relative ${
                isActive ? "text-white" : "text-[#71717a] hover:text-[#a1a1aa]"
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 bg-[#baa3d0] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}