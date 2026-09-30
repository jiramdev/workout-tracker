// components/BottomBar.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { LayoutGrid, Calendar, BarChart3, User } from "lucide-react";
import { motion } from "motion/react";
import { TAB_HREFS } from "@/lib/motion";

function slidePages(page: HTMLElement, direction: 1 | -1, navigate: () => void) {
  document.querySelectorAll("[data-page-clone]").forEach((node) => node.remove());
  page.getAnimations().forEach((animation) => animation.cancel());

  const width = window.innerWidth;
  const clone = page.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.setAttribute("data-page-clone", "");
  clone.style.position = "fixed";
  clone.style.top = "0";
  clone.style.left = "0";
  clone.style.width = `${width}px`;
  clone.style.height = `${window.innerHeight}px`;
  clone.style.margin = "0";
  clone.style.zIndex = "40";
  clone.style.overflow = "hidden";
  clone.style.pointerEvents = "none";
  clone.style.background = "#baa3d0";
  clone.style.transform = "translate3d(0,0,0)";
  document.body.appendChild(clone);

  const timing: KeyframeAnimationOptions = {
    duration: 450,
    easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    fill: "both",
  };
  const incoming = page.animate(
    [
      { transform: `translate3d(${direction * width}px, 0, 0)` },
      { transform: "translate3d(0, 0, 0)" },
    ],
    timing
  );
  const outgoing = clone.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      { transform: `translate3d(${direction * -width}px, 0, 0)` },
    ],
    timing
  );

  const body = document.body;
  const previousOverflow = body.style.overflowX;
  body.style.overflowX = "hidden";

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    incoming.cancel();
    outgoing.cancel();
    clone.remove();
    page.style.transform = "";
    page.style.willChange = "";
    body.style.overflowX = previousOverflow;
  };

  page.style.willChange = "transform";
  navigate();
  incoming.onfinish = finish;
  window.setTimeout(finish, 520);
}

const TABS = [
  { href: TAB_HREFS[0], icon: LayoutGrid, label: "Workouts" },
  { href: TAB_HREFS[1], icon: Calendar, label: "Schema" },
  { href: TAB_HREFS[2], icon: BarChart3, label: "Stats" },
  { href: TAB_HREFS[3], icon: User, label: "Account" },
];

export default function BottomBar() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/onboarding") || pathname === "/workout/active") return;
    for (const tab of TABS) {
      router.prefetch(tab.href, { kind: PrefetchKind.FULL });
    }
  }, [pathname, router]);

  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/onboarding") || pathname === "/workout/active") {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-[#141416]/90 backdrop-blur-2xl border border-white/[0.1] px-6 py-3 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex items-center gap-8 transition-all">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          const from = TAB_HREFS.indexOf(pathname as (typeof TAB_HREFS)[number]);
          const to = TAB_HREFS.indexOf(tab.href);
          const slide =
            from !== -1 && to !== -1 && from !== to
              ? to > from
                ? "nav-forward"
                : "nav-back"
              : null;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              onClick={(event) => {
                if (!slide) return;
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                ) {
                  return;
                }
                const page = document.getElementById("page-root");
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                if (!page || reduce) return;

                event.preventDefault();
                try {
                  slidePages(page, slide === "nav-forward" ? 1 : -1, () => router.push(tab.href));
                } catch {
                  router.push(tab.href);
                }
              }}
              className={`p-2 rounded-full transition apple-press flex items-center justify-center relative ${
                isActive ? "text-white" : "text-[#71717a] hover:text-[#a1a1aa]"
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
              {isActive && (
                <motion.span
                  layoutId="tab-dot"
                  className="absolute -bottom-1 w-1 h-1 bg-[#baa3d0] rounded-full"
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}