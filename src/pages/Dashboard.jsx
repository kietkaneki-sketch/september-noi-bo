import { Link } from 'react-router-dom'
import { Users, CalendarDays, Mail, Building2, CheckCircle2, Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'

const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function AnnouncementBanner({ announcements }) {
  if (announcements.length === 0) return null
  const top = announcements[0]
  return (
    <div
      className="rounded-xl border p-4 flex items-start gap-3"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
    >
      <span
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--surface)', color: 'var(--accent)' }}
      >
        <Megaphone size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{top.title}</div>
        <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{top.body}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { currentUser, data } = useApp()
  const isAdmin = currentUser.role === 'admin'
  const today = todayISO()

  const activeEmployees = data.users.filter((u) => u.role === 'employee' && u.active)
  const todayShifts = data.shifts.filter((s) => s.date === today)
  const pendingRequests = data.requests.filter((r) => r.status === 'pending')
  const announcements = [...data.announcements].sort((a, b) => (b.pinned - a.pinned) || b.createdAt.localeCompare(a.createdAt))

  const shiftLabel = (typeId) => data.shiftTypes.find((t) => t.id === typeId)?.label || typeId
  const userName = (id) => data.users.find((u) => u.id === id)?.fullName || '—'

  if (isAdmin) {
    const byDept = data.departments.map((dep) => ({
      dep,
      count: activeEmployees.filter((u) => u.department === dep).length,
    }))

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tổng quan</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Chào {currentUser.fullName.split(' ').pop()}, đây là tình hình hôm nay ({fmtDate(today)}).</p>
        </div>

        <AnnouncementBanner announcements={announcements} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Nhân sự đang làm" value={activeEmployees.length} hint={byDept.map((d) => `${d.dep}: ${d.count}`).join(' · ')} />
          <StatCard icon={CalendarDays} label="Ca làm hôm nay" value={todayShifts.length} />
          <StatCard icon={Mail} label="Đơn chờ duyệt" value={pendingRequests.length} hint={pendingRequests.length > 0 ? 'Cần xử lý' : 'Không có đơn mới'} />
          <StatCard icon={Building2} label="Phòng ban" value={data.departments.length} hint={data.departments.join(', ')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Ai đang làm hôm nay</h2>
              <Link to="/schedule" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Xem lịch</Link>
            </div>
            {todayShifts.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chưa ai đăng ký ca hôm nay.</p>}
            <ul className="flex flex-col gap-3">
              {todayShifts.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text)' }}>{userName(s.userId)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{shiftLabel(s.shiftType)} · {s.start}–{s.end}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Đơn chờ duyệt</h2>
              <Link to="/requests" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Xử lý</Link>
            </div>
            {pendingRequests.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Không có đơn nào đang chờ.</p>}
            <ul className="flex flex-col gap-3">
              {pendingRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm gap-3">
                  <div className="min-w-0">
                    <div style={{ color: 'var(--text)' }} className="truncate">{userName(r.userId)} · {r.type === 'off' ? 'Xin nghỉ' : 'Remote'}</div>
                    <div style={{ color: 'var(--text-muted)' }} className="text-xs truncate">{r.reason}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    )
  }

  // Employee view
  const myShifts = data.shifts
    .filter((s) => s.userId === currentUser.id && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
  const myRequests = data.requests
    .filter((r) => r.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Xin chào, {currentUser.fullName}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{currentUser.department} · {currentUser.position}</p>
      </div>

      <AnnouncementBanner announcements={announcements} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={CalendarDays} label="Ca sắp tới" value={myShifts.length} />
        <StatCard icon={Mail} label="Đơn đang chờ" value={myRequests.filter((r) => r.status === 'pending').length} />
        <StatCard icon={CheckCircle2} label="Đơn đã duyệt" value={myRequests.filter((r) => r.status === 'approved').length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Ca làm sắp tới của bạn</h2>
            <Link to="/schedule" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Đăng ký ca</Link>
          </div>
          {myShifts.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bạn chưa đăng ký ca nào sắp tới.</p>}
          <ul className="flex flex-col gap-3">
            {myShifts.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text)' }}>{fmtDate(s.date)}</span>
                <span style={{ color: 'var(--text-muted)' }}>{shiftLabel(s.shiftType)} · {s.start}–{s.end}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Đơn của bạn</h2>
            <Link to="/requests" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Gửi đơn mới</Link>
          </div>
          {myRequests.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bạn chưa gửi đơn nào.</p>}
          <ul className="flex flex-col gap-3">
            {myRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm gap-3">
                <div className="min-w-0">
                  <div style={{ color: 'var(--text)' }}>{r.type === 'off' ? 'Xin nghỉ' : 'Remote'} · {fmtDate(r.dateFrom)}</div>
                  {r.reviewNote && <div style={{ color: 'var(--text-muted)' }} className="text-xs truncate">Ghi chú: {r.reviewNote}</div>}
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
