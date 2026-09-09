"use client";

import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { POS_MASCOT_URL } from "@/lib/brand";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormFieldError } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { usePosStore } from "@/lib/use-pos-store";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import type { Role } from "@/lib/types/order";

const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dszwbygyt/image/upload/v1788952655/Group_45_1_iajtaq.webp";

interface MeResponse {
  profile: { id: string; name: string; email: string };
  membership: { role: Role };
  store: { id: string };
  storeSettings: { storeName: string; information: string };
  taxSettings: { enabled: boolean; dineInRate: number; takeawayRate: number };
  paymentSettings: { cashEnabled: boolean; bankEnabled: boolean; qrisEnabled: boolean };
  qrisSettings: { qrisName: string; qrisImageUrl: string | null; qrisEnabled: boolean };
}

export default function LoginPage() {
  const router = useRouter();
  const user = usePosStore((s) => s.user);
  const storeName = usePosStore((s) => s.storeSettings.storeName);
  const setSession = usePosStore((s) => s.setSession);
  const setStoreSettings = usePosStore((s) => s.setStoreSettings);
  const setTaxSettings = usePosStore((s) => s.setTaxSettings);
  const setPaymentSettings = usePosStore((s) => s.setPaymentSettings);

  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setLoading(true);
      setAuthError(null);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email.trim().toLowerCase(),
            password: data.password,
          }),
        });

        if (res.status === 429) {
          setAuthError("Terlalu banyak percobaan login. Silakan coba lagi nanti.");
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
          setAuthError(body?.error?.message ?? "Email atau password salah.");
          return;
        }

        const { data: me } = (await res.json()) as { data: MeResponse };
        setSession({
          userId: me.profile.id,
          name: me.profile.name,
          role: me.membership.role,
          storeId: me.store.id,
        });
        setStoreSettings({ storeName: me.storeSettings.storeName, information: me.storeSettings.information });
        setTaxSettings(me.taxSettings);
        setPaymentSettings(me.paymentSettings);
        router.replace("/dashboard");
      } catch {
        setAuthError("Gagal terhubung ke server. Coba lagi.");
      } finally {
        setLoading(false);
      }
    },
    [router, setSession, setStoreSettings, setTaxSettings, setPaymentSettings],
  );

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Kiri — form login */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-7 items-center justify-center overflow-hidden rounded-lg">
              <Image
                src={POS_MASCOT_URL}
                alt="POS"
                width={28}
                height={28}
                className="h-7 w-7 object-cover"
              />
            </div>
            <span className="text-base font-semibold tracking-tight text-text-primary">
              {storeName || "POS"}
            </span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <div className="mb-8">
             
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Masuk ke akun Anda
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Silakan lengkapi kredensial Anda untuk mengelola{" "}
                <span className="font-medium text-text-primary">{storeName || "POS"}</span> Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-text-placeholder transition-shadow focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                  placeholder="nama@email.com"
                  {...register("email")}
                />
                <FormFieldError message={errors.email?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-text-placeholder transition-shadow focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <FormFieldError message={errors.password?.message} />
              </div>

              {authError ? (
                <div className="flex items-start gap-2 rounded-lg border border-error-light bg-error-soft px-3 py-2 text-sm text-error-strong">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              ) : null}

              <Button className="w-full" size="lg" type="submit" disabled={loading}>
                {loading ? <><Spinner /> Memproses…</> : "Masuk"}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-text-muted">
              Demo: owner@pos.local / kasir@pos.local (password dijelaskan saat seeding)
            </p>
          </motion.div>
        </div>
      </div>

      {/* Kanan — background gradient + gambar hero */}
      <div className="relative hidden overflow-hidden bg-gradient-to-b from-white to-primary-500 lg:block">
        <div className="flex h-full w-full items-center justify-end">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="w-full"
          >
            <Image
              src={HERO_IMAGE_URL}
              alt="Ilustrasi POS"
              width={800}
              height={800}
              priority
              className="ml-auto h-auto w-full max-w-[90%] object-contain"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
