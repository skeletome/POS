"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, CircleUserRound, Store } from "lucide-react";
import { useState } from "react";
import { setSession } from "@/lib/session";
import { loadSettings } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const settings = loadSettings();
  const [email, setEmail] = useState("owner@pos.app");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginAs = (role: Role, name: string) => {
    setSession(role, name);
    router.push("/dashboard");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const valid = email === "owner@pos.app" || email === "cashier@pos.app";
    setTimeout(() => {
      setLoading(false);
      if (!valid || password !== "123456") {
        setError("Email atau password salah.");
        return;
      }
      if (email === "cashier@pos.app") {
        loginAs("CASHIER", "Rina Kartika");
      } else {
        loginAs("OWNER", "Andi Wijaya");
      }
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-500 p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
              {settings.logo}
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">{settings.name}</p>
              <p className="text-sm text-blue-100">POS Kasir</p>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-snug">
              Transaksi cepat &amp; terstruktur untuk toko makanan minuman.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-blue-100">
              Kelola menu, pilih pengaturan, layani pelanggan, dan pantau penjualan dalam satu
              aplikasi.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <Banknote className="h-4 w-4" /> MVP: Cash / Bank Transfer / QRIS
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-2xl">
              {settings.logo}
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight text-gray-900">{settings.name}</p>
              <p className="text-sm text-gray-500">POS Kasir</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900">Masuk</h2>
          <p className="mt-1 text-sm text-gray-500">Gunakan akun untuk mulai bertransaksi.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@pos.app"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Masuk <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-slate-200" />
            Demo cepat
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => loginAs("OWNER", "Andi Wijaya")}>
              <Store className="h-4 w-4" /> Owner
            </Button>
            <Button variant="secondary" onClick={() => loginAs("CASHIER", "Rina Kartika")}>
              <CircleUserRound className="h-4 w-4" /> Cashier
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Akun demo: <span className="font-medium text-gray-500">owner@pos.app</span> atau{" "}
            <span className="font-medium text-gray-500">cashier@pos.app</span> — password{" "}
            <span className="font-medium text-gray-500">123456</span>
          </p>
        </div>
      </div>
    </div>
  );
}