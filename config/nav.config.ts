export type NavItemConfig = {
  title: string;
  href: string;
  icon: string;
  badge?: string;
};

export type NavConfig = {
  appName: string;
  farmerQuickCreateLabel: string;
  buyerQuickCreateLabel: string;
  farmerNav: typeof FARMER_ITEMS;
  buyerNav: typeof BUYER_ITEMS;
  farmerSecondaryNav: NavItemConfig[];
  buyerSecondaryNav: NavItemConfig[];
};

export const FARMER_ITEMS: NavItemConfig[] = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { title: "My Inventory", href: "/admin/inventory", icon: "Leaf" },
  { title: "Sales Tracking", href: "/admin/orders", icon: "ListOrdered" },
  { title: "AI Oracle", href: "/admin/ai-oracle", icon: "Sparkles" },
  { title: "Deep Market Trends", href: "/admin/analytics", icon: "Activity" },
];

export const BUYER_ITEMS: NavItemConfig[] = [
  { title: "Discovery Feed", href: "/marketplace", icon: "LayoutDashboard" },
  { title: "Purchase History", href: "/marketplace/orders", icon: "ListOrdered" },
  { title: "Live Delivery Status", href: "/marketplace/track", icon: "Truck" },
];

export const navConfig: NavConfig = {
  appName: "Farm Dashboard",
  farmerQuickCreateLabel: "Quick Create",
  buyerQuickCreateLabel: "Discover Deals",
  farmerNav: FARMER_ITEMS,
  buyerNav: BUYER_ITEMS,
  farmerSecondaryNav: [
    { title: "Billing", href: "/admin/billing", icon: "CreditCard" },
    { title: "Settings", href: "/admin/settings", icon: "Settings" },
    { title: "Help", href: "/admin/help", icon: "CircleHelp" },
  ],
  buyerSecondaryNav: [
    { title: "Billing", href: "/marketplace/billing", icon: "CreditCard" },
    { title: "Settings", href: "/marketplace/settings", icon: "Settings" },
    { title: "Help", href: "/marketplace/help", icon: "CircleHelp" },
  ],
};
