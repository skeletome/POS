"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  Search,
  Store,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getNav, titleForPath } from "./nav";
import { clearSession, getSession, setSession } from "@/lib/session";
import { loadSettings } from "@/lib/data";
import type { StoreSettings } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

function SidebarContent({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role: "OWNER" | "CASHIER";
  onNavigate?: () => void;
}) {
  const [settings, setSettings] = useState<StoreSettings>(loadSettings);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const sections = getNav(role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-lg">
          {settings.logo}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{settings.name}</p>
          <p className="text-[11px] text-gray-500">POS Kasir</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-gray-400">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:bg-slate-50 hover:text-gray-700",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <Avatar name={role === "OWNER" ? "Andi Wijaya" : "Rina Kartika"} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-gray-900">
              {role === "OWNER" ? "Andi Wijaya" : "Rina Kartika"}
            </p>
            <p className="text-[11px] text-gray-500">
              {role === "OWNER" ? "Owner" : "Cashier"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState<ReturnType<typeof getSession>>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSessionState(s);
    setName(s.name);
  }, [router]);

  const role = session?.role ?? "OWNER";
  const title = useMemo(() => titleForPath(pathname), [pathname]);

  const switchRole = (r: "OWNER" | "CASHIER") => {
    if (!getSession()) {
      setSession(r, r === "OWNER" ? "Andi Wijaya" : "Rina Kartika");
    } else {
      setSession(r, r === "OWNER" ? "Andi Wijaya" : "Rina Kartika");
    }
    setSessionState({ role: r, name: r === "OWNER" ? "Andi Wijaya" : "Rina Kartika" });
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const logout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-slate-200 bg-white lg:block">
        <SidebarContent pathname={pathname} role={role} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-white">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-slate-100"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent pathname={pathname} role={role} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm lg:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-slate-100 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-900">{title}</h1>

          <div className="hidden items-center md:flex">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="h-10 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                placeholder="Cari menu, transaksi…"
              />
            </div>
          </div>

          <button className="relative rounded-lg p-2 text-gray-500 hover:bg-slate-100" aria-label="Notifikasi">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100"
            >
              <Avatar name={name || (role === "OWNER" ? "Andi Wijaya" : "Rina Kartika")} />
              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-medium leading-tight text-gray-900">
                  {name || (role === "OWNER" ? "Andi Wijaya" : "Rina Kartika")}
                </p>
                <p className="text-[11px] leading-tight text-gray-500">
                  {role === "OWNER" ? "Owner" : "Cashier"}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
                  <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Demo - Pilih Role
                  </p>
                  <button
                    onClick={() => switchRole("OWNER")}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      role === "OWNER" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-slate-50",
                    )}
                  >
                    <Store className="h-4 w-4" /> Owner
                  </button>
                  <button
                    onClick={() => switchRole("CASHIER")}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      role === "CASHIER" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-slate-50",
                    )}
                  >
                    <CircleUserRound className="h-4 w-4" /> Cashier
                  </button>
                  <div className="my-1 h-px bg-slate-100" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}