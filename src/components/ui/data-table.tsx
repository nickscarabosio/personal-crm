'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTablePagination } from './data-table-pagination';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchValue?: string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  enablePagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchValue,
  onRowClick,
  pageSize = 25,
  enablePagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchValue,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: () => {},
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--bg)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{
                  height: 34,
                  background: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      padding: '0 12px',
                      textAlign: 'left',
                      fontWeight: 500,
                      fontSize: 11,
                      verticalAlign: 'middle',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px 0',
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--fg-faint)',
                  }}
                >
                  No results found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  style={{
                    minHeight: 48,
                    borderBottom: '1px solid var(--border)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    background: row.getIsSelected()
                      ? 'var(--bg-muted)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!row.getIsSelected()) {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!row.getIsSelected()) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px 12px',
                        verticalAlign: 'middle',
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {enablePagination && <DataTablePagination table={table} />}
      </div>
      {/* Expose table instance for external use */}
      <DataTableContext table={table} />
    </div>
  );
}

// Hidden component to expose table via ref pattern
function DataTableContext<TData>({ table: _table }: { table: ReturnType<typeof useReactTable<TData>> }) {
  return null;
}

// Also export a hook-style version for when you need more control
export function useDataTable() {
  // This is a placeholder - the table is managed internally
  return null;
}

// Re-export the table type for external use
export type { RowSelectionState };

// Extended DataTable that exposes selection state
interface DataTableWithSelectionProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchValue?: string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  enablePagination?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTableWithSelection<TData, TValue>({
  columns,
  data,
  searchValue,
  onRowClick,
  pageSize = 25,
  enablePagination = true,
  onSelectionChange,
}: DataTableWithSelectionProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchValue,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      // Notify parent of selected rows
      if (onSelectionChange) {
        const selectedIndices = Object.keys(newSelection).filter(
          (k) => newSelection[k]
        );
        const selectedRows = selectedIndices
          .map((idx) => data[Number(idx)])
          .filter(Boolean);
        onSelectionChange(selectedRows);
      }
    },
    onGlobalFilterChange: () => {},
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--bg)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{
                  height: 34,
                  background: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      padding: '0 12px',
                      textAlign: 'left',
                      fontWeight: 500,
                      fontSize: 11,
                      verticalAlign: 'middle',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px 0',
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--fg-faint)',
                  }}
                >
                  No results found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  style={{
                    minHeight: 48,
                    borderBottom: '1px solid var(--border)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    background: row.getIsSelected()
                      ? 'var(--bg-muted)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!row.getIsSelected()) {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!row.getIsSelected()) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px 12px',
                        verticalAlign: 'middle',
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {enablePagination && <DataTablePagination table={table} />}
      </div>
      {selectedCount > 0 && (
        <div
          style={{
            display: 'none', // Hidden slot for parent to read
          }}
          data-selected-count={selectedCount}
        />
      )}
      <DataTableSelectionExposer
        table={table}
        onSelectionChange={onSelectionChange}
        data={data}
      />
    </div>
  );
}

function DataTableSelectionExposer<TData>({
  table: _table,
  onSelectionChange: _onSelectionChange,
  data: _data,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  onSelectionChange?: (selectedRows: TData[]) => void;
  data: TData[];
}) {
  return null;
}
