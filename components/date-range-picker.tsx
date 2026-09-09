"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CustomRange } from "@/lib/date-range";

/**
 * Picker tanggal tunggal (mode single).
 *
 * Memakai satu kalender yang hanya memilih SATU tanggal — lebih stabil
 * daripada mode range yang buggy. Nilai disimpan sebagai string "yyyy-MM-dd".
 */
function SingleDatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
}: {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  const displayText = selected
    ? format(selected, "dd MMM yyyy", { locale: idLocale })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start gap-2 text-left font-normal cursor-pointer",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0" />
        <span className="truncate">{displayText}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          required
          defaultMonth={selected}
          selected={selected}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Label kecil di samping picker tanggal (mis. "Dari" / "Sampai"). */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-text-muted">{children}</span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <SingleDatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

/**
 * Picker rentang custom untuk Dashboard.
 *
 * Dipecah menjadi DUA datepicker terpisah ("Dari" & "Sampai") agar tidak
 * pakai mode range yang buggy. `onChange` langsung dipanggil setiap salah
 * satu sisi berubah; sisi yang belum dipilih dikirim sebagai string kosong.
 */
export function CustomRangePicker({
  value,
  onChange,
}: {
  value: CustomRange | null;
  onChange: (r: CustomRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field
        label="Dari"
        value={value?.from || null}
        onChange={(from) => onChange({ from, to: value?.to || "" })}
        placeholder="Tanggal mulai"
      />
      <Field
        label="Sampai"
        value={value?.to || null}
        onChange={(to) => onChange({ from: value?.from || "", to })}
        placeholder="Tanggal akhir"
      />
    </div>
  );
}

/**
 * Picker rentang custom untuk halaman Reports.
 *
 * Juga dipecah menjadi DUA datepicker terpisah (mode single). Sama seperti
 * CustomRangePicker, onChange langsung dipanggil per perubahan satu sisi.
 */
export function DateRangePickerInline({
  value,
  onChange,
  className,
}: {
  value: { from: string; to: string } | null;
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-2", className)}>
      <Field
        label="Dari"
        value={value?.from || null}
        onChange={(from) => onChange({ from, to: value?.to || "" })}
        placeholder="Tanggal mulai"
      />
      <Field
        label="Sampai"
        value={value?.to || null}
        onChange={(to) => onChange({ from: value?.from || "", to })}
        placeholder="Tanggal akhir"
      />
    </div>
  );
}
