"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register"];

export default function LaunchScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const started = useRef(false);

  useLayoutEffect(() => {
    if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/onboarding")) {
      document.getElementById("boot-splash")?.remove();
    }
  }, [pathname]);

  useEffect(() => {
    if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/onboarding")) return;
    if (started.current) return;
    started.current = true;

    const splash = document.getElementById("boot-splash");
    if (sessionStorage.getItem("repiq-booted") === "1") {
      splash?.remove();
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bar = document.getElementById("boot-bar");
    if (bar) bar.style.width = "100%";
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("repiq-booted", "1");
      splash?.remove();
      router.prefetch("/notifications");
      router.prefetch("/workout/active");
    }, reduce ? 0 : 280);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  return null;
}
