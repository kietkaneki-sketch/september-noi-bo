const STYLES = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  inactive: 'bg-zinc-500/15 text-zinc-500',
}

const LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  active: 'Đang làm việc',
  inactive: 'Đã khóa',
}

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] || 'bg-zinc-500/15 text-zinc-500'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || LABELS[status] || status}
    </span>
  )
}
