'use client';

import { useState, useRef, useEffect } from 'react';
import { type Table } from '@tanstack/react-table';
import { Settings2, Check } from 'lucide-react';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const columns = table
    .getAllColumns()
    .filter((col) => col.getCanHide());

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          height: 34,
          padding: '0 10px',
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 6,
          border: '1px solid var(--border-med)',
          background: 'var(--bg)',
          color: 'var(--fg)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Settings2 size={13} />
        Columns
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            minWidth: 160,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow)',
            padding: '4px 0',
            zIndex: 50,
          }}
        >
          {columns.map((column) => {
            const isVisible = column.getIsVisible();
            return (
              <button
                key={column.id}
                onClick={() => column.toggleVisibility(!isVisible)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 12px',
                  fontSize: 12,
                  color: 'var(--fg)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-subtle)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'none')
                }
              >
                <div
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 3,
                    border: '1px solid var(--border-med)',
                    background: isVisible ? 'var(--fg)' : 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isVisible && (
                    <Check size={10} style={{ color: 'var(--bg)' }} />
                  )}
                </div>
                <span style={{ textTransform: 'capitalize' }}>
                  {column.id.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
