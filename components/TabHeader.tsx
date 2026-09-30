export default function TabHeader({ title }: { title: string }) {
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
