"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePosStore } from "@/lib/use-pos-store";

export default function Home() {
  const router = useRouter();
  const user = usePosStore((s) => s.user);

  useEffect(() => {
    router.replace(user ? "/dashboard" : "/login");
  }, [router, user]);

  return null;
}