"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

export default function Prefetch({ hrefs }: { hrefs: string[] }) {
  const router = useRouter();
  const key = hrefs.join("\n");

  useEffect(() => {
    for (const href of key.split("\n")) {
      if (href) router.prefetch(href, { kind: PrefetchKind.FULL });
    }
  }, [router, key]);

  return null;
}
