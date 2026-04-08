"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TrackShipmentsPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const orderId = params.get("orderId");
    router.replace(orderId ? `/hub?orderId=${orderId}` : "/hub");
  }, [router, params]);

  return null;
}
