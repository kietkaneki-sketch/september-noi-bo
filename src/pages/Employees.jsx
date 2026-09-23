import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { slugifyUsername, sanitizeUsernameChars, USERNAME_PATTERN } from '../lib/slug'

const AVATAR_COLORS = ['#b6893f', '#5b7a9a', '#8a9a5b', '#9a5b7a', '#a05b5b', '#5b9a8f']

const emptyForm = { username: '', password: '', fullName: '', department: '', position: '', phone: '', email: '' }

export default function Employees() {
  const { data, createEmployee, setUserActive, addDepartment, resetEmployeePassword } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [newDept, setNewDept] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const openReset = (u) => {
    setResetTarget(u)
    setNewPassword('')
    setResetError('')
    setResetDone(false)
  }

  const submitReset = async () => {
    if (newPassword.length < 6) {
      setResetError('Mật khẩu mới cần ít nhất 6 ký tự.')
      return
    }
    setResetSubmitting(true)
    setResetError('')
    try {
      await resetEmployeePassword(resetTarget.id, newPassword)
      setResetDone(true)
    } catch (err) {
      setResetError(err.message)
    } finally {
      setResetSubmitting(false)
    }
  }

  const employees = data.users.filter((u) => u.role === 'employee')

  const handleFullNameChange = (value) => {
    setForm((f) => ({ ...f, fullName: value, username: usernameTouched ? f.username : slugifyUsername(value) }))
  }

  const handleUsernameChange = (value) => {
    setUsernameTouched(true)
    setForm((f) => ({ ...f, username: sanitizeUsernameChars(value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.fullName.trim() || !form.department) {
      setError('Vui lòng nhập đủ tên đăng nhập, họ tên và phòng ban.')
      return
    }
    if (!USERNAME_PATTERN.test(form.username.trim())) {
      setError('Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm/gạch dưới, không khoảng trắng (vd: an.nguyen).')
      return
    }
    setSubmitting(true)
    try {
      await createEmployee({
        ...form,
        username: form.username.trim(),
        password: form.password.trim() || '123456',
        avatarColor: AVATAR_COLORS[employees.length % AVATAR_COLORS.length],
      })
      setForm(emptyForm)
      setUsernameTouched(false)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddDept = async () => {
    if (!newDept.trim()) return
    const name = newDept.trim()
    await addDepartment(name)
    setForm((f) => ({ ...f, department: name }))
    setNewDept('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Nhân sự</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Quản lý tài khoản nhân viên các phòng ban.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          <UserPlus size={15} /> Thêm tài khoản
        </button>
      </div>

      <div className="rounded-xl border overflow-x-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="p-3 font-medium">Nhân viên</th>
              <th className="p-3 font-medium">Phòng ban</th>
              <th className="p-3 font-medium">Chức danh</th>
              <th className="p-3 font-medium">Liên hệ</th>
              <th className="p-3 font-medium">Trạng thái</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: u.avatarColor }}>
                      {u.fullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{u.fullName}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3" style={{ color: 'var(--text)' }}>{u.department}</td>
                <td className="p-3" style={{ color: 'var(--text)' }}>{u.position}</td>
                <td className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div>{u.phone}</div>
                  <div>{u.email}</div>
                </td>
                <td className="p-3"><StatusBadge status={u.active ? 'active' : 'inactive'} /></td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/employees/${u.id}`)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={() => openReset(u)}
                      className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <KeyRound size={12} /> Đặt lại MK
                    </button>
                    <button
                      onClick={() => setUserActive(u.id, !u.active).catch((err) => alert(err.message))}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {u.active ? 'Khóa' : 'Mở lại'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Chưa có nhân viên nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm tài khoản nhân viên"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hủy</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              {submitting ? 'Đang tạo…' : 'Tạo tài khoản'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Họ và tên *">
              <input value={form.fullName} onChange={(e) => handleFullNameChange(e.target.value)} style={inputStyle} placeholder="vd: Nguyễn Hoàng An" />
            </Field>
            <Field label="Tên đăng nhập *">
              <input
                value={form.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                style={inputStyle}
                placeholder="vd: an.nguyen"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tự động gợi ý từ họ tên — không dấu, không khoảng trắng.</p>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mật khẩu (mặc định 123456)">
              <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={inputStyle} placeholder="123456" />
            </Field>
            <Field label="Chức danh">
              <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} style={inputStyle} placeholder="vd: Sale Executive" />
            </Field>
          </div>
          <Field label="Phòng ban *">
            <div className="flex flex-wrap gap-2 mb-2">
              {data.departments.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setForm((f) => ({ ...f, department: d }))}
                  className="rounded-full px-3 py-1.5 text-sm"
                  style={{
                    background: form.department === d ? 'var(--accent)' : 'var(--surface-2)',
                    color: form.department === d ? 'var(--accent-contrast)' : 'var(--text-muted)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Thêm phòng ban mới..." style={inputStyle} />
              <button type="button" onClick={handleAddDept} className="rounded-xl border px-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Thêm</button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số điện thoại">
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Email">
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={`Đặt lại mật khẩu — ${resetTarget?.fullName || ''}`}
        footer={
          resetDone ? (
            <button onClick={() => setResetTarget(null)} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
              Đóng
            </button>
          ) : (
            <>
              <button onClick={() => setResetTarget(null)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hủy</button>
              <button
                onClick={submitReset}
                disabled={resetSubmitting}
                className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
              >
                {resetSubmitting ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
              </button>
            </>
          )
        }
      >
        {resetDone ? (
          <div className="text-sm rounded-lg px-3 py-2 bg-emerald-500/10 text-emerald-600">
            Đã đặt lại mật khẩu cho @{resetTarget?.username}. Báo mật khẩu mới này cho nhân viên (nhắn riêng, đừng gửi nhóm chung).
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Đặt mật khẩu mới cho <b>@{resetTarget?.username}</b>. Mật khẩu cũ sẽ không còn dùng được nữa.
            </p>
            {resetError && <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500">{resetError}</div>}
            <input
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
              style={inputStyle}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  borderRadius: '0.75rem',
  border: '1px solid var(--border)',
  padding: '0.55rem 0.85rem',
  fontSize: '0.875rem',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  outline: 'none',
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}
