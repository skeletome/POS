"use client";

import { Plus, Pencil, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { MenuSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import { useCreateProduct, useDeleteProduct, useUpdateProduct, useUploadImage } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";
import { productSchema, type Product } from "@/lib/schemas/product";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

function emptyDraft(): Product {
  return {
    id: uid(),
    name: "",
    description: "",
    emoji: "🍽️",
    categoryId: "",
    dineInAvailable: true,
    takeawayAvailable: true,
    dineInPrice: 0,
    takeawayPrice: 0,
    active: true,
    optionGroups: [],
  };
}

export default function MenuPage() {
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const dataLoaded = usePosStore((s) => s.dataLoaded);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "priceAsc" | "priceDesc">("name");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(editing?.id ?? "");
  const deleteProduct = useDeleteProduct();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (categoryFilter === "ALL" || p.categoryId === categoryFilter) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
    if (sortBy === "priceAsc") return [...list].sort((a, b) => a.dineInPrice - b.dineInPrice);
    if (sortBy === "priceDesc") return [...list].sort((a, b) => b.dineInPrice - a.dineInPrice);
    return list;
  }, [products, query, categoryFilter, sortBy]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const openNew = () => {
    setEditing(emptyDraft());
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(JSON.parse(JSON.stringify(p)) as Product);
    setSaveError(null);
    setModalOpen(true);
  };

  const applyProduct = (p: Product) => {
    const isEdit = editing ? products.some((x) => x.id === editing.id) : false;
    setSaveError(null);
    const done = () => {
      setModalOpen(false);
      setEditing(null);
    };
    if (isEdit) {
      updateProduct.mutate(p, {
        onSuccess: done,
        onError: (e) => setSaveError(e.message),
      });
    } else {
      createProduct.mutate(p, {
        onSuccess: done,
        onError: (e) => setSaveError(e.message),
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Menu & Produk</h2>
        <p className="text-sm text-text-muted">Kelola produk, harga, dan ketersediaan.</p>
      </div>
      {!dataLoaded ? <MenuSkeleton /> : <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button onClick={openNew}>
            <Plus size={16} />
            Tambah Produk
          </Button>
        </div>

      <Card>
        <CardHeader
          title={`${filtered.length} produk`}
          description="Produk inactive tidak muncul pada POS untuk transaksi baru."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <Input
                  className="w-48 pl-9"
                  placeholder="Cari produk…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select
                className="w-44"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select
                className="w-44"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="name">Urut: Nama</option>
                <option value="priceAsc">Harga: Termurah</option>
                <option value="priceDesc">Harga: Termahal</option>
              </Select>
            </div>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed size={20} />}
            title="Belum ada produk"
            description="Tambahkan produk pertama Anda untuk mulai menjual."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="pb-2 pr-4 font-medium">Produk</th>
                  <th className="pb-2 pr-4 font-medium">Kategori</th>
                  <th className="pb-2 pr-4 font-medium">Dine-in</th>
                  <th className="pb-2 pr-4 font-medium">Takeaway</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-border-light transition-colors last:border-0 hover:bg-slate-50",
                      !p.active && "opacity-60",
                    )}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-base">
                          {p.emoji ?? "🍽️"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{p.name}</p>
                          {p.optionGroups.length > 0 ? (
                            <p className="text-xs text-text-muted">
                              {p.optionGroups.length} grup opsi
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{categoryName(p.categoryId)}</td>
                    <td className="py-3 pr-4 font-medium text-text-primary">
                      {formatRupiah(p.dineInPrice)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-text-primary">
                      {formatRupiah(p.takeawayPrice)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        className={
                          p.active
                            ? "bg-success-soft text-success-strong"
                            : "bg-slate-100 text-text-muted"
                        }
                      >
                        {p.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-slate-50 hover:text-primary-500"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-error-soft hover:text-error-strong"
                          aria-label="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing ? (
        <ProductFormModal
          product={editing}
          categories={categories.filter((c) => c.active)}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={applyProduct}
          submitting={createProduct.isPending || updateProduct.isPending}
          error={saveError}
        />
      ) : null}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Nonaktifkan Produk"
        width="max-w-sm"
      >
        {confirmDelete ? (
          <div>
            <p className="text-sm text-text-secondary">
              Yakin ingin menonaktifkan <strong>{confirmDelete.name}</strong>? Produk ini tidak
              akan muncul pada transaksi baru, namun transaksi lama tetap tersimpan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                disabled={deleteProduct.isPending}
                onClick={() => {
                  deleteProduct.mutate(confirmDelete.id, {
                    onSuccess: () => setConfirmDelete(null),
                  });
                }}
              >
                Nonaktifkan
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      </>}
    </div>
  );
}

const EMOJIS = [
  "🍽️", "🍛", "🍜", "🍗", "🍤", "🐟", "🥩", "🍔",
  "🍕", "🥪", "🥗", "🥟", "🍲", "🍳", "🍞", "🥐",
  "🍟", "🌮", "🍖", "🌭", "🍍", "🥑", "🥦", "🥜",
  "☕", "🧋", "🥤", "🍹", "🍺", "🍵", "🥛", "🧃",
];

function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? EMOJIS : EMOJIS.slice(0, 16);
  return (
    <div>
      <Label className="mb-1.5">Ikon</Label>
      <div className="relative">
        <Input
          className="h-10 pr-14 text-center text-xl"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Ikon produk"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg">
          {value}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-8 gap-1">
        {visible.map((e) => (
          <button
            type="button"
            key={e}
            onClick={() => onChange(e)}
            className={cn(
              "flex h-9 items-center justify-center rounded-md text-lg transition-colors duration-100",
              value === e ? "bg-primary-500" : "bg-surface-secondary hover:bg-primary-50",
            )}
            aria-label={`Pilih ikon ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      {EMOJIS.length > 16 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1.5 text-xs font-medium text-primary-600 hover:underline"
        >
          {showAll ? "Lihat lebih sedikit" : "Lihat semua ikon"}
        </button>
      ) : null}
    </div>
  );
}

function ProductFormModal({
  product,
  categories,
  open,
  onClose,
  onSave,
  submitting = false,
  error = null,
}: {
  product: Product;
  categories: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
  onSave: (p: Product) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: product,
  });

  const upload = useUploadImage();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onPickImage = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await upload.mutateAsync({ bucket: "product-images", file });
      setValue("image", url, { shouldValidate: true });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: "optionGroups",
  });

  const onSubmit = (data: Product) => onSave(data);

  return (
    <Modal open={open} onClose={onClose} title="Form Produk" width="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>Nama Produk</Label>
            <Input
              {...register("name")}
              placeholder="Contoh: Nasi Goreng"
            />
            <FormFieldError message={errors.name?.message} />
          </div>
          <EmojiPicker
            value={watch("emoji") ?? "🍽️"}
            onChange={(emoji) => setValue("emoji", emoji, { shouldValidate: true })}
          />
        </div>

        <div>
          <Label className="mb-1.5">Gambar Produk (opsional)</Label>
          <div className="flex items-center gap-3">
            {watch("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={watch("image")}
                alt=""
                className="h-14 w-14 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface-secondary text-2xl">
                {watch("emoji") ?? "🍽️"}
              </div>
            )}
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onPickImage(file);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm font-medium text-text-primary hover:bg-surface-secondary">
                <Plus size={14} />
                {uploading ? "Mengunggah…" : watch("image") ? "Ganti" : "Unggah"}
              </span>
            </label>
            {watch("image") ? (
              <button
                type="button"
                onClick={() => setValue("image", "")}
                className="text-xs font-medium text-error-strong hover:underline"
              >
                Hapus
              </button>
            ) : null}
          </div>
          {uploadError ? (
            <p className="mt-1 text-xs font-medium text-error-strong">{uploadError}</p>
          ) : null}
        </div>

        <div>
          <Label>Deskripsi</Label>
          <Textarea
            {...register("description")}
            placeholder="Deskripsi singkat produk"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Kategori</Label>
            <Select {...register("categoryId")}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FormFieldError message={errors.categoryId?.message} />
          </div>
          <div>
            <Label>Status Produk</Label>
            <div className="flex h-10 items-center">
              <Toggle
                checked={watch("active")}
                onChange={(active) => setValue("active", active, { shouldValidate: true })}
                label={watch("active") ? "Aktif" : "Nonaktif"}
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Ketersediaan & Harga</Label>
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle
                checked={watch("dineInAvailable")}
                onChange={(dineInAvailable) =>
                  setValue("dineInAvailable", dineInAvailable, { shouldValidate: true })
                }
                label="Tersedia dine-in"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Harga dine-in</span>
                <Input
                  type="number"
                  className="w-32"
                  disabled={!watch("dineInAvailable")}
                  {...register("dineInPrice", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle
                checked={watch("takeawayAvailable")}
                onChange={(takeawayAvailable) =>
                  setValue("takeawayAvailable", takeawayAvailable, { shouldValidate: true })
                }
                label="Tersedia takeaway"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Harga takeaway</span>
                <Input
                  type="number"
                  className="w-32"
                  disabled={!watch("takeawayAvailable")}
                  {...register("takeawayPrice", { valueAsNumber: true })}
                />
              </div>
            </div>
            <FormFieldError message={errors.dineInAvailable?.message} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Product Options</Label>
            <button
              type="button"
              onClick={() =>
                appendGroup({
                  id: uid(),
                  name: "Opsi baru",
                  multiple: false,
                  options: [{ id: uid(), name: "Pilihan", additionalPrice: 0 }],
                })
              }
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus size={14} />
              Tambah grup
            </button>
          </div>
          <p className="mb-2 text-xs text-text-muted">
            Semua opsi bersifat optional dan dapat dikenakan biaya tambahan.
          </p>

          {groupFields.length === 0 ? (
            <p className="rounded-lg bg-surface-secondary px-3 py-2.5 text-xs text-text-muted">
              Belum ada grup opsi.
            </p>
          ) : (
            <div className="space-y-3">
              {groupFields.map((group, groupIndex) => (
                <OptionGroupCard
                  key={group.id}
                  groupIndex={groupIndex}
                  control={control}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  onRemoveGroup={() => removeGroup(groupIndex)}
                />
              ))}
            </div>
          )}
        </div>

        <FormFieldError message={errors.optionGroups?.message} />

        {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan…" : "Simpan Produk"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function OptionGroupCard({
  groupIndex,
  control,
  register,
  watch,
  setValue,
  onRemoveGroup,
}: {
  groupIndex: number;
  control: ReturnType<typeof useForm<Product>>["control"];
  register: ReturnType<typeof useForm<Product>>["register"];
  watch: ReturnType<typeof useForm<Product>>["watch"];
  setValue: ReturnType<typeof useForm<Product>>["setValue"];
  onRemoveGroup: () => void;
}) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `optionGroups.${groupIndex}.options`,
  });

  const groupName = watch(`optionGroups.${groupIndex}.name`);
  const isMultiple = watch(`optionGroups.${groupIndex}.multiple`);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Input
          className="h-8"
          {...register(`optionGroups.${groupIndex}.name`)}
        />
        <button
          type="button"
          onClick={() =>
            setValue(
              `optionGroups.${groupIndex}.multiple`,
              !isMultiple,
              { shouldValidate: true },
            )
          }
          className={cn(
            "shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
            isMultiple
              ? "border-primary-500 bg-primary-50 text-primary-600"
              : "border-border text-text-muted hover:bg-surface-secondary",
          )}
        >
          {isMultiple ? "Multi" : "Single"}
        </button>
        <button
          type="button"
          onClick={onRemoveGroup}
          className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-error-soft hover:text-error-strong"
          aria-label="Hapus grup"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {optionFields.map((opt, optionIndex) => (
          <div key={opt.id} className="flex items-center gap-2">
            <Input
              className="h-8 flex-1"
              {...register(`optionGroups.${groupIndex}.options.${optionIndex}.name`)}
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-muted">+Rp</span>
              <Input
                type="number"
                className="h-8 w-24"
                {...register(`optionGroups.${groupIndex}.options.${optionIndex}.additionalPrice`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeOption(optionIndex)}
              className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-error-soft hover:text-error-strong"
              aria-label="Hapus opsi"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            appendOption({ id: uid(), name: "Pilihan baru", additionalPrice: 0 })
          }
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus size={12} />
          Tambah pilihan
        </button>
      </div>
    </div>
  );
}
