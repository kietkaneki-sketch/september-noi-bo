import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'

const DAY_LABELS = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN']

function startOfWeek(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(d, n) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export default function Schedule() {
  const { currentUser, data, addShift, deleteShift } = useApp()
  const isAdmin = currentUser.role === 'admin'
  const shiftTypes = data.shiftTypes
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [deptFilter, setDeptFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    date: toISO(new Date()),
    shiftType: shiftTypes[0]?.id,
    start: shiftTypes[0]?.start || '08:00',
    end: shiftTypes[0]?.end || '12:00',
    note: '',
  })

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const colorOf = (typeId) => shiftTypes.find((t) => t.id === typeId)?.color || '#a37a34'
  const labelOf = (typeId) => shiftTypes.find((t) => t.id === typeId)?.label || typeId

  const visibleUsers = useMemo(() => {
    let users = data.users.filter((u) => u.role === 'employee' && u.active)
    if (!isAdmin) users = users.filter((u) => u.id === currentUser.id)
    if (isAdmin && deptFilter !== 'all') users = users.filter((u) => u.department === deptFilter)
    return users
  }, [data.users, isAdmin, currentUser.id, deptFilter])

  const shiftsFor = (userId, dateISO) => data.shifts.filter((s) => s.userId === userId && s.date === dateISO)

  const openAddModal = (dateISO) => {
    const first = shiftTypes[0]
    setForm({ date: dateISO, shiftType: first?.id, start: first?.start || '08:00', end: first?.end || '12:00', note: '' })
    setModalOpen(true)
  }

  const handleShiftTypeChange = (typeId) => {
    const preset = shiftTypes.find((t) => t.id === typeId)
    setForm((f) => ({ ...f, shiftType: typeId, start: preset.start || f.start, end: preset.end || f.end }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addShift({ userId: currentUser.id, ...form })
      setModalOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const weekLabel = `${weekDates[0].toLocaleDateString('vi-VN')} – ${weekDates[6].toLocaleDateString('vi-VN')}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Lịch làm việc</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="p-2 hover:opacity-70" style={{ color: 'var(--text)' }} aria-label="Tuần trước">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="px-3 py-2 text-sm border-x" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              Hôm nay
            </button>
            <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="p-2 hover:opacity-70" style={{ color: 'var(--text)' }} aria-label="Tuần sau">
              <ChevronRight size={16} />
            </button>
          </div>
          {!isAdmin && (
            <button
              onClick={() => openAddModal(toISO(new Date()))}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              <Plus size={15} /> Đăng ký ca
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
          {['all', ...data.departments].map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
              style={{
                borderColor: deptFilter === d ? 'var(--accent)' : 'transparent',
                color: deptFilter === d ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              {d === 'all' ? 'Tất cả' : d}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border overflow-x-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th
                className="text-left p-3 text-xs font-semibold uppercase tracking-wide sticky left-0"
                style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}
              >
                Nhân viên
              </th>
              {weekDates.map((d) => {
                const isToday = toISO(d) === toISO(new Date())
                return (
                  <th key={d} className="p-3 text-center font-medium" style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
                    <div>{DAY_LABELS[(d.getDay() + 6) % 7]}</div>
                    <div className="text-xs font-normal">{d.getDate()}/{d.getMonth() + 1}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-3 sticky left-0" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: u.avatarColor }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{u.fullName}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.department}</div>
                    </div>
                  </div>
                </td>
                {weekDates.map((d) => {
                  const dateISO = toISO(d)
                  const shifts = shiftsFor(u.id, dateISO)
                  const canEdit = !isAdmin && u.id === currentUser.id
                  return (
                    <td key={dateISO} className="p-2 align-top text-center">
                      <div className="flex flex-col gap-1 items-stretch">
                        {shifts.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-md px-2 py-1 text-xs text-white flex items-center justify-between gap-1"
                            style={{ background: colorOf(s.shiftType) }}
                            title={s.note}
                          >
                            <span>{s.start}–{s.end}</span>
                            {canEdit && (
                              <button onClick={() => deleteShift(s.id).catch((err) => alert(err.message))} className="opacity-70 hover:opacity-100">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        {canEdit && (
                          <button
                            onClick={() => openAddModal(dateISO)}
                            className="rounded-md border border-dashed text-xs py-1 hover:opacity-70 flex items-center justify-center"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                          >
                            <Plus size={12} />
                          </button>
                        )}
                        {shifts.length === 0 && !canEdit && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Không có nhân viên nào trong bộ lọc này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
        {shiftTypes.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
            {t.label}
          </span>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Đăng ký ca làm"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hủy</button>
            <button onClick={handleSubmit} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>Lưu ca làm</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Ngày làm việc</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Loại ca</label>
            <div className="grid grid-cols-2 gap-2">
              {shiftTypes.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleShiftTypeChange(t.id)}
                  className="rounded-lg border px-3 py-2 text-sm text-left flex items-center gap-2"
                  style={{
                    borderColor: form.shiftType === t.id ? 'var(--accent)' : 'var(--border)',
                    background: form.shiftType === t.id ? 'var(--surface-2)' : 'transparent',
                    color: 'var(--text)',
                  }}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Bắt đầu</label>
              <input
                type="time"
                value={form.start}
                onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Kết thúc</label>
              <input
                type="time"
                value={form.end}
                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Ghi chú (tùy chọn)</label>
            <input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="vd: chụp khách A"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
