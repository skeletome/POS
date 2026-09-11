"use client";

import {
  BadgePercent,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormFieldError,
  Input,
  Label,
  Modal,
  Select,
  Tabs,
} from "@/components/ui";
import { Toggle } from "@/components/toggle";
import { DataTable } from "@/components/data-table";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import { usePosStore } from "@/lib/use-pos-store";
import { productDiscountCreateSchema } from "@/lib/schemas/discount";
import { voucherCreateSchema } from "@/lib/schemas/voucher";
import type { ProductDiscount, Voucher } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useCreateDiscount,
  useCreateVoucher,
  useDeleteDiscount,
  useDeleteVoucher,
  useUpdateDiscount,
  useUpdateVoucher,
} from "@/lib/api/hooks";

type DiscountType = "PERCENT" | "FIXED";
type PromoTab = "discounts" | "vouchers";

const formatDiscountValue = (type: DiscountType, value: number) =>
  type === "PERCENT" ? `${value}%` : formatRupiah(value);

export default function PromoPage() {
  const user = usePosStore((s) => s.user);
  const dataLoaded = usePosStore((s) => s.dataLoaded);
  const [tab, setTab] = useState<PromoTab>("discounts");

  if (user?.role !== "OWNER") {
    return (
      <Card>
        <EmptyState
          icon={<BadgePercent size={20} />}
          title="Akses dibatasi"
          description="Hanya Owner yang dapat mengelola promo dan voucher."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Promo & Diskon</h2>
        <p className="text-sm text-text-muted">Kelola promosi diskon produk dan kode voucher.</p>
      </div>

      <Tabs
        tabs={[
          { value: "discounts", label: "Diskon Produk" },
          { value: "vouchers", label: "Voucher" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {!dataLoaded ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin text-primary-500" />
        </Card>
      ) : tab === "discounts" ? (
        <DiscountsTab />
      ) : (
        <VouchersTab />
      )}
    </div>
  );
}

/* ------------------------------- Diskon Produk ------------------------------- */

function DiscountsTab() {
  const discounts = usePosStore((s) => s.discounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDiscount | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (d: ProductDiscount) => {
    setEditing(d);
    setModalOpen(true);
  };

  const columns: ColumnDef<ProductDiscount, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Promo",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{row.original.name}</p>
          <Badge
            className={
              row.original.active
                ? "mt-0.5 bg-success-soft text-success-strong"
                : "mt-0.5 bg-muted text-text-muted"
            }
          >
            {row.original.active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      ),
    },
    {
      id: "discountValue",
      accessorKey: "discountValue",
      header: "Diskon",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-text-primary">
          {formatDiscountValue(row.original.discountType, row.original.discountValue)}
        </span>
      ),
    },
    {
      id: "period",
      header: "Periode",
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">{formatPeriod(row.original.startDate, row.original.endDate)}</span>
      ),
    },
    {
      id: "products",
      header: "Produk",
      cell: ({ row }) => (
        <span className="text-sm text-text-muted">{row.original.productIds.length} produk</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <DiscountActions discount={row.original} onEdit={openEdit} />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Promosi Diskon Produk"
        description="Diskon diterapkan otomatis saat kasir menambahkan produk. Jika ada promo aktif yang tumpang tindih, diskon terbesar yang berlaku."
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} />
            Buat Promo
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={discounts}
        initialSorting={[{ id: "name", desc: false }]}
        searchPlaceholder="Cari promo…"
        emptyTitle="Belum ada promo"
        emptyDescription="Buat promo diskon untuk menawarkan diskon produk di hari spesial."
      />
      {modalOpen ? (
        <DiscountFormModal discount={editing} onClose={() => setModalOpen(false)} />
      ) : null}
    </Card>
  );
}

function DiscountActions({
  discount,
  onEdit,
}: {
  discount: ProductDiscount;
  onEdit: (d: ProductDiscount) => void;
}) {
  const update = useUpdateDiscount(discount.id);
  const remove = useDeleteDiscount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2">
      <Toggle
        checked={discount.active}
        onChange={(v) => update.mutate({ active: v })}
        label={discount.active ? "Aktif" : "Nonaktif"}
      />
      <Button variant="ghost" size="sm" onClick={() => onEdit(discount)} aria-label="Ubah promo">
        <Pencil size={15} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} aria-label="Hapus promo">
        <Trash2 size={15} />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Hapus promo?"
        description={`Promo "${discount.name}" akan dihapus permanen dan tidak lagi berlaku.`}
        busy={remove.isPending}
        onConfirm={() =>
          remove.mutate(discount.id, { onSuccess: () => setConfirmOpen(false) })
        }
      />
    </div>
  );
}

interface DiscountFormValues {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
  productIds: string[];
}

function DiscountFormModal({
  discount,
  onClose,
}: {
  discount: ProductDiscount | null;
  onClose: () => void;
}) {
  const products = usePosStore((s) => s.products);
  const create = useCreateDiscount();
  const update = useUpdateDiscount(discount?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const productOptions = useMemo(() => {
    const currentIds = new Set(discount?.productIds ?? []);
    return products.filter((p) => p.active || currentIds.has(p.id));
  }, [products, discount]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(productDiscountCreateSchema) as Resolver<DiscountFormValues>,
    defaultValues: discount
      ? {
          name: discount.name,
          discountType: discount.discountType,
          discountValue: discount.discountValue,
          startDate: discount.startDate ?? "",
          endDate: discount.endDate ?? "",
          active: discount.active,
          productIds: discount.productIds,
        }
      : {
          name: "",
          discountType: "PERCENT",
          discountValue: 0,
          startDate: "",
          endDate: "",
          active: true,
          productIds: [],
        },
  });

  const isFixed = watch("discountType") === "FIXED";
  const active = watch("active");

  const onSubmit = (data: DiscountFormValues) => {
    setError(null);
    const action = discount ? update : create;
    action.mutate(
      {
        name: data.name.trim(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        active: data.active,
        productIds: data.productIds,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (e) =>
          setError(e instanceof Error ? e.message : "Gagal menyimpan promo."),
      },
    );
  };

  const isBusy = create.isPending || update.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={discount ? "Ubah Promo" : "Buat Promo"}
      width="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Nama Promo</Label>
          <Input placeholder="cth: Hari Kemerdekaan" {...register("name")} />
          <FormFieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Jenis Diskon</Label>
            <Select {...register("discountType")}>
              <option value="PERCENT">Persen (%)</option>
              <option value="FIXED">Nominal (Rp)</option>
            </Select>
          </div>
          <div>
            <Label>{isFixed ? "Nilai Diskon (Rp)" : "Nilai Diskon (%)"}</Label>
            <Input
              type="number"
              min={1}
              {...register("discountValue", { valueAsNumber: true })}
            />
            <FormFieldError message={errors.discountValue?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Mulai</Label>
            <Input type="date" {...register("startDate")} />
          </div>
          <div>
            <Label>Berakhir</Label>
            <Input type="date" {...register("endDate")} />
          </div>
        </div>

        <div>
          <Label className="flex items-center justify-between">
            <span>Produk yang Didiskon</span>
            <span className="font-normal text-text-muted">({watch("productIds").length} dipilih)</span>
          </Label>
          {productOptions.length === 0 ? (
            <p className="text-xs text-text-muted">Belum ada produk aktif untuk dipilih.</p>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border p-2">
              <div className="grid grid-cols-2 gap-1">
                {productOptions.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      value={p.id}
                      {...register("productIds")}
                      className="size-4 accent-primary-500"
                    />
                    <span className="min-w-0 truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <FormFieldError message={errors.productIds?.message} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <Toggle
              checked={active}
              onChange={(v) => setValue("active", v)}
              label={active ? "Promo aktif" : "Promo nonaktif"}
            />
          </div>
          {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}
          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Menyimpan…" : discount ? "Simpan Perubahan" : "Buat Promo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* --------------------------------- Voucher --------------------------------- */

function VouchersTab() {
  const vouchers = usePosStore((s) => s.vouchers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (v: Voucher) => {
    setEditing(v);
    setModalOpen(true);
  };

  const columns: ColumnDef<Voucher, unknown>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-sm font-bold tracking-wide text-primary-500">
            <Tag size={12} />
            {row.original.code}
          </span>
          <Badge
            className={cn(
              "ml-2",
              row.original.active
                ? "bg-success-soft text-success-strong"
                : "bg-muted text-text-muted",
            )}
          >
            {row.original.active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      ),
    },
    {
      id: "discountValue",
      accessorKey: "discountValue",
      header: "Diskon",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-text-primary">
          {formatDiscountValue(row.original.discountType, row.original.discountValue)}
        </span>
      ),
    },
    {
      id: "requirements",
      header: "Syarat & Batas",
      cell: ({ row }) => {
        const v = row.original;
        const parts: string[] = [];
        if (v.minSubtotal != null) parts.push(`Min. ${formatRupiah(v.minSubtotal)}`);
        if (v.maxDiscount != null) parts.push(`Maks. ${formatRupiah(v.maxDiscount)}`);
        if (parts.length === 0) parts.push("Tanpa syarat");
        return <span className="text-sm text-text-muted">{parts.join(" · ")}</span>;
      },
    },
    {
      id: "usage",
      header: "Pemakaian",
      cell: ({ row }) => {
        const v = row.original;
        const used = v.usedCount ?? 0;
        return (
          <span className="text-sm text-text-muted">
            {used}
            {v.usageLimit != null ? ` / ${v.usageLimit}` : ""}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <VoucherActions voucher={row.original} onEdit={openEdit} />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Kode Voucher"
        description="Kasir cukup memasukkan kode voucher saat checkout. Voucher dapat digabung dengan diskon produk."
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} />
            Buat Voucher
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={vouchers}
        initialSorting={[{ id: "code", desc: false }]}
        searchPlaceholder="Cari kode voucher…"
        emptyTitle="Belum ada voucher"
        emptyDescription="Buat kode voucher untuk diberikan kepada pelanggan."
      />
      {modalOpen ? (
        <VoucherFormModal voucher={editing} onClose={() => setModalOpen(false)} />
      ) : null}
    </Card>
  );
}

function VoucherActions({
  voucher,
  onEdit,
}: {
  voucher: Voucher;
  onEdit: (v: Voucher) => void;
}) {
  const update = useUpdateVoucher(voucher.id);
  const remove = useDeleteVoucher();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2">
      <Toggle
        checked={voucher.active}
        onChange={(v) => update.mutate({ active: v })}
        label={voucher.active ? "Aktif" : "Nonaktif"}
      />
      <Button variant="ghost" size="sm" onClick={() => onEdit(voucher)} aria-label="Ubah voucher">
        <Pencil size={15} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} aria-label="Hapus voucher">
        <Trash2 size={15} />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Hapus voucher?"
        description={`Voucher "${voucher.code}" akan dihapus permanen dan tidak lagi berlaku.`}
        busy={remove.isPending}
        onConfirm={() =>
          remove.mutate(voucher.id, { onSuccess: () => setConfirmOpen(false) })
        }
      />
    </div>
  );
}

interface VoucherFormValues {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

function VoucherFormModal({
  voucher,
  onClose,
}: {
  voucher: Voucher | null;
  onClose: () => void;
}) {
  const create = useCreateVoucher();
  const update = useUpdateVoucher(voucher?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherCreateSchema) as Resolver<VoucherFormValues>,
    defaultValues: voucher
      ? {
          code: voucher.code,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          minSubtotal: voucher.minSubtotal,
          maxDiscount: voucher.maxDiscount,
          usageLimit: voucher.usageLimit,
          validFrom: voucher.validFrom ?? "",
          validUntil: voucher.validUntil ?? "",
          active: voucher.active,
        }
      : {
          code: "",
          discountType: "PERCENT",
          discountValue: 0,
          minSubtotal: null,
          maxDiscount: null,
          usageLimit: null,
          validFrom: "",
          validUntil: "",
          active: true,
        },
  });

  const isFixed = watch("discountType") === "FIXED";
  const active = watch("active");
  const codeValue = watch("code");

  const onSubmit = (data: VoucherFormValues) => {
    setError(null);
    const action = voucher ? update : create;
    action.mutate(
      {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minSubtotal: data.minSubtotal,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        validFrom: data.validFrom || null,
        validUntil: data.validUntil || null,
        active: data.active,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (e) =>
          setError(e instanceof Error ? e.message : "Gagal menyimpan voucher."),
      },
    );
  };

  const isBusy = create.isPending || update.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={voucher ? "Ubah Voucher" : "Buat Voucher"}
      width="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Kode Voucher</Label>
          <Input
            placeholder="cth: HEMAT10"
            className="font-mono font-bold uppercase tracking-wide"
            value={codeValue.toUpperCase()}
            onChange={(e) => setValue("code", e.target.value.toUpperCase(), { shouldValidate: true })}
          />
          <FormFieldError message={errors.code?.message} />
          <p className="mt-1 text-xs text-text-muted">
            Kasir memasukkan kode ini (tanpa spasi) saat checkout.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Jenis Diskon</Label>
            <Select {...register("discountType")}>
              <option value="PERCENT">Persen (%)</option>
              <option value="FIXED">Nominal (Rp)</option>
            </Select>
          </div>
          <div>
            <Label>{isFixed ? "Nilai Diskon (Rp)" : "Nilai Diskon (%)"}</Label>
            <Input
              type="number"
              min={1}
              {...register("discountValue", { valueAsNumber: true })}
            />
            <FormFieldError message={errors.discountValue?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Syarat Minimal Belanja (Rp)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Kosongkan jika tanpa syarat"
              value={watch("minSubtotal") ?? ""}
              onChange={(e) =>
                setValue(
                  "minSubtotal",
                  e.target.value === "" ? null : Number(e.target.value),
                  { shouldValidate: true },
                )
              }
            />
            <FormFieldError message={errors.minSubtotal?.message} />
          </div>
          <div>
            <Label>Batas Diskon Maksimum (Rp)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Kosongkan jika tanpa batas"
              value={watch("maxDiscount") ?? ""}
              onChange={(e) =>
                setValue(
                  "maxDiscount",
                  e.target.value === "" ? null : Number(e.target.value),
                  { shouldValidate: true },
                )
              }
            />
            <FormFieldError message={errors.maxDiscount?.message} />
          </div>
        </div>

        <div>
          <Label>Batas Pemakaian</Label>
          <Input
            type="number"
            min={1}
            placeholder="Kosongkan jika tanpa batas pemakaian"
            value={watch("usageLimit") ?? ""}
            onChange={(e) =>
              setValue(
                "usageLimit",
                e.target.value === "" ? null : Number(e.target.value),
                { shouldValidate: true },
              )
            }
          />
          <FormFieldError message={errors.usageLimit?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Berlaku Mulai</Label>
            <Input type="date" {...register("validFrom")} />
          </div>
          <div>
            <Label>Berlaku Hingga</Label>
            <Input type="date" {...register("validUntil")} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Toggle
            checked={active}
            onChange={(v) => setValue("active", v)}
            label={active ? "Voucher aktif" : "Voucher nonaktif"}
          />
          {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}
          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Menyimpan…" : voucher ? "Simpan Perubahan" : "Buat Voucher"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------------------------- Utils ---------------------------------- */

function formatPeriod(start?: string | null, end?: string | null): string {
  if (start && end) return `${start} s.d. ${end}`;
  if (start) return `Mulai ${start}`;
  if (end) return `s.d. ${end}`;
  return "Selalu";
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Hapus",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-text-muted">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" size="sm" disabled={busy} onClick={onConfirm}>
          {busy ? "Menghapus…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}