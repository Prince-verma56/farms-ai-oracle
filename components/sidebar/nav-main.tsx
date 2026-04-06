"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItemConfig } from "@/config/nav.config";
import { resolveIcon } from "@/lib/icon-map";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavMainProps = {
  items: NavItemConfig[];
};

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = resolveIcon(item.icon);
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}