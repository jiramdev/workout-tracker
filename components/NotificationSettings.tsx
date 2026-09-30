"use client";

import { useEffect, useState } from "react";
import { enableNotifications } from "@/lib/enable-notifications";

type Status = NotificationPermission | "unsupported" | "loading";

export default function NotificationSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission);
  }, []);

  async function ask() {
    setAsking(true);
    const result = await enableNotifications();
    setStatus(result === "granted" ? "granted" : result === "unsupported" ? "unsupported" : "denied");
    setAsking(false);
  }

  const enabled = status === "granted";

  return (
    <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
      <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase px-1">
        Meldingen
      </span>
      <p className="px-1 text-[13px] text-[#a1a1aa]">
        Krijg een seintje als je rust voorbij is.
      </p>
      <p className="px-1 text-[13px] text-white">
        {status === "loading"
          ? "Status laden..."
          : status === "unsupported"
            ? "Deze browser ondersteunt geen meldingen."
            : enabled
              ? "Meldingen staan aan."
              : status === "denied"
                ? "Meldingen zijn geblokkeerd in je browser."
                : "Meldingen staan uit."}
      </p>
      {!enabled && status !== "unsupported" && status !== "denied" && status !== "loading" && (
        <button
          type="button"
          onClick={ask}
          disabled={asking}
          className="w-full bg-[#baa3d0] text-[#141416] rounded-full py-3.5 font-editorial text-[18px] tracking-wider disabled:opacity-50 apple-press"
        >
          {asking ? "VRAGEN..." : "MELDINGEN AANZETTEN"}
        </button>
      )}
    </section>
  );
}
