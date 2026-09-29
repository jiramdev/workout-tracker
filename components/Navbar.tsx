// components/Navbar.tsx
import Link from "next/link";
import { Dumbbell, Calendar, PlusCircle, Scale } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-[#e5e5ea]">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Dumbbell className="w-5 h-5 text-[#0066cc] group-hover:scale-105 transition" />
          <span className="font-semibold text-[17px] tracking-[-0.374px] text-[#1d1d1f]">
            GymTracker
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/schedule"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e5e5ea]/60 transition apple-btn-active"
          >
            <Calendar className="w-4 h-4 text-[#7a7a7a]" />
            <span className="hidden sm:inline">Week</span>
          </Link>
          <Link
            href="/plans"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e5e5ea]/60 transition apple-btn-active"
          >
            <PlusCircle className="w-4 h-4 text-[#7a7a7a]" />
            <span className="hidden sm:inline">Plannen</span>
          </Link>
          <Link
            href="/weight/log"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e5e5ea]/60 transition apple-btn-active"
          >
            <Scale className="w-4 h-4 text-[#7a7a7a]" />
            <span className="hidden sm:inline">Gewicht</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}