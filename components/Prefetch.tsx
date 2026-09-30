"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Prefetch({ hrefs }: { hrefs: string[] }) {
  const router = useRouter();
  const key = hrefs.join("\n");

  useEffect(() => {
    for (const href of key.split("\n")) {
      if (href) router.prefetch(href);
    }
  }, [router, key]);

  return null;
}
