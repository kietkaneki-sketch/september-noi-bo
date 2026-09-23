export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-2.5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {Icon && <Icon size={14} strokeWidth={2.25} />}
        {label}
      </div>
      <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>{value}</div>
      {hint && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
  )
}
