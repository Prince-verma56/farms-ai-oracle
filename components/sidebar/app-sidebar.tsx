"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { navConfig } from "@/config/nav.config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [switchingRole, setSwitchingRole] = useState(false);

  const convexUser = useQuery(
    api.users.getRoleByClerkId,
    isSignedIn && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (convexUser?.role === "farmer" || convexUser?.role === "buyer") {
      setRole(convexUser.role);
    }
  }, [convexUser]);

  const mainItems = useMemo(
    () => (role === "buyer" ? navConfig.buyerNav : navConfig.farmerNav),
    [role],
  );
  const secondaryItems = useMemo(
    () => (role === "buyer" ? navConfig.buyerSecondaryNav : navConfig.farmerSecondaryNav),
    [role],
  );
  const quickCreateLabel = role === "buyer" ? navConfig.buyerQuickCreateLabel : navConfig.farmerQuickCreateLabel;
  const isFarmer = role === "farmer";
  const roleLabel = isFarmer ? "Farmer" : "Buyer";

  const switchRole = async (nextRole: "farmer" | "buyer") => {
    if (nextRole === role || switchingRole) return;
    setSwitchingRole(true);
    try {
      const response = await fetch("/api/me/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!response.ok) throw new Error("Role update failed");
      setRole(nextRole);
      const target = nextRole === "farmer" ? "/admin" : "/marketplace";
      if (!pathname.startsWith(target)) {
        router.push(target);
      }
      router.refresh();
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-active:bg-transparent">
              <Link href={isFarmer ? "/admin" : "/marketplace"}>
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  P
                </span>
                <span className="truncate font-semibold">{navConfig.appName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between" disabled={!isSignedIn || switchingRole}>
              <span>{switchingRole ? "Switching..." : roleLabel}</span>
              <ChevronDown className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Switch Workspace Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => switchRole("farmer")}>Farmer</DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchRole("buyer")}>Buyer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavSecondary items={secondaryItems} />
      </SidebarFooter>
    </Sidebar>
  );
}
