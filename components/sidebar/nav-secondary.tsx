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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavSecondaryProps = {
  items: NavItemConfig[];
};

export function NavSecondary({ items }: NavSecondaryProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Support</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = resolveIcon(item.icon);
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild size="sm" isActive={isActive} tooltip={item.title}>
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}