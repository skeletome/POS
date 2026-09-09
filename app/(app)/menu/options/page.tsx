"use client";

import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, CardHeader, EmptyState, FormFieldError, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useUpdateProduct } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";
import { optionGroupSchema, type OptionGroup } from "@/lib/schemas/product";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

interface OptionsFormValues {
  optionGroups: OptionGroup[];
}

export default function OptionsPage() {
  const products = usePosStore((s) => s.products);

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const product = products.find((p) => p.id === productId);
  const updateProduct = useUpdateProduct(product?.id ?? "");

  const saveGroups = (productId: string, groups: OptionGroup[]) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setSaveError(null);
    updateProduct.mutate(
      { ...p, optionGroups: groups },
      { onError: (e) => setSaveError(e.message) },
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Product Options</h2>
        <p className="text-sm text-text-muted">
          Kelola grup opsi dan pilihan tambahan per produk (semua opsi bersifat optional).
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader title="Pilih Produk" description="Pilih produk yang ingin diatur opsi-opsinya." />
        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Pilih produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Card>

      {product ? (
        <>
          <OptionsForm
            key={product.id}
            product={product}
            onSave={(groups) => saveGroups(product.id, groups)}
            submitting={updateProduct.isPending}
            error={saveError}
          />
        </>
      ) : (
        <Card className="max-w-2xl">
          <EmptyState
            icon={<SlidersHorizontal size={20} />}
            title="Pilih sebuah produk"
            description="Pilih produk dari daftar di atas untuk mengelola opsinya."
          />
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardHeader title="Struktur Opsi" description="Contoh struktur opsi pada PRD." />
        <div className="rounded-lg bg-surface-secondary p-4 font-mono text-xs text-text-secondary">
          <p>Produk</p>
          <p className="pl-4">├── Grup Opsi</p>
          <p className="pl-8">├── Pilihan +Rp0</p>
          <p className="pl-8">└── Pilihan +Rp5.000</p>
        </div>
      </Card>
    </div>
  );
}

function OptionsForm({
  product,
  onSave,
  submitting = false,
  error = null,
}: {
  product: { id: string; name: string; optionGroups: OptionGroup[] };
  onSave: (groups: OptionGroup[]) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const optionsSchema = z.object({
    optionGroups: optionGroupSchema.array(),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OptionsFormValues>({
    resolver: zodResolver(optionsSchema),
    defaultValues: { optionGroups: product.optionGroups },
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: "optionGroups",
  });

  const onSubmit = (data: OptionsFormValues) => onSave(data.optionGroups);

  return (
    <Card className="max-w-2xl">
      <CardHeader
        title={`Opsi — ${product.name}`}
        description="Grup opsi tersusun: Produk → Grup Opsi → Pilihan."
        action={
          <Button
            size="sm"
            type="button"
            onClick={() =>
              appendGroup({
                id: uid(),
                name: "Grup baru",
                multiple: false,
                options: [{ id: uid(), name: "Pilihan", additionalPrice: 0 }],
              })
            }
          >
            <Plus size={14} />
            Tambah Grup
          </Button>
        }
      />

      {groupFields.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal size={20} />}
          title="Belum ada grup opsi"
          description="Tambahkan grup opsi agar kasir dapat melakukan customisasi produk."
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <FormFieldError message={errors.optionGroups?.message} />
          {error ? <p className="text-xs font-medium text-error-strong">{error}</p> : null}
          <div className="border-t border-border pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan…" : "Simpan Opsi"}
            </Button>
          </div>
        </form>
      )}
    </Card>
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
  control: ReturnType<typeof useForm<OptionsFormValues>>["control"];
  register: ReturnType<typeof useForm<OptionsFormValues>>["register"];
  watch: ReturnType<typeof useForm<OptionsFormValues>>["watch"];
  setValue: ReturnType<typeof useForm<OptionsFormValues>>["setValue"];
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

  const isMultiple = watch(`optionGroups.${groupIndex}.multiple`);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Input
          className="h-8 flex-1"
          {...register(`optionGroups.${groupIndex}.name`)}
        />
        <button
          type="button"
          onClick={() =>
            setValue(`optionGroups.${groupIndex}.multiple`, !isMultiple, { shouldValidate: true })
          }
          className={cn(
            "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            isMultiple
              ? "border-primary-500 bg-primary-50 text-primary-600"
              : "border-border text-text-muted hover:bg-surface-secondary",
          )}
        >
          {isMultiple ? "Multi-pilih" : "Single-pilih"}
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
              aria-label="Hapus pilihan"
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
