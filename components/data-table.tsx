"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button, EmptyState, Input } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 font-medium text-text-primary hover:text-primary-500",
        className,
      )}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp size={14} className="text-primary-500" />
      ) : sorted === "desc" ? (
        <ArrowDown size={14} className="text-primary-500" />
      ) : (
        <ArrowUpDown size={14} className="opacity-40" />
      )}
    </button>
  );
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  fetching?: boolean;
  toolbar?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  controlledSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  defaultPageSize?: number;
  initialSorting?: SortingState;
  manualPagination?: boolean;
  rowCount?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  resetKey?: unknown;
  manualSorting?: boolean;
  onSortingChange?: (sorting: SortingState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  fetching = false,
  toolbar,
  searchable = true,
  searchPlaceholder = "Cari...",
  searchValue,
  onSearchChange,
  emptyTitle = "Tidak ada data",
  emptyDescription = "Data akan muncul di sini ketika tersedia.",
  emptyIcon,
  defaultPageSize = 30,
  initialSorting = [],
  manualPagination = false,
  rowCount,
  onPaginationChange,
  resetKey,
  manualSorting = false,
  onSortingChange,
}: DataTableProps<TData, TValue>) {
  const controlledSearch =
    searchValue !== undefined && onSearchChange !== undefined;

  const [internalSearch, setInternalSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const setGlobalFilter = (value: string) => {
    if (controlledSearch) {
      onSearchChange(value);
    } else {
      setInternalSearch(value);
    }
  };

  const globalFilter = controlledSearch ? searchValue : internalSearch;
  const pageCount = manualPagination
    ? rowCount !== undefined
      ? Math.max(1, Math.ceil(rowCount / pagination.pageSize))
      : undefined
    : undefined;

  const previousPagination = useRef(pagination);

  useEffect(() => {
    if (!manualPagination) return;
    const prev = previousPagination.current;
    if (prev.pageIndex === pagination.pageIndex && prev.pageSize === pagination.pageSize)
      return;
    previousPagination.current = pagination;
    onPaginationChange?.(pagination.pageIndex, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualPagination, pagination]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
  }, [resetKey]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    pageCount,
    autoResetPageIndex: !manualPagination,
    onSortingChange: (updater) => {
      setSorting(updater);
      if (manualSorting) {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        onSortingChange?.(next);
        setPagination((p) => ({ ...p, pageIndex: 0 }));
      }
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    ...(manualPagination
      ? {}
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getSortedRowModel: getSortedRowModel(),
        }),
  });

  const rows = table.getRowModel().rows;
  const totalPages = pageCount ?? table.getPageCount();
  const filteredCount = manualPagination
    ? (rowCount ?? rows.length)
    : table.getFilteredRowModel().rows.length;
  const startRow = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredCount);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {searchable ? (
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full pr-3 pl-9 lg:w-56"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-text-muted"
                >
                  <Loader2 size={20} className="mx-auto animate-spin text-primary-500" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    icon={emptyIcon ?? <Inbox size={20} />}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {manualPagination && fetching && !loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60">
            <Loader2 size={20} className="animate-spin text-primary-500" />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {filteredCount === 0
            ? "0 baris"
            : `Menampilkan ${startRow}–${endRow} dari ${filteredCount}`}
          {fetching ? " · Memuat…" : ""}
        </p>
        {totalPages > 1 ? (
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <div className="flex items-center rounded-lg border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="px-2 text-xs text-text-muted">
                {Math.max(pagination.pageIndex + 1, 1)} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}