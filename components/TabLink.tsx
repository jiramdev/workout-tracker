"use client";

import Link from "next/link";
import { TAB_HREFS } from "@/lib/motion";

export function selectTab(index: number) {
  if (index < 0 || index >= TAB_HREFS.length) return;
  window.dispatchEvent(new CustomEvent("repiq-tab", { detail: index }));
  const href = TAB_HREFS[index];
  if (window.location.pathname !== href) history.replaceState({ repiqTab: index }, "", href);
}

export default function TabLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={className}
      onClick={(event) => {
        const index = TAB_HREFS.indexOf(href as (typeof TAB_HREFS)[number]);
        if (index === -1 || !document.getElementById("tab-track")) return;
        event.preventDefault();
        selectTab(index);
      }}
    >
      {children}
    </Link>
  );
}
