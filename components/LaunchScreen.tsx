"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

const AUTH_ROUTES = ["/login", "/register"];

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

  useLayoutEffect(() => {
    if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/onboarding")) {
      document.getElementById("boot-splash")?.remove();
    }
  }, [pathname]);

  useEffect(() => {
    if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/onboarding")) return;
    if (started.current) return;
    started.current = true;

    if (sessionStorage.getItem("repiq-booted") === "1") {
      document.getElementById("boot-splash")?.remove();
      setFinished(true);
      return;
    }

    const bar = document.getElementById("boot-bar");
    if (bar) bar.style.width = "100%";
    setProgress(1);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("repiq-booted", "1");
      document.getElementById("boot-splash")?.remove();
      setFinished(true);
      routerRef.current.prefetch("/notifications", { kind: PrefetchKind.FULL });
      routerRef.current.prefetch("/workout/active", { kind: PrefetchKind.FULL });
    }, 280);
    return () => window.clearTimeout(timer);
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
