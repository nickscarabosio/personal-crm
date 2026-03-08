'use client';

import { type Table } from '@tanstack/react-table';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

const btnBase: React.CSSProperties = {
  height: 30,
  minWidth: 30,
  padding: '0 8px',
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid var(--border-med)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'default',
};

const btnActive: React.CSSProperties = {
  background: 'var(--fg)',
  color: 'var(--bg)',
  borderColor: 'var(--fg)',
};

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;
  const pageSize = table.getState().pagination.pageSize;

  if (totalCount === 0) return null;

  const pages = getPageNumbers(pageIndex + 1, pageCount);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {/* Left: selected count */}
      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
        {selectedCount > 0
          ? `${selectedCount} of ${totalCount} row(s) selected`
          : `${totalCount} row(s)`}
      </div>

      {/* Center: page numbers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          style={{
            ...btnBase,
            ...((!table.getCanPreviousPage()) ? btnDisabled : {}),
          }}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`e${i}`}
              style={{ fontSize: 12, color: 'var(--fg-faint)', padding: '0 4px' }}
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              style={{
                ...btnBase,
                ...(pageIndex + 1 === p ? btnActive : {}),
              }}
              onClick={() => table.setPageIndex(p - 1)}
            >
              {p}
            </button>
          )
        )}
        <button
          style={{
            ...btnBase,
            ...((!table.getCanNextPage()) ? btnDisabled : {}),
          }}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>

      {/* Right: page size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Rows</span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={{
            height: 30,
            padding: '0 6px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border-med)',
            background: 'var(--bg)',
            color: 'var(--fg)',
            cursor: 'pointer',
          }}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
