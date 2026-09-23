import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, CalendarDays, Mail, Users, Settings, Moon, Sun, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Logo from './Logo'

const NAV = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid, end: true },
  { to: '/schedule', label: 'Lịch làm việc', icon: CalendarDays },
  { to: '/requests', label: 'Đơn nghỉ / Remote', icon: Mail },
  { to: '/employees', label: 'Nhân sự', icon: Users, adminOnly: true },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]

export default function Layout() {
  const { currentUser, logout, theme, toggleTheme, data } = useApp()
  const navigate = useNavigate()

  if (!currentUser) return null

  const isAdmin = currentUser.role === 'admin'
  const pendingCount = data.requests.filter((r) => r.status === 'pending').length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <aside
        className="w-64 shrink-0 border-r flex flex-col p-5 gap-7"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Logo size="sm" />

        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className="group relative flex items-center justify-between rounded-lg pl-3.5 pr-3 py-2.5 text-sm font-medium transition-colors"
                style={({ isActive }) => ({
                  background: isActive ? 'var(--surface-2)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full transition-opacity"
                      style={{ background: 'var(--accent)', opacity: isActive ? 1 : 0 }}
                    />
                    <span className="flex items-center gap-2.5">
                      <Icon size={17} strokeWidth={2} />
                      {n.label}
                    </span>
                    {n.to === '/requests' && pendingCount > 0 && (
                      <span
                        className="text-[11px] font-semibold rounded-full text-white px-1.5 py-0.5 min-w-[18px] text-center leading-tight"
                        style={{ background: '#c14f4f' }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div
          className="rounded-xl p-3 flex items-center gap-3 border"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ background: currentUser.avatarColor || 'var(--accent)' }}
          >
            {currentUser.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{currentUser.fullName}</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {isAdmin ? 'Quản trị viên' : `${currentUser.department} · ${currentUser.position}`}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'light' ? 'Tối' : 'Sáng'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <LogOut size={15} />
            Thoát
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
