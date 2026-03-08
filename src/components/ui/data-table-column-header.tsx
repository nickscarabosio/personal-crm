'use client';

import { type Column } from '@tanstack/react-table';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: 'var(--fg-faint)',
        }}
      >
        {title}
      </span>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <button
      onClick={() => {
        if (!sorted) {
          column.toggleSorting(false);
        } else if (sorted === 'asc') {
          column.toggleSorting(true);
        } else {
          column.clearSorting();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--fg-faint)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {title}
      {sorted === 'asc' && <ArrowUp size={10} style={{ color: 'var(--fg)' }} />}
      {sorted === 'desc' && <ArrowDown size={10} style={{ color: 'var(--fg)' }} />}
    </button>
  );
}
