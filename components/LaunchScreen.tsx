"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

const AUTH_ROUTES = ["/login", "/register"];

function sameRoute(href: string, pathname: string, search: string) {
  const target = new URL(href, window.location.origin);
  return target.pathname === pathname && target.search === search;
}

function entryMatches(entryName: string, href: string) {
  const entry = new URL(entryName);
  const target = new URL(href, window.location.origin);
  if (entry.pathname !== target.pathname) return false;
  const planId = target.searchParams.get("planId");
  if (planId) return entry.searchParams.get("planId") === planId;
  return true;
}

function waitForPrefetch(prefetch: (href: string) => void, href: string) {
  const started = performance.now();
  prefetch(href);

  return new Promise<void>((resolve) => {
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      let sawRequest = false;

      for (const entry of entries) {
        if (entry.startTime < started - 50) continue;
        if (!entryMatches(entry.name, href)) continue;
        sawRequest = true;
        if (entry.responseEnd > 0) {
          window.clearInterval(timer);
          resolve();
          return;
        }
      }

      if ((!sawRequest && elapsed > 800) || elapsed > 12000) {
        window.clearInterval(timer);
        resolve();
      }
    }, 40);
  });
}

export default function LaunchScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const started = useRef(false);

  const signingUp = pathname.startsWith("/onboarding");
  const show = !finished && !AUTH_ROUTES.includes(pathname) && !signingUp;

  useEffect(() => {
    if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/onboarding")) {
      document.getElementById("boot-splash")?.remove();
      return;
    }
    if (started.current) return;
    started.current = true;

    const prefetch = (href: string) => {
      routerRef.current.prefetch(href, { kind: PrefetchKind.FULL });
    };

    (async () => {
      let hrefs = ["/", "/schedule", "/analytics", "/account"];
      try {
        const response = await fetch("/api/launch");
        if (response.ok) {
          const data = (await response.json()) as { hrefs?: string[] };
          if (data.hrefs?.length) hrefs = data.hrefs;
        }
      } catch {
        // The main tabs are still warmed below.
      }

      const search = window.location.search;
      const pending = hrefs.filter((href) => !sameRoute(href, pathname, search));
      const total = pending.length + 1;
      let done = 1;
      setProgress(done / total);
      const bootBar = document.getElementById("boot-bar");
      if (bootBar) bootBar.style.width = `${(done / total) * 100}%`;

      await Promise.all(
        pending.map(async (href) => {
          await waitForPrefetch(prefetch, href);
          done += 1;
          setProgress(done / total);
          const bar = document.getElementById("boot-bar");
          if (bar) bar.style.width = `${(done / total) * 100}%`;
        })
      );

      setProgress(1);
      const bar = document.getElementById("boot-bar");
      if (bar) bar.style.width = "100%";
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      document.getElementById("boot-splash")?.remove();
      setFinished(true);
    })();
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#baa3d0] text-[#141416] flex flex-col items-center justify-center select-none">
      <p className="brand-name text-[88px] leading-none">repiq</p>
      <p className="mt-5 text-[15px] font-medium tracking-tight opacity-70">Every rep, counted.</p>
      <div className="mt-6 h-[3px] w-28 overflow-hidden rounded-full bg-[#141416]/15">
        <div
          className="h-full rounded-full bg-[#141416] transition-[width] duration-200 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        />
      </div>
    </div>
  );
}
