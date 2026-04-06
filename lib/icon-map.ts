import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  Leaf,
  ListOrdered,
  Settings,
  ShoppingCart,
  Sparkles,
  Tractor,
  Truck,
  Upload,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Upload,
  ShoppingCart,
  ListOrdered,
  Users,
  UserRound,
  Leaf,
  Tractor,
  CreditCard,
  Activity,
  Sparkles,
  Wallet,
  Truck,
  FileText,
  Settings,
  CircleHelp,
  BookOpen,
};

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? FileText;
}
