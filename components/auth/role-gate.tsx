"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RoleGateProps = {
  requiredRole: "farmer" | "buyer";
  children: React.ReactNode;
};

export function RoleGate({ requiredRole, children }: RoleGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const response = await fetch("/api/me/role", { cache: "no-store" });
      if (!response.ok) {
        router.replace("/sign-in");
        return;
      }

      const data = (await response.json()) as { role?: "farmer" | "buyer" | null };
      if (!data.role) {
        router.replace("/role-redirect");
        return;
      }
      if (data.role !== requiredRole) {
        router.replace(data.role === "farmer" ? "/admin" : "/marketplace");
        return;
      }
      setReady(true);
    };

    verify().catch(() => router.replace("/sign-in"));
  }, [requiredRole, router]);

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Resolving workspace...</div>;
  }

  return <>{children}</>;
}
