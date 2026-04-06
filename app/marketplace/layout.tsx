import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { RoleGate } from "@/components/auth/role-gate";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate requiredRole="buyer">
      <TooltipProvider delayDuration={150}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-gradient-to-b from-emerald-50/40 via-amber-50/20 to-background">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/70 px-4 backdrop-blur">
              <SidebarTrigger />
              <h1 className="text-sm font-medium text-muted-foreground">Buyer Marketplace</h1>
            </header>
            <div className="p-4 md:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </RoleGate>
  );
}
