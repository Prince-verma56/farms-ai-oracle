"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Check, Sprout, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Role = "farmer" | "buyer";

const roleCards: Array<{
  role: Role;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bullets: string[];
}> = [
  {
    role: "farmer",
    title: "I'm a Farmer",
    subtitle: "List your crops, get fair prices via AI Oracle",
    icon: <Sprout className="size-6" />,
    bullets: ["AI price guidance", "Direct buyer discovery", "Escrow-ready orders"],
  },
  {
    role: "buyer",
    title: "I'm a Buyer",
    subtitle: "Discover fresh crops directly from farms near you",
    icon: <ShoppingBag className="size-6" />,
    bullets: ["Nearby verified listings", "Direct farmer chat", "Fast checkout and tracking"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const setUserRole = useMutation(api.users.setUserRole);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    const role = user.publicMetadata?.role;
    if (role === "farmer" || role === "buyer") {
      router.replace("/hub");
    }
  }, [isLoaded, user, router]);

  const canContinue = useMemo(() => Boolean(selectedRole) && !saving, [selectedRole, saving]);

  const onContinue = async () => {
    if (!selectedRole || !user?.id) return;
    setSaving(true);
    try {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        "unknown@example.com";
      const roleResult = await setUserRole({
        role: selectedRole,
        clerkId: user.id,
        name: user.fullName || user.firstName || "User",
        email,
        imageUrl: user.imageUrl || undefined,
      });
      if (!roleResult.success) {
        throw new Error(roleResult.error || "Failed to save role in Convex");
      }

      const res = await fetch("/api/me/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) throw new Error("Failed to update Clerk role metadata");

      toast.success("Role saved successfully");
      router.replace("/hub");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete onboarding";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, staggerChildren: 0.15 }}
        className="mx-auto flex max-w-5xl flex-col gap-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Choose Your Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            This is a one-time setup. You can continue to your role-based hub after selection.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roleCards.map((card) => {
            const selected = selectedRole === card.role;
            return (
              <motion.div key={card.role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className={`relative h-full cursor-pointer border-2 transition-all ${
                    selected ? "border-primary shadow-lg" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedRole(card.role)}
                >
                  {selected ? (
                    <span className="absolute right-4 top-4 inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" />
                    </span>
                  ) : null}
                  <CardHeader>
                    <div className="mb-2 inline-flex size-12 items-center justify-center rounded-xl border bg-card text-primary">
                      {card.icon}
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {card.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="size-4 text-primary" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant={selected ? "default" : "outline"}
                      className="mt-3 w-full"
                      onClick={() => setSelectedRole(card.role)}
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Button disabled={!canContinue} onClick={onContinue} className="h-11 w-full md:ml-auto md:w-56">
          {saving ? "Saving..." : "Continue"}
        </Button>
      </motion.div>
    </main>
  );
}
