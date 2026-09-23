import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { REQUEST_TYPES } from '../lib/store'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Requests() {
  const { currentUser, data, addRequest, reviewRequest } = useApp()
  const isAdmin = currentUser.role === 'admin'

  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState({ type: 'off', dateFrom: todayISO(), dateTo: todayISO(), reason: '' })

  const [reviewTarget, setReviewTarget] = useState(null) // { request, decision }
  const [reviewNote, setReviewNote] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const userName = (id) => data.users.find((u) => u.id === id)?.fullName || '—'

  const requests = useMemo(() => {
    let list = isAdmin ? data.requests : data.requests.filter((r) => r.userId === currentUser.id)
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.requests, isAdmin, currentUser.id, statusFilter])

  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.reason.trim()) return
    try {
      await addRequest({ userId: currentUser.id, ...form })
      setForm({ type: 'off', dateFrom: todayISO(), dateTo: todayISO(), reason: '' })
      setNewOpen(false)
      setFormError('')
    } catch (err) {
      setFormError(err.message)
    }
  }

  const openReview = (request, decision) => {
    setReviewTarget({ request, decision })
    setReviewNote('')
  }

  const confirmReview = async () => {
    if (reviewTarget.decision === 'rejected' && !reviewNote.trim()) return
    try {
      await reviewRequest(reviewTarget.request.id, {
        status: reviewTarget.decision,
        reviewedBy: currentUser.id,
        reviewNote: reviewNote.trim(),
      })
      setReviewTarget(null)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Đơn nghỉ / Remote</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? 'Duyệt đề xuất nghỉ và làm remote của cả team.' : 'Gửi đề xuất nghỉ hoặc làm remote để quản trị viên duyệt.'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            <Plus size={15} /> Gửi đề xuất
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: 'Chờ duyệt' },
          { id: 'approved', label: 'Đã duyệt' },
          { id: 'rejected', label: 'Từ chối' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
            style={{
              borderColor: statusFilter === f.id ? 'var(--accent)' : 'transparent',
              color: statusFilter === f.id ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {requests.length === 0 && (
          <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Không có đơn nào.
          </div>
        )}
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && <span className="font-semibold" style={{ color: 'var(--text)' }}>{userName(r.userId)}</span>}
                <span
                  className="text-xs font-medium rounded-full px-2 py-0.5"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                >
                  {r.type === 'off' ? 'Xin nghỉ' : 'Làm remote'}
                </span>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                {r.dateFrom === r.dateTo ? fmtDate(r.dateFrom) : `${fmtDate(r.dateFrom)} → ${fmtDate(r.dateTo)}`}
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Lý do: {r.reason}</div>
              {r.reviewNote && (
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Phản hồi của quản trị: <i>{r.reviewNote}</i>
                </div>
              )}
            </div>
            {isAdmin && r.status === 'pending' && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openReview(r, 'approved')}
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:opacity-90"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => openReview(r, 'rejected')}
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-rose-600 hover:opacity-90"
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New request modal */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Gửi đề xuất mới"
        footer={
          <>
            <button onClick={() => setNewOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hủy</button>
            <button onClick={handleSubmit} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>Gửi đề xuất</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500">{formError}</div>}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Loại đề xuất</label>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: form.type === t.id ? 'var(--accent)' : 'var(--border)',
                    background: form.type === t.id ? 'var(--surface-2)' : 'transparent',
                    color: 'var(--text)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Từ ngày</label>
              <input
                type="date"
                value={form.dateFrom}
                onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value, dateTo: f.dateTo < e.target.value ? e.target.value : f.dateTo }))}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Đến ngày</label>
              <input
                type="date"
                min={form.dateFrom}
                value={form.dateTo}
                onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Lý do (bắt buộc)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="Nêu rõ lý do để quản trị viên xem xét..."
            />
          </div>
        </form>
      </Modal>

      {/* Review modal */}
      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={reviewTarget?.decision === 'approved' ? 'Duyệt đề xuất' : 'Từ chối đề xuất'}
        footer={
          <>
            <button onClick={() => setReviewTarget(null)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hủy</button>
            <button
              onClick={confirmReview}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: reviewTarget?.decision === 'approved' ? '#059669' : '#e11d48' }}
            >
              Xác nhận
            </button>
          </>
        }
      >
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          {reviewTarget?.decision === 'approved'
            ? 'Có thể thêm ghi chú (không bắt buộc).'
            : 'Vui lòng nêu lý do từ chối để nhân viên nắm được (bắt buộc).'}
        </p>
        <textarea
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          rows={3}
          className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          placeholder={reviewTarget?.decision === 'approved' ? 'vd: Đồng ý, nhớ bàn giao công việc' : 'vd: Trùng lịch chụp khách, vui lòng đổi ngày khác'}
        />
      </Modal>
    </div>
  )
}
