'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  onClose: () => void;
};

const MAPPABLE_COLUMNS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company_name',
  'role',
  'source',
  'linkedin_url',
  'notes',
  'skip',
] as const;

const COLUMN_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  company_name: 'Company',
  role: 'Role',
  source: 'Source',
  linkedin_url: 'LinkedIn URL',
  notes: 'Notes',
  skip: '-- Skip --',
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some((cell) => cell !== '')) rows.push(row);
        row = [];
        current = '';
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function autoDetectMapping(headers: string[]): string[] {
  const map: Record<string, string> = {
    first_name: 'first_name',
    firstname: 'first_name',
    'first name': 'first_name',
    first: 'first_name',
    last_name: 'last_name',
    lastname: 'last_name',
    'last name': 'last_name',
    last: 'last_name',
    email: 'email',
    'email address': 'email',
    phone: 'phone',
    telephone: 'phone',
    mobile: 'phone',
    company: 'company_name',
    company_name: 'company_name',
    'company name': 'company_name',
    organization: 'company_name',
    role: 'role',
    title: 'role',
    'job title': 'role',
    position: 'role',
    source: 'source',
    linkedin: 'linkedin_url',
    linkedin_url: 'linkedin_url',
    'linkedin url': 'linkedin_url',
    notes: 'notes',
    note: 'notes',
  };
  return headers.map((h) => map[h.toLowerCase().trim()] || 'skip');
}

const inputStyle: React.CSSProperties = {
  height: 32,
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '0 10px',
  fontSize: 13,
  color: 'var(--fg)',
  width: '100%',
};

export function CSVImportModal({ onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) return;
      const hdrs = parsed[0];
      setHeaders(hdrs);
      setRows(parsed.slice(1));
      setMapping(autoDetectMapping(hdrs));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    let success = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const record: Record<string, string | null> = {
        first_name: '',
        last_name: null,
        email: null,
        phone: null,
        company_name: null,
        company_id: null,
        role: null,
        linkedin_url: null,
        source: null,
        notes: null,
        status: 'lead',
        follow_up_date: null,
        last_contacted_at: null,
      };

      for (let j = 0; j < mapping.length; j++) {
        const col = mapping[j];
        if (col !== 'skip' && row[j]) {
          record[col] = row[j];
        }
      }

      if (!record.first_name) {
        errors++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }

      try {
        const { error } = await supabase.from('contacts').insert(record);
        if (error) {
          errors++;
        } else {
          success++;
        }
      } catch {
        errors++;
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setResult({ success, errors });
    setImporting(false);
    qc.invalidateQueries({ queryKey: ['contacts'] });
  };

  const updateMapping = (index: number, value: string) => {
    setMapping((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full overflow-y-auto"
        style={{
          maxWidth: 560,
          maxHeight: '90vh',
          background: 'var(--bg)',
          borderRadius: 10,
          boxShadow: '0 25px 50px rgba(0,0,0,.15)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>
            Import CSV
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded"
            style={{ width: 28, height: 28, color: 'var(--fg-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {rows.length === 0 ? (
            /* Drop zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center cursor-pointer"
              style={{
                height: 160,
                border: `2px dashed ${dragging ? 'var(--fg-muted)' : 'var(--border-med)'}`,
                borderRadius: 8,
                background: dragging ? 'var(--bg-muted)' : 'var(--bg-subtle)',
              }}
            >
              <Upload size={24} style={{ color: 'var(--fg-faint)', marginBottom: 8 }} />
              <div className="text-[13px] font-medium" style={{ color: 'var(--fg-muted)' }}>
                Drop CSV file here or click to browse
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--fg-faint)' }}>
                .csv files supported
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : result ? (
            /* Result */
            <div className="text-center py-6">
              <div className="text-[16px] font-bold mb-2" style={{ color: 'var(--fg)' }}>
                Import Complete
              </div>
              <div className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                <span style={{ color: '#22c55e' }}>{result.success} imported</span>
                {result.errors > 0 && (
                  <span style={{ color: '#ef4444' }}> &middot; {result.errors} failed</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-4 rounded-md text-[13px] font-medium"
                style={{
                  height: 32,
                  padding: '0 14px',
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Column mapping */}
              <div className="mb-4">
                <div
                  className="text-[10px] uppercase font-medium mb-2"
                  style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
                >
                  Column Mapping
                </div>
                <div className="space-y-1.5">
                  {headers.map((header, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="text-[12px] truncate"
                        style={{ width: 120, color: 'var(--fg-muted)' }}
                      >
                        {header}
                      </span>
                      <span className="text-[12px]" style={{ color: 'var(--fg-faint)' }}>
                        &rarr;
                      </span>
                      <select
                        value={mapping[i] || 'skip'}
                        onChange={(e) => updateMapping(i, e.target.value)}
                        style={{ ...inputStyle, flex: 1, appearance: 'auto' as never }}
                      >
                        {MAPPABLE_COLUMNS.map((col) => (
                          <option key={col} value={col}>
                            {COLUMN_LABELS[col]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-4">
                <div
                  className="text-[10px] uppercase font-medium mb-2"
                  style={{ letterSpacing: '0.6px', color: 'var(--fg-faint)' }}
                >
                  Preview ({Math.min(5, rows.length)} of {rows.length} rows)
                </div>
                <div
                  className="overflow-x-auto"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)' }}>
                        {headers.map((h, i) => (
                          <th
                            key={i}
                            className="text-left font-medium px-2 py-1"
                            style={{
                              color: 'var(--fg-faint)',
                              borderBottom: '1px solid var(--border)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="px-2 py-1 truncate"
                              style={{
                                color: 'var(--fg-muted)',
                                borderBottom: '1px solid var(--border)',
                                maxWidth: 120,
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import progress */}
              {importing && (
                <div className="mb-3">
                  <div
                    className="rounded-full overflow-hidden"
                    style={{ height: 4, background: 'var(--bg-muted)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: 'var(--fg)' }}
                    />
                  </div>
                  <div className="text-[11px] mt-1 text-center" style={{ color: 'var(--fg-faint)' }}>
                    {progress}%
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setRows([]);
                    setHeaders([]);
                    setMapping([]);
                  }}
                  className="text-[12px]"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  Choose different file
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="rounded-md text-[13px] font-medium"
                    style={{
                      height: 32,
                      padding: '0 14px',
                      border: '1px solid var(--border-med)',
                      background: 'var(--bg)',
                      color: 'var(--fg)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !mapping.includes('first_name')}
                    className="rounded-md text-[13px] font-medium disabled:opacity-50"
                    style={{
                      height: 32,
                      padding: '0 14px',
                      background: 'var(--fg)',
                      color: 'var(--bg)',
                    }}
                  >
                    {importing ? `Importing... ${progress}%` : `Import ${rows.length} contacts`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
