"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RoleResponse = {
  exists: boolean;
  role: "farmer" | "buyer" | null;
};

export default function RoleRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsRolePick, setNeedsRolePick] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const resolveRole = async () => {
      const response = await fetch("/api/me/role", { cache: "no-store" });
      if (!response.ok) {
        router.replace("/sign-in");
        return;
      }
      const data = (await response.json()) as RoleResponse;

      if (data.role === "farmer") {
        router.replace("/admin");
        return;
      }
      if (data.role === "buyer") {
        router.replace("/marketplace");
        return;
      }

      setNeedsRolePick(true);
      setLoading(false);
    };

    resolveRole().catch(() => {
      setNeedsRolePick(true);
      setLoading(false);
    });
  }, [router]);

  const setRole = async (role: "farmer" | "buyer") => {
    setSaving(true);
    try {
      const response = await fetch("/api/me/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to set role.");
      router.replace(role === "farmer" ? "/admin" : "/marketplace");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Checking your role...</p>
      </main>
    );
  }

  if (!needsRolePick) return null;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose Your Role</CardTitle>
          <CardDescription>Select the experience you want to continue with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" disabled={saving} onClick={() => setRole("farmer")}>
            Continue as Farmer
          </Button>
          <Button className="w-full" variant="outline" disabled={saving} onClick={() => setRole("buyer")}>
            Continue as Buyer
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
