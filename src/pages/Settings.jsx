import { useState } from 'react'
import { Download, Plus, Pencil, Trash2, Check, X, Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'

const inputStyle = {
  width: '100%',
  borderRadius: '0.625rem',
  border: '1px solid var(--border)',
  padding: '0.55rem 0.85rem',
  fontSize: '0.875rem',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  outline: 'none',
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div>
        <h2 className="font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
        {description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      {children}
    </section>
  )
}

function IconButton({ onClick, children, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-7 w-7 rounded-md flex items-center justify-center hover:opacity-70"
      style={{ color: danger ? '#c14f4f' : 'var(--text-muted)', background: 'var(--surface-2)' }}
    >
      {children}
    </button>
  )
}

export default function Settings() {
  const {
    currentUser, data, changePassword,
    addDepartment, renameDepartment, deleteDepartment,
    addShiftType, updateShiftType, deleteShiftType,
    addAnnouncement, deleteAnnouncement,
  } = useApp()
  const isAdmin = currentUser.role === 'admin'

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)

  // Departments
  const [newDept, setNewDept] = useState('')
  const [editingDept, setEditingDept] = useState(null)
  const [editDeptValue, setEditDeptValue] = useState('')
  const [deptError, setDeptError] = useState('')

  // Shift types
  const [newType, setNewType] = useState({ label: '', start: '08:00', end: '17:00', color: '#a37a34' })
  const [editingType, setEditingType] = useState(null)
  const [typeError, setTypeError] = useState('')

  // Announcements
  const [annForm, setAnnForm] = useState({ title: '', body: '' })

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `september-noi-bo-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next.length < 6) {
      setPwMsg({ ok: false, text: 'Mật khẩu mới cần ít nhất 6 ký tự.' })
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: 'Xác nhận mật khẩu không khớp.' })
      return
    }
    try {
      await changePassword(pwForm.current, pwForm.next)
      setPwForm({ current: '', next: '', confirm: '' })
      setPwMsg({ ok: true, text: 'Đã đổi mật khẩu.' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.message })
    }
  }

  const startEditDept = (d) => {
    setEditingDept(d)
    setEditDeptValue(d)
    setDeptError('')
  }
  const saveEditDept = async () => {
    try {
      await renameDepartment(editingDept, editDeptValue.trim())
      setEditingDept(null)
      setDeptError('')
    } catch (err) {
      setDeptError(err.message)
    }
  }
  const removeDept = async (d) => {
    try {
      await deleteDepartment(d)
      setDeptError('')
    } catch (err) {
      setDeptError(err.message)
    }
  }

  const submitNewType = async () => {
    if (!newType.label.trim()) return
    try {
      await addShiftType(newType)
      setNewType({ label: '', start: '08:00', end: '17:00', color: '#a37a34' })
      setTypeError('')
    } catch (err) {
      setTypeError(err.message)
    }
  }
  const removeType = async (id) => {
    try {
      await deleteShiftType(id)
      setTypeError('')
    } catch (err) {
      setTypeError(err.message)
    }
  }
  const editType = (id, patch) => updateShiftType(id, patch).catch((err) => setTypeError(err.message))

  const submitAnnouncement = async () => {
    if (!annForm.title.trim()) return
    await addAnnouncement({ title: annForm.title.trim(), body: annForm.body.trim(), createdBy: currentUser.id })
    setAnnForm({ title: '', body: '' })
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Cài đặt</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isAdmin ? 'Quyền quản trị: tuỳ chỉnh hạng mục vận hành, bảo mật và sao lưu dữ liệu.' : 'Bảo mật tài khoản.'}
        </p>
      </div>

      {isAdmin && (
        <Section
          title="Sao lưu dữ liệu"
          description="Dữ liệu thật đang nằm trên Supabase (có backup tự động phía server). Nút dưới đây tải thêm một bản sao thủ công về máy bạn, phòng khi cần đối chiếu nhanh."
        >
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
              <Download size={15} /> Xuất bản sao (.json)
            </button>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Dữ liệu tải lần gần nhất: {data.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '—'}
          </div>
        </Section>
      )}

      {isAdmin && (
        <Section title="Thông báo nội bộ" description="Đăng thông báo hiển thị ngay trên Tổng quan cho toàn bộ nhân viên.">
          <div className="flex flex-col gap-2">
            <input
              placeholder="Tiêu đề thông báo..."
              value={annForm.title}
              onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
              style={inputStyle}
            />
            <textarea
              placeholder="Nội dung (tuỳ chọn)..."
              rows={2}
              value={annForm.body}
              onChange={(e) => setAnnForm((f) => ({ ...f, body: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <button onClick={submitAnnouncement} className="self-start flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
              <Plus size={15} /> Đăng thông báo
            </button>
          </div>
          <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            {data.announcements.length === 0 && (
              <p className="text-sm pt-3" style={{ color: 'var(--text-muted)' }}>Chưa có thông báo nào.</p>
            )}
            {data.announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 pt-3">
                <div className="flex items-start gap-2 min-w-0">
                  <Megaphone size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{a.title}</div>
                    {a.body && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.body}</div>}
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
                <IconButton onClick={() => deleteAnnouncement(a.id)} title="Xoá thông báo" danger>
                  <Trash2 size={14} />
                </IconButton>
              </div>
            ))}
          </div>
        </Section>
      )}

      {isAdmin && (
        <Section title="Loại ca làm" description="Thêm/bớt các hạng mục ca làm mà nhân viên có thể chọn khi đăng ký lịch.">
          <div className="flex flex-col gap-2">
            {data.shiftTypes.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <input
                  type="color"
                  value={t.color}
                  onChange={(e) => editType(t.id, { color: e.target.value })}
                  className="h-6 w-6 rounded cursor-pointer shrink-0 border-0 bg-transparent"
                />
                {editingType === t.id ? (
                  <input
                    autoFocus
                    defaultValue={t.label}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { editType(t.id, { label: e.target.value.trim() || t.label }); setEditingType(null) }
                      if (e.key === 'Escape') setEditingType(null)
                    }}
                    onBlur={(e) => { editType(t.id, { label: e.target.value.trim() || t.label }); setEditingType(null) }}
                    style={{ ...inputStyle, padding: '0.3rem 0.6rem' }}
                    className="flex-1"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{t.label}</span>
                )}
                <input
                  type="time"
                  value={t.start}
                  onChange={(e) => editType(t.id, { start: e.target.value })}
                  className="text-xs rounded-md border px-1.5 py-1"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
                <input
                  type="time"
                  value={t.end}
                  onChange={(e) => editType(t.id, { end: e.target.value })}
                  className="text-xs rounded-md border px-1.5 py-1"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
                <IconButton onClick={() => setEditingType(t.id)} title="Đổi tên"><Pencil size={13} /></IconButton>
                <IconButton onClick={() => removeType(t.id)} title="Xoá" danger><Trash2 size={13} /></IconButton>
              </div>
            ))}
          </div>
          {typeError && <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500">{typeError}</div>}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <input
              type="color"
              value={newType.color}
              onChange={(e) => setNewType((f) => ({ ...f, color: e.target.value }))}
              className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent mt-2"
            />
            <input
              placeholder="Tên loại ca mới..."
              value={newType.label}
              onChange={(e) => setNewType((f) => ({ ...f, label: e.target.value }))}
              style={{ ...inputStyle, width: 'auto', flex: 1, marginTop: '0.5rem' }}
            />
            <input
              type="time"
              value={newType.start}
              onChange={(e) => setNewType((f) => ({ ...f, start: e.target.value }))}
              className="text-sm rounded-lg border px-2 py-2 mt-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
            />
            <input
              type="time"
              value={newType.end}
              onChange={(e) => setNewType((f) => ({ ...f, end: e.target.value }))}
              className="text-sm rounded-lg border px-2 py-2 mt-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
            />
            <button onClick={submitNewType} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold mt-2" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
              <Plus size={15} /> Thêm
            </button>
          </div>
        </Section>
      )}

      {isAdmin && (
        <Section title="Phòng ban" description="Thêm, đổi tên hoặc xoá phòng ban (không xoá được nếu còn nhân viên ở phòng ban này).">
          <div className="flex flex-col gap-2">
            {data.departments.map((d) => (
              <div key={d} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                {editingDept === d ? (
                  <>
                    <input
                      autoFocus
                      value={editDeptValue}
                      onChange={(e) => setEditDeptValue(e.target.value)}
                      style={{ ...inputStyle, padding: '0.3rem 0.6rem' }}
                      className="flex-1"
                    />
                    <IconButton onClick={saveEditDept} title="Lưu"><Check size={14} /></IconButton>
                    <IconButton onClick={() => setEditingDept(null)} title="Huỷ"><X size={14} /></IconButton>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{d}</span>
                    <IconButton onClick={() => startEditDept(d)} title="Đổi tên"><Pencil size={13} /></IconButton>
                    <IconButton onClick={() => removeDept(d)} title="Xoá" danger><Trash2 size={13} /></IconButton>
                  </>
                )}
              </div>
            ))}
          </div>
          {deptError && <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500">{deptError}</div>}
          <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Thêm phòng ban mới..." style={{ ...inputStyle, marginTop: '0.5rem' }} />
            <button
              onClick={async () => { if (newDept.trim()) { await addDepartment(newDept.trim()); setNewDept('') } }}
              className="flex items-center gap-1.5 rounded-lg border px-4 text-sm font-medium mt-2"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Plus size={15} /> Thêm
            </button>
          </div>
        </Section>
      )}

      <Section title="Đổi mật khẩu">
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input type="password" placeholder="Mật khẩu hiện tại" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} style={inputStyle} />
          <input type="password" placeholder="Mật khẩu mới" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} style={inputStyle} />
          <input type="password" placeholder="Xác nhận mật khẩu mới" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} style={inputStyle} />
          {pwMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 ${pwMsg.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'}`}>{pwMsg.text}</div>
          )}
          <button type="submit" className="self-start rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
            Cập nhật mật khẩu
          </button>
        </form>
      </Section>
    </div>
  )
}
