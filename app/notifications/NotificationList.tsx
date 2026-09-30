"use client";

import { useEffect } from "react";
import Link from "next/link";
import { markNotificationsRead } from "./actions";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function NotificationList({ items }: { items: NotificationItem[] }) {
  useEffect(() => {
    if (items.some((item) => !item.read)) markNotificationsRead();
  }, [items]);

  if (items.length === 0) {
    return (
      <section className="bg-[#141416] border border-white/[0.08] rounded-[34px] px-6 py-12 text-center shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
        <p className="font-editorial text-[28px] text-white leading-none">Stil</p>
        <p className="mt-3 text-[13px] text-[#a1a1aa]">
          Nog geen meldingen. Een seintje als je rust voorbij is verschijnt hier.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-editorial text-[20px] tracking-wide text-white leading-none">
                {item.title}
              </h2>
              {!item.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#baa3d0] shrink-0" />}
            </div>
            <p className="text-[13px] text-[#a1a1aa]">{item.body}</p>
            <p className="text-[11px] font-semibold tracking-wider text-[#71717a] uppercase">
              {formatWhen(item.createdAt)}
            </p>
          </>
        );

        const className =
          "block bg-[#141416] border border-white/[0.08] rounded-[28px] px-5 py-4 space-y-2 shadow-[0_12px_28px_rgba(0,0,0,0.2)]";

        if (!item.href) {
          return (
            <article key={item.id} className={className}>
              {inner}
            </article>
          );
        }

        return (
          <Link key={item.id} href={item.href} className={`${className} apple-press`}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
