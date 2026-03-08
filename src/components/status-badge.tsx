const dotColors: Record<string, string> = {
  active: '#22c55e',
  lead: '#ca8a04',
  dormant: '#a1a1aa',
  closed: '#a1a1aa',
};

export function StatusDot({ status, size = 6 }: { status: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: dotColors[status] || '#a1a1aa',
      }}
    />
  );
}

// Keep old export name for compatibility but redirect
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot status={status} />
      <span
        className="text-[11px] capitalize"
        style={{ color: 'var(--fg-muted)' }}
      >
        {status}
      </span>
    </span>
  );
}
