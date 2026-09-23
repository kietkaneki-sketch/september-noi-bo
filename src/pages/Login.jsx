import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Logo from '../components/Logo'

export default function Login() {
  const { login, theme, toggleTheme } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await login(username.trim(), password)
    setSubmitting(false)
    if (!res.ok) setError(res.error)
    // On success, AppContext's auth listener flips isAuthenticated and the router
    // redirects away from /login on its own — no manual navigate() needed here.
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: 'var(--bg)' }}
    >
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 rounded-full border h-10 w-10 flex items-center justify-center hover:opacity-80"
        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>

      <div
        className="w-full max-w-sm rounded-xl border p-8"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Tên đăng nhập
            </label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="vd: admin"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Dùng tên đăng nhập được quản trị viên cấp cho bạn.
        </div>
      </div>
    </div>
  )
}
