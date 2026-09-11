"use client";

import {
  Banknote,
  Check,
  CreditCard,
  Monitor,
  Moon,
  Palette,
  Percent,
  Plus,
  QrCode,
  Settings as SettingsIcon,
  Store,
  Sun,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BankLogo } from "@/components/bank-logo";
import { Toggle } from "@/components/toggle";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormFieldError,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { SettingsSkeleton } from "@/components/skeletons";
import { DataTable } from "@/components/data-table";
import { cn } from "@/lib/cn";
import { usePosStore } from "@/lib/use-pos-store";
import { useUpdateStore, useUploadImage, useCreateBank, useUpdateBank, useSettings } from "@/lib/api/hooks";
import { storeSettingsSchema, type StoreSettings } from "@/lib/schemas/store";
import { taxSettingsSchema, type TaxSettings } from "@/lib/schemas/tax";
import { paymentSettingsSchema, type PaymentSettings } from "@/lib/schemas/payment";
import { bankCreateSchema, type BankInput } from "@/lib/schemas/bank";
import type { Bank } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";

type SettingsTab = "store" | "tax" | "payment" | "bank" | "qris" | "appearance";

const tabs: { value: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { value: "store", label: "Toko", icon: <Store size={16} /> },
  { value: "tax", label: "Pajak", icon: <Percent size={16} /> },
  { value: "payment", label: "Pembayaran", icon: <Banknote size={16} /> },
  { value: "bank", label: "Bank", icon: <CreditCard size={16} /> },
  { value: "qris", label: "QRIS", icon: <QrCode size={16} /> },
  { value: "appearance", label: "Tampilan", icon: <Palette size={16} /> },
];

export default function SettingsPage() {
  const user = usePosStore((s) => s.user);
  const dataLoaded = usePosStore((s) => s.dataLoaded);
  const [tab, setTab] = useState<SettingsTab>("store");

  if (user?.role !== "OWNER") {
    return (
      <Card>
        <EmptyState
          icon={<SettingsIcon size={20} />}
          title="Akses dibatasi"
          description="Hanya Owner yang dapat mengelola pengaturan toko."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {!dataLoaded ? <SettingsSkeleton /> : <>
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Pengaturan</h2>
        <p className="text-sm text-text-muted">Konfigurasi toko, pajak, dan metode pembayaran.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "cursor-pointer flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-150",
              tab === t.value
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-border bg-surface text-text-secondary hover:bg-surface-secondary",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "store" ? <StoreSettingsForm /> : null}
      {tab === "tax" ? <TaxSettingsForm /> : null}
      {tab === "payment" ? <PaymentSettingsForm /> : null}
      {tab === "bank" ? <BankSettingsForm /> : null}
      {tab === "qris" ? <QrisSettingsForm /> : null}
      {tab === "appearance" ? <AppearanceSettingsForm /> : null}
      </>}
    </div>
  );
}

function StoreSettingsForm() {
  const storeSettings = usePosStore((s) => s.storeSettings);
  const updateStore = useUpdateStore();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreSettings>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: storeSettings,
  });

  const onSubmit = (data: StoreSettings) => {
    updateStore.mutate(
      { storeSettings: { storeName: data.storeName.trim(), information: data.information.trim() } },
      {
        onSuccess: () => {
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 2000);
        },
        onError: () => setStatus("error"),
      },
    );
  };

  return (
    <Card className="max-w-xl">
      <CardHeader title="Informasi Toko" description="Identitas toko yang ditampilkan pada aplikasi." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Nama Toko</Label>
          <Input {...register("storeName")} />
          <FormFieldError message={errors.storeName?.message} />
        </div>
        <div>
          <Label>Informasi Toko</Label>
          <Textarea {...register("information")} />
        </div>
        <div className="flex items-center justify-between">
          <SaveStatus status={status} />
          <Button type="submit" disabled={updateStore.isPending}>
            {updateStore.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TaxSettingsForm() {
  const taxSettings = usePosStore((s) => s.taxSettings);
  const updateStore = useUpdateStore();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<TaxSettings>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: {
      enabled: taxSettings.enabled,
      dineInRate: taxSettings.dineInRate,
      takeawayRate: taxSettings.takeawayRate,
    },
  });

  const enabled = watch("enabled");

  const onSubmit = (data: TaxSettings) => {
    updateStore.mutate(
      { taxSettings: data },
      {
        onSuccess: () => {
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 2000);
        },
        onError: () => setStatus("error"),
      },
    );
  };

  return (
    <Card className="max-w-xl">
      <CardHeader
        title="Pengaturan Pajak"
        description="Pajak dapat berbeda antara dine-in dan takeaway."
        action={
          <Toggle
            checked={enabled}
            onChange={(v) => setValue("enabled", v, { shouldValidate: true })}
            label={enabled ? "Aktif" : "Nonaktif"}
          />
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", !enabled && "pointer-events-none opacity-50")}>
        <div>
          <Label>Pajak Dine-in (%)</Label>
          <Input
            type="number"
            {...register("dineInRate", {
              valueAsNumber: true,
              onChange: (e) => {
                const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setValue("dineInRate", pct / 100, { shouldValidate: true });
              },
            })}
            value={Math.round(watch("dineInRate") * 100)}
            min={0}
            max={100}
          />
        </div>
        <div>
          <Label>Pajak Takeaway (%)</Label>
          <Input
            type="number"
            {...register("takeawayRate", {
              valueAsNumber: true,
              onChange: (e) => {
                const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setValue("takeawayRate", pct / 100, { shouldValidate: true });
              },
            })}
            value={Math.round(watch("takeawayRate") * 100)}
            min={0}
            max={100}
          />
        </div>
        <div className="border-t border-border pt-4">
          <Button type="submit" disabled={updateStore.isPending}>
            {updateStore.isPending ? "Menyimpan…" : "Simpan Pengaturan Pajak"}
          </Button>
        </div>
      </form>
      <div className="mt-4">
        <SaveStatus status={status} />
      </div>
    </Card>
  );
}

function PaymentSettingsForm() {
  const paymentSettings = usePosStore((s) => s.paymentSettings);
  const updateStore = useUpdateStore();

  const { watch, setValue } = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: paymentSettings,
  });

  const items: { key: keyof PaymentSettings; label: string; desc: string }[] = [
    { key: "cashEnabled", label: "Cash", desc: "Pembayaran tunai dengan perhitungan kembalian" },
    { key: "bankEnabled", label: "Bank Transfer", desc: "Konfirmasi manual transfer bank" },
    { key: "qrisEnabled", label: "QRIS", desc: "Pembayaran QRIS dengan konfirmasi manual" },
  ];

  const update = (key: keyof PaymentSettings, value: boolean) => {
    setValue(key, value, { shouldValidate: true });
    updateStore.mutate({ paymentSettings: { ...paymentSettings, [key]: value } });
  };

  return (
    <Card className="max-w-xl">
      <CardHeader title="Metode Pembayaran" description="Nonaktifkan metode untuk menyembunyikannya pada checkout." />
      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{it.label}</p>
              <p className="text-xs text-text-muted">{it.desc}</p>
            </div>
            <Toggle checked={watch(it.key)} onChange={(v) => update(it.key, v)} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function SaveStatus({ status }: { status: "idle" | "saved" | "error" }) {
  if (status === "saved") return <span className="text-sm font-medium text-success-strong">Tersimpan</span>;
  if (status === "error") return <span className="text-sm font-medium text-error-strong">Gagal menyimpan</span>;
  return <span />;
}

function BankLogoActions({
  bank,
  onLogo,
  onRemoveLogo,
  onToggle,
}: {
  bank: { logo?: string; active: boolean; name: string };
  onLogo: (dataUrl: string) => void;
  onRemoveLogo: () => void;
  onToggle: () => void;
}) {
  return (
    <>
      <LogoUploadButton onFile={onLogo} label={bank.logo ? "Ganti" : "Logo"} />
      {bank.logo ? (
        <button
          type="button"
          onClick={onRemoveLogo}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-error-soft hover:text-error-strong"
          aria-label={`Hapus logo ${bank.name}`}
        >
          <Trash2 size={14} />
        </button>
      ) : null}
      <Toggle checked={bank.active} onChange={onToggle} />
    </>
  );
}

function BankSettingsForm() {
  const banks = usePosStore((s) => s.banks);
  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  const upload = useUploadImage();
  const [newLogo, setNewLogo] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BankInput>({
    resolver: zodResolver(bankCreateSchema),
    defaultValues: { name: "" },
  });

  const columns: ColumnDef<Bank, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Bank",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <BankLogo bank={row.original} />
          <div>
            <p className="text-sm font-medium text-text-primary">{row.original.name}</p>
            <Badge
              className={
                row.original.active
                  ? "bg-success-soft text-success-strong"
                  : "bg-muted text-text-muted"
              }
            >
              {row.original.active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <BankLogoActions
            bank={row.original}
            onLogo={async (logo) => {
              setError(null);
              try {
                const url = await upload.mutateAsync({ bucket: "bank-logos", file: await dataUrlToBlob(logo) });
                await updateBank.mutateAsync({ id: row.original.id, logo: url });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal mengunggah logo.");
              }
            }}
            onRemoveLogo={() => updateBank.mutate({ id: row.original.id, logo: null })}
            onToggle={() => updateBank.mutate({ id: row.original.id, active: !row.original.active })}
          />
        </div>
      ),
    },
  ];

  const onSubmit = async (data: BankInput) => {
    setError(null);
    try {
      const created = (await createBank.mutateAsync({ name: data.name.trim() })) as {
        data: { bank: { id: string } };
      };
      const id = created.data.bank.id;
      if (newLogo) {
        const logo = await upload.mutateAsync({ bucket: "bank-logos", file: await dataUrlToBlob(newLogo) });
        await updateBank.mutateAsync({ id, logo });
      }
      setNewLogo(undefined);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambah bank.");
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader
        title="Bank Transfer"
        description="Bank yang tersedia saat kasir mengonfirmasi transfer."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="mb-4 space-y-2">
        <div className="flex gap-2">
          <Input placeholder="Nama bank baru…" {...register("name")} />
          <Button type="submit" disabled={createBank.isPending || upload.isPending}>
            {createBank.isPending || upload.isPending ? (
              "Menambah…"
            ) : (
              <>
                <Plus size={16} />
                Tambah
              </>
            )}
          </Button>
        </div>
        <FormFieldError message={errors.name?.message} />
        {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}
        <div className="flex items-center gap-3">
          {newLogo ? (
            <BankLogo bank={{ name: watch("name") || "Bank", logo: newLogo }} />
          ) : (
            <span className="text-xs text-text-muted">Belum ada logo untuk bank baru.</span>
          )}
          <LogoUploadButton
            onFile={(logo) => setNewLogo(logo)}
            label="Pilih logo bank"
          />
          {newLogo ? (
            <button
              type="button"
              onClick={() => setNewLogo(undefined)}
              className="text-xs font-medium text-error-strong hover:underline"
            >
              Hapus
            </button>
          ) : null}
        </div>
      </form>

      <DataTable
        columns={columns}
        data={banks}
        initialSorting={[{ id: "name", desc: false }]}
        searchPlaceholder="Cari bank…"
        emptyTitle="Belum ada bank"
      />
    </Card>
  );
}

function LogoUploadButton({
  onFile,
  label,
}: {
  onFile: (dataUrl: string) => void;
  label: string;
}) {
  return (
    <label className="inline-flex">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onFile(await readFileAsDataUrl(file));
          e.target.value = "";
        }}
      />
      <span className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-text-primary hover:bg-surface-secondary">
        <Plus size={13} />
        {label}
      </span>
    </label>
  );
}

function QrisSettingsForm() {
  const updateStore = useUpdateStore();
  const upload = useUploadImage();
  const { data: settings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const qrisSettings = settings?.qrisSettings;
  const qrisEnabled = qrisSettings?.qrisEnabled ?? false;
  const image = qrisSettings?.qrisImageUrl ?? null;
  const currentName = qrisSettings?.qrisName ?? "";

  const onToggle = (v: boolean) => {
    updateStore.mutate({ qrisSettings: { qrisEnabled: v } });
  };

  const onUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await upload.mutateAsync({ bucket: "qris-images", file });
      await updateStore.mutateAsync({
        qrisSettings: { qrisImageUrl: url, qrisName: currentName || undefined },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah QRIS.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader
        title="QRIS"
        description="QRIS toko ditampilkan saat kasir memilih pembayaran QRIS."
        action={
          <Toggle
            checked={qrisEnabled}
            onChange={onToggle}
            label={qrisEnabled ? "Aktif" : "Nonaktif"}
          />
        }
      />

      <div className={cn("space-y-4", !qrisEnabled && "pointer-events-none opacity-50")}>
        <div className="flex items-center gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="QRIS"
              className="h-32 w-32 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-border bg-surface-secondary p-2">
              <div className="grid h-full w-full grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-[2px]",
                      Math.sin(i * 12.9898) > 0.1 ? "bg-slate-900" : "bg-white",
                    )}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">QRIS {currentName}</p>
            <p className="text-xs text-text-muted">PNG atau JPG, maksimal 2MB.</p>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(file);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-surface-secondary">
                {uploading ? "Mengunggah…" : image ? "Ganti QRIS" : "Unggah QRIS"}
              </span>
            </label>
          </div>
        </div>
        {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}
      </div>
    </Card>
  );
}

const themeOptions: { value: "light" | "dark" | "system"; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", description: "Selalu tampilan terang", icon: <Sun size={18} /> },
  { value: "dark", label: "Dark", description: "Selalu tampilan gelap", icon: <Moon size={18} /> },
  { value: "system", label: "System", description: "Mengikuti preferensi perangkat", icon: <Monitor size={18} /> },
];

function AppearanceSettingsForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeTheme = mounted ? theme : undefined;

  return (
    <Card className="max-w-xl">
      <CardHeader
        title="Tampilan"
        description="Atur tema aplikasi. Perubahan tersimpan otomatis di perangkat."
      />
      <div className="grid gap-3">
        {themeOptions.map((opt) => {
          const active = activeTheme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "cursor-pointer flex items-center gap-3 rounded-lg border p-3 text-left transition-colors duration-150",
                active
                  ? "border-primary-500 bg-primary-50"
                  : "border-border bg-surface hover:bg-surface-secondary",
              )}
            >
              <span className={cn("shrink-0", active ? "text-primary-500" : "text-text-muted")}>
                {opt.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-primary">{opt.label}</span>
                <span className="block text-xs text-text-muted">{opt.description}</span>
              </span>
              {active ? (
                <span className="ml-auto shrink-0 text-primary-500">
                  <Check size={16} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
