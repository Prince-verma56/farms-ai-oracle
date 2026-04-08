"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleRedirectPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [needsRolePick, setNeedsRolePick] = useState(false);
  const [saving, setSaving] = useState(false);

  const convexRole = useQuery(
    api.users.getRoleByClerkId,
    isSignedIn && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace("/sign-in");
      return;
    }

    const metadataRole = user.publicMetadata?.role;
    const normalizedMetadataRole =
      metadataRole === "farmer" || metadataRole === "buyer" ? metadataRole : null;
    const normalizedConvexRole =
      convexRole?.role === "farmer" || convexRole?.role === "buyer" ? convexRole.role : null;
    const role = normalizedMetadataRole ?? normalizedConvexRole;

    if (role === "farmer") {
      router.replace("/hub");
      return;
    }
    if (role === "buyer") {
      router.replace("/hub");
      return;
    }

    setNeedsRolePick(true);
    setLoading(false);
  }, [router, isLoaded, isSignedIn, user, convexRole]);

  const setRole = async (role: "farmer" | "buyer") => {
    setSaving(true);
    try {
      const response = await fetch("/api/me/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to set role.");
      router.replace("/hub");
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
