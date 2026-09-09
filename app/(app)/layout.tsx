"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DataLoader } from "@/components/data-loader";
import { useMe } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = usePosStore((s) => s.user);
  const { data: me, isLoading } = useMe();

  useEffect(() => {
    if (me && !user) {
      usePosStore.getState().setSession({
        userId: me.profile.id,
        name: me.profile.name,
        role: me.membership.role,
        storeId: me.store.id,
      });
    }
  }, [me, user]);

  useEffect(() => {
    if (!user && !isLoading && !me) router.replace("/login");
  }, [user, isLoading, me, router]);

  if (!user) return null;

  return (
    <AppShell>
      <DataLoader />
      {children}
    </AppShell>
  );
}