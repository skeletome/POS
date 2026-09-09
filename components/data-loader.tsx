"use client";

import { useEffect } from "react";
import { useBanks, useCategories, useCashiers, useProducts, useSettings, useTransactions } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";

export function DataLoader() {
  const user = usePosStore((s) => s.user);
  const hydrate = usePosStore((s) => s.hydrate);

  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: banks } = useBanks();
  const { data: settings } = useSettings();
  const { data: transactions } = useTransactions();

  const role = user?.role;
  const { data: cashiers } = useCashiers(role === "OWNER");

  useEffect(() => {
    if (products) hydrate({ products });
  }, [products, hydrate]);
  useEffect(() => {
    if (categories) hydrate({ categories });
  }, [categories, hydrate]);
  useEffect(() => {
    if (banks) hydrate({ banks });
  }, [banks, hydrate]);
  useEffect(() => {
    if (settings) {
      hydrate({
        storeSettings: {
          storeName: settings.storeSettings.storeName,
          information: settings.storeSettings.information,
        },
        taxSettings: settings.taxSettings,
        paymentSettings: settings.paymentSettings,
      });
    }
  }, [settings, hydrate]);
  useEffect(() => {
    if (transactions) hydrate({ transactions });
  }, [transactions, hydrate]);
  useEffect(() => {
    if (role === "OWNER" && cashiers) hydrate({ cashiers });
  }, [role, cashiers, hydrate]);

  return null;
}