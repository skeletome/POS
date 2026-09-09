"use client";

import { Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Toggle } from "@/components/toggle";
import { Badge, Button, Card, CardHeader, EmptyState, FormFieldError, Input, Label } from "@/components/ui";
import { CashiersSkeleton } from "@/components/skeletons";
import { useCreateCashier, useUpdateCashier } from "@/lib/api/hooks";
import { usePosStore } from "@/lib/use-pos-store";
import { cashierCreateSchema } from "@/lib/schemas/cashier";

const cashierFormSchema = cashierCreateSchema.extend({
  password: z.string().min(6, "Password minimal 6 karakter"),
});
type CashierForm = z.infer<typeof cashierFormSchema>;

export default function CashiersPage() {
  const user = usePosStore((s) => s.user);
  const cashiers = usePosStore((s) => s.cashiers);
  const updateCashier = useUpdateCashier();
  const dataLoaded = usePosStore((s) => s.dataLoaded);

  if (user?.role !== "OWNER") {
    return (
      <Card>
        <EmptyState
          icon={<UserRound size={20} />}
          title="Akses dibatasi"
          description="Hanya Owner yang dapat mengelola kasir."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {!dataLoaded ? <CashiersSkeleton /> : <>
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Kasir</h2>
        <p className="text-sm text-text-muted">Kelola akun kasir yang dapat menggunakan POS.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Tambah Kasir" description="Kasir baru langsung dapat login dengan email & password." />
          <CashierCreateForm existingEmails={cashiers.map((c) => c.email)} />
        </Card>

        <Card>
          <CardHeader
            title={`${cashiers.length} kasir`}
            description="Kasir inactive tidak dapat login atau beroperasi."
          />
          {cashiers.length === 0 ? (
            <EmptyState icon={<UserRound size={20} />} title="Belum ada kasir" />
          ) : (
            <div className="divide-y divide-border-light">
              {cashiers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="truncate text-xs text-text-muted">{c.email}</p>
                  </div>
                  <Badge
                    className={
                      c.active ? "bg-success-soft text-success-strong" : "bg-slate-100 text-text-muted"
                    }
                  >
                    {c.active ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <Toggle checked={c.active} onChange={(v) => updateCashier.mutate({ id: c.id, active: v })} />
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-border pt-3 text-[11px] text-text-muted">
            Login demo oleh: {user?.name} ({user?.role})
          </p>
        </Card>
      </div>
      </>}
    </div>
  );
}

function CashierCreateForm({ existingEmails }: { existingEmails: string[] }) {
  const createCashier = useCreateCashier();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CashierForm>({
    resolver: zodResolver(cashierFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onValid = (data: CashierForm) => {
    if (existingEmails.some((e) => e.toLowerCase() === data.email.trim().toLowerCase())) {
      setError("email", { message: "Email sudah terdaftar" });
      return;
    }
    setServerError(null);
    createCashier.mutate(
      { name: data.name.trim(), email: data.email.trim(), password: data.password },
      {
        onSuccess: () => {
          reset();
        },
        onError: (e) => {
          const err = e as Error & { code?: string };
          if (err.code === "EMAIL_EXISTS" || err.message.toLowerCase().includes("email")) {
            setError("email", { message: err.message });
          } else {
            setServerError(err.message);
          }
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-3">
      <div>
        <Label>Nama</Label>
        <Input placeholder="Nama kasir" {...register("name")} />
        <FormFieldError message={errors.name?.message} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" placeholder="kasir@tokokita.id" {...register("email")} />
        <FormFieldError message={errors.email?.message} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" placeholder="Minimal 6 karakter" {...register("password")} />
        <FormFieldError message={errors.password?.message} />
      </div>
      {serverError && !errors.password?.message ? (
        <p className="text-xs font-medium text-error-strong">{serverError}</p>
      ) : null}
      <Button type="submit" disabled={createCashier.isPending}>
        {createCashier.isPending ? (
          "Menambah…"
        ) : (
          <>
            <Plus size={16} />
            Tambah Kasir
          </>
        )}
      </Button>
    </form>
  );
}
