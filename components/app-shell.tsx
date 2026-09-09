"use client";

import { cn } from "@/lib/cn";
import { usePosStore } from "@/lib/use-pos-store";
import { POS_MASCOT_URL } from "@/lib/brand";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  SlidersHorizontal,
  Store,
  Tags,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { href: "/pos", label: "POS Kasir", icon: <UtensilsCrossed size={18} /> },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { href: "/menu", label: "Menu & Produk", icon: <Tags size={18} /> },
      { href: "/menu/categories", label: "Kategori", icon: <Store size={18} /> },
      { href: "/menu/options", label: "Product Options", icon: <SlidersHorizontal size={18} /> },
      { href: "/transactions", label: "Transaksi", icon: <ReceiptText size={18} /> },
      { href: "/reports", label: "Laporan", icon: <BarChart3 size={18} /> },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/cashiers", label: "Kasir", icon: <Users size={18} /> },
      { href: "/settings", label: "Pengaturan", icon: <Settings size={18} /> },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = usePosStore((s) => s.user);
  const logout = usePosStore((s) => s.logout);
  const storeName = usePosStore((s) => s.storeSettings.storeName);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <img
          src={POS_MASCOT_URL}
          alt="POS"
          className="h-9 w-9 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{storeName}</p>
          <p className="text-[11px] text-text-muted">POS Kasir</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wide text-text-placeholder">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-primary-50 text-primary-500"
                        : "text-text-secondary hover:bg-slate-50",
                    )}
                  >
                    <span className={cn(active ? "text-primary-500" : "text-text-muted")}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {(user?.name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-[11px] text-text-muted">{user?.role === "OWNER" ? "Owner" : "Kasir"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-slate-50 hover:text-text-primary"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const user = usePosStore((s) => s.user);

  const currentLabel = useMemo(() => {
    for (const section of sections) {
      const found = section.items.find((i) => i.href === pathname);
      if (found) return found.label;
    }
    return "POS Kasir";
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[232px] shrink-0 border-r border-border print:hidden lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 print:hidden lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[260px] border-r border-border shadow-modal">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer absolute right-3 top-3 rounded-lg p-1.5 text-text-muted hover:text-text-primary"
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 print:hidden md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="cursor-pointer rounded-lg p-2 text-text-muted hover:bg-slate-50 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">{currentLabel}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {(user?.name ?? "?").charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-4 text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-muted">
                  {user?.role === "OWNER" ? "Owner" : "Kasir"}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } finally {
                  usePosStore.getState().logout();
                  window.location.href = "/login";
                }
              }}
            className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-slate-50 hover:text-text-primary"
            aria-label="Logout"
          >
            <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { SidebarContent };