import React from "react";
import { Bell, Flame } from "lucide-react";

interface HeaderProps {
  athleteName: string;
  totalVolumeKg: number;
}

export const Header: React.FC<HeaderProps> = ({ athleteName, totalVolumeKg }) => {
  return (
    <header className="flex items-center justify-between pb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#1e201d] border border-[#2a2c28] flex items-center justify-center font-bold text-sm text-[#9fe870]">
          {athleteName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <span className="text-xs text-[#868685] font-medium block">Welcome back</span>
          <h1 className="text-xl font-black text-white tracking-tight">{athleteName}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-[#1e201d] border border-[#2a2c28] rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-[#9fe870] font-bold">
          <Flame size={14} className="text-[#9fe870]" />
          <span>{totalVolumeKg} kg</span>
        </div>
        <button 
          aria-label="Notificaties"
          className="w-10 h-10 rounded-full bg-[#1e201d] border border-[#2a2c28] flex items-center justify-center text-[#868685] hover:text-white transition"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
};
