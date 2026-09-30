"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function AppTabs({
  initialTab,
  panels,
}: {
  initialTab: number;
  panels: ReactNode[];
}) {
  const [tab, setTab] = useState(initialTab);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onTab = (event: Event) => {
      const index = (event as CustomEvent<number>).detail;
      if (typeof index === "number") setTab(index);
    };
    window.addEventListener("repiq-tab", onTab);
    return () => window.removeEventListener("repiq-tab", onTab);
  }, []);

  const share = 100 / panels.length;

  return (
    <div className="overflow-x-hidden">
      <div
        id="tab-track"
        className="flex items-start"
        style={{
          width: `${panels.length * 100}%`,
          transform: `translate3d(-${tab * share}%, 0, 0)`,
          transition: reduce ? "none" : "transform 450ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {panels.map((panel, index) => (
          <div key={index} className="shrink-0" style={{ width: `${share}%` }}>
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
}
