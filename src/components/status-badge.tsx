const statusColors: Record<string, string> = {
  lead: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  dormant: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] || statusColors.active
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
