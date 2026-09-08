import {
  BarChart3,
  LayoutDashboard,
  Receipt,
  Settings,
  SlidersHorizontal,
  Store,
  Tags,
  UserCog,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

const sameForBoth: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS Kasir", icon: Store },
  { href: "/transactions", label: "Transaksi", icon: Receipt },
];

const ownerOnlySections: NavSection[] = [
  {
    items: [{ href: "/reports", label: "Laporan", icon: BarChart3 }],
  },
  {
    label: "MENU",
    items: [
      { href: "/menu/products", label: "Produk", icon: UtensilsCrossed },
      { href: "/menu/categories", label: "Kategori", icon: Tags },
      { href: "/menu/options", label: "Product Options", icon: SlidersHorizontal },
    ],
  },
  {
    label: "PENGATURAN",
    items: [
      { href: "/settings", label: "Pengaturan Toko", icon: Settings },
      { href: "/settings/cashiers", label: "Kasir", icon: UserCog },
    ],
  },
];

export function getNav(role: Role): NavSection[] {
  if (role === "CASHIER") {
    return [{ items: sameForBoth }];
  }
  return [{ items: sameForBoth }, ...ownerOnlySections];
}

export const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "POS Kasir",
  "/transactions": "Transaksi",
  "/reports": "Laporan",
  "/menu/products": "Produk",
  "/menu/products/new": "Produk Baru",
  "/menu/categories": "Kategori",
  "/menu/options": "Product Options",
  "/settings": "Pengaturan Toko",
  "/settings/cashiers": "Kasir",
};

export function titleForPath(pathname: string): string {
  const exact = pageTitles[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/transactions/")) return "Detail Transaksi";
  if (pathname.startsWith("/menu/products/")) return "Ubah Produk";
  return "POS Kasir";
}