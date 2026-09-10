"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toggle } from "@/components/toggle";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  FormFieldError,
  Input,
  Modal,
} from "@/components/ui";
import { CategoriesSkeleton } from "@/components/skeletons";
import { DataTable } from "@/components/data-table";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";
import { categoryCreateSchema, categorySchema, type Category } from "@/lib/schemas/category";
import type { ColumnDef } from "@tanstack/react-table";

export default function CategoriesPage() {
  const categories = usePosStore((s) => s.categories);
  const dataLoaded = usePosStore((s) => s.dataLoaded);
  const [editing, setEditing] = useState<Category | null>(null);

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory(editing?.id ?? "");
  const deleteCat = useDeleteCategory();

  const columns: ColumnDef<Category, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-text-primary">{row.original.name}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "active",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          className={
            row.original.active
              ? "bg-success-soft text-success-strong"
              : "bg-slate-100 text-text-muted"
          }
        >
          {row.original.active ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing(row.original)}
            className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-slate-50 hover:text-primary-500"
            aria-label="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => deleteCat.mutate(row.original.id)}
            disabled={deleteCat.isPending}
            className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-error-soft hover:text-error-strong disabled:opacity-50"
            aria-label="Nonaktifkan"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {!dataLoaded ? <CategoriesSkeleton /> : <>
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Kategori</h2>
        <p className="text-sm text-text-muted">Kategori digunakan untuk memfilter produk pada POS.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader title="Tambah Kategori" description="Kategori baru langsung tersedia pada filter POS." />
        <CategoryCreateForm onSubmit={(name) => createCat.mutate({ name })} />
      </Card>

      <Card className="max-w-xl">
        <CardHeader
          title={`${categories.length} kategori`}
          description="Kategori inactive tidak muncul pada filter POS."
        />
        <DataTable
          columns={columns}
          data={categories}
          initialSorting={[{ id: "name", desc: false }]}
          searchPlaceholder="Cari kategori…"
          emptyTitle="Belum ada kategori"
        />
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Ubah Kategori" width="max-w-sm">
        {editing ? (
          <CategoryEditForm
            key={editing.id}
            category={editing}
            onSave={(name, active) => {
              updateCat.mutate({ name, active }, { onSuccess: () => setEditing(null) });
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>
      </>}
    </div>
  );
}

function CategoryCreateForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string }>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { name: "" },
  });

  const onValid = (data: { name: string }) => {
    onSubmit(data.name.trim());
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input placeholder="Nama kategori baru…" {...register("name")} />
        <Button type="submit">
          <Plus size={16} />
          Tambah
        </Button>
      </div>
      <FormFieldError message={errors.name?.message} />
    </form>
  );
}

function CategoryEditForm({
  category,
  onSave,
  onCancel,
}: {
  category: Category;
  onSave: (name: string, active: boolean) => void;
  onCancel: () => void;
}) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: category,
  });

  return (
    <form onSubmit={handleSubmit((data) => onSave(data.name.trim(), data.active))}>
      <Input {...register("name")} />
      <FormFieldError message={errors.name?.message} />
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-text-secondary">Status:</span>
        <Toggle
          checked={watch("active")}
          onChange={(active) => setValue("active", active, { shouldValidate: true })}
          label={watch("active") ? "Aktif" : "Nonaktif"}
        />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Batal
        </Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  );
}
