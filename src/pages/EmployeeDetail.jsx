import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { db } from '../lib/store'
import StatusBadge from '../components/StatusBadge'

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

function Section({ title, children }) {
  return (
    <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  )
}

const TABS = [
  { id: 'basic', label: 'Thông tin chung' },
  { id: 'personal', label: 'Thông tin cá nhân' },
  { id: 'contract', label: 'Hợp đồng & Lương' },
  { id: 'activity', label: 'Lịch sử làm việc' },
]

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, updateUser } = useApp()

  const [user, setUser] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('basic')
  const [basic, setBasic] = useState(null)
  const [personal, setPersonal] = useState(null)
  const [contract, setContract] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Personal info / contract (salary, CCCD…) are deliberately NOT in the shared team
  // list — only an admin viewing this one profile can fetch them (see supabase/schema.sql).
  const loadDetail = useCallback(async () => {
    try {
      const detail = await db.getEmployeeDetail(id)
      setUser(detail)
      setBasic({ fullName: detail.fullName, department: detail.department, position: detail.position, phone: detail.phone, email: detail.email })
      setPersonal({
        dob: '', gender: '', idNumber: '', idIssueDate: '', idIssuePlace: '',
        permanentAddress: '', currentAddress: '', emergencyContact: '', emergencyPhone: '',
        ...detail.personalInfo,
      })
      setContract({
        contractType: '', startDate: '', endDate: '', baseSalary: '', allowance: '',
        bankName: '', bankAccount: '', taxCode: '', socialInsuranceNo: '',
        ...detail.contract,
      })
    } catch {
      setNotFound(true)
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  if (notFound) {
    return (
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Không tìm thấy nhân viên. <button onClick={() => navigate('/employees')} className="underline">Quay lại danh sách</button>
      </div>
    )
  }

  if (!user || !basic) {
    return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Đang tải…</div>
  }

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const save = async (patch) => {
    setError('')
    try {
      await updateUser(user.id, patch)
      await loadDetail()
      flash()
    } catch (err) {
      setError(err.message)
    }
  }
  const saveBasic = () => save(basic)
  const savePersonal = () => save({ personalInfo: personal })
  const saveContract = () => save({ contract })

  const myShifts = data.shifts.filter((s) => s.userId === user.id).sort((a, b) => b.date.localeCompare(a.date))
  const myRequests = data.requests.filter((r) => r.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/employees')} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={15} /> Danh sách
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-semibold" style={{ background: user.avatarColor }}>
          {user.fullName[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{user.fullName}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.department} · {user.position} · @{user.username}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={user.active ? 'active' : 'inactive'} />
        </div>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-2.5 text-sm font-medium border-b-2 -mb-px"
            style={{
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="text-sm rounded-lg px-3 py-2 bg-emerald-500/10 text-emerald-600 w-fit">Đã lưu thay đổi.</div>
      )}
      {error && (
        <div className="text-sm rounded-lg px-3 py-2 bg-rose-500/10 text-rose-500 w-fit">{error}</div>
      )}

      {tab === 'basic' && (
        <Section title="Thông tin chung">
          <Field label="Họ và tên"><input style={inputStyle} value={basic.fullName} onChange={(e) => setBasic((f) => ({ ...f, fullName: e.target.value }))} /></Field>
          <Field label="Chức danh"><input style={inputStyle} value={basic.position} onChange={(e) => setBasic((f) => ({ ...f, position: e.target.value }))} /></Field>
          <Field label="Phòng ban">
            <select style={inputStyle} value={basic.department} onChange={(e) => setBasic((f) => ({ ...f, department: e.target.value }))}>
              {data.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Số điện thoại"><input style={inputStyle} value={basic.phone} onChange={(e) => setBasic((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Email"><input style={inputStyle} value={basic.email} onChange={(e) => setBasic((f) => ({ ...f, email: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end">
            <button onClick={saveBasic} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>Lưu thông tin</button>
          </div>
        </Section>
      )}

      {tab === 'personal' && (
        <Section title="Thông tin cá nhân / nhân thân">
          <Field label="Ngày sinh"><input type="date" style={inputStyle} value={personal.dob} onChange={(e) => setPersonal((f) => ({ ...f, dob: e.target.value }))} /></Field>
          <Field label="Giới tính">
            <select style={inputStyle} value={personal.gender} onChange={(e) => setPersonal((f) => ({ ...f, gender: e.target.value }))}>
              <option value="">— Chọn —</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </Field>
          <Field label="Số CCCD/CMND"><input style={inputStyle} value={personal.idNumber} onChange={(e) => setPersonal((f) => ({ ...f, idNumber: e.target.value }))} /></Field>
          <Field label="Ngày cấp"><input type="date" style={inputStyle} value={personal.idIssueDate} onChange={(e) => setPersonal((f) => ({ ...f, idIssueDate: e.target.value }))} /></Field>
          <Field label="Nơi cấp"><input style={inputStyle} value={personal.idIssuePlace} onChange={(e) => setPersonal((f) => ({ ...f, idIssuePlace: e.target.value }))} /></Field>
          <div />
          <Field label="Địa chỉ thường trú"><input style={inputStyle} value={personal.permanentAddress} onChange={(e) => setPersonal((f) => ({ ...f, permanentAddress: e.target.value }))} /></Field>
          <Field label="Địa chỉ hiện tại"><input style={inputStyle} value={personal.currentAddress} onChange={(e) => setPersonal((f) => ({ ...f, currentAddress: e.target.value }))} /></Field>
          <Field label="Người liên hệ khẩn cấp"><input style={inputStyle} value={personal.emergencyContact} onChange={(e) => setPersonal((f) => ({ ...f, emergencyContact: e.target.value }))} /></Field>
          <Field label="SĐT liên hệ khẩn cấp"><input style={inputStyle} value={personal.emergencyPhone} onChange={(e) => setPersonal((f) => ({ ...f, emergencyPhone: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end">
            <button onClick={savePersonal} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>Lưu thông tin</button>
          </div>
        </Section>
      )}

      {tab === 'contract' && (
        <Section title="Hợp đồng lao động & Lương">
          <Field label="Loại hợp đồng">
            <select style={inputStyle} value={contract.contractType} onChange={(e) => setContract((f) => ({ ...f, contractType: e.target.value }))}>
              <option value="">— Chọn —</option>
              <option value="probation">Thử việc</option>
              <option value="fixed_term">Xác định thời hạn</option>
              <option value="indefinite">Không xác định thời hạn</option>
              <option value="freelance">Cộng tác viên</option>
            </select>
          </Field>
          <div />
          <Field label="Ngày bắt đầu"><input type="date" style={inputStyle} value={contract.startDate} onChange={(e) => setContract((f) => ({ ...f, startDate: e.target.value }))} /></Field>
          <Field label="Ngày kết thúc"><input type="date" style={inputStyle} value={contract.endDate} onChange={(e) => setContract((f) => ({ ...f, endDate: e.target.value }))} /></Field>
          <Field label="Lương cơ bản (VNĐ)"><input type="number" style={inputStyle} value={contract.baseSalary} onChange={(e) => setContract((f) => ({ ...f, baseSalary: e.target.value }))} /></Field>
          <Field label="Phụ cấp (VNĐ)"><input type="number" style={inputStyle} value={contract.allowance} onChange={(e) => setContract((f) => ({ ...f, allowance: e.target.value }))} /></Field>
          <Field label="Ngân hàng"><input style={inputStyle} value={contract.bankName} onChange={(e) => setContract((f) => ({ ...f, bankName: e.target.value }))} /></Field>
          <Field label="Số tài khoản"><input style={inputStyle} value={contract.bankAccount} onChange={(e) => setContract((f) => ({ ...f, bankAccount: e.target.value }))} /></Field>
          <Field label="Mã số thuế TNCN"><input style={inputStyle} value={contract.taxCode} onChange={(e) => setContract((f) => ({ ...f, taxCode: e.target.value }))} /></Field>
          <Field label="Số sổ BHXH"><input style={inputStyle} value={contract.socialInsuranceNo} onChange={(e) => setContract((f) => ({ ...f, socialInsuranceNo: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end">
            <button onClick={saveContract} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>Lưu thông tin</button>
          </div>
        </Section>
      )}

      {tab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Ca làm gần đây</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {myShifts.slice(0, 10).map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span style={{ color: 'var(--text)' }}>{new Date(s.date).toLocaleDateString('vi-VN')}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{s.start}–{s.end}{s.note ? ` · ${s.note}` : ''}</span>
                </li>
              ))}
              {myShifts.length === 0 && <li style={{ color: 'var(--text-muted)' }}>Chưa có ca làm nào.</li>}
            </ul>
          </section>
          <section className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Đơn nghỉ / remote</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {myRequests.map((r) => (
                <li key={r.id} className="flex justify-between items-center gap-2">
                  <span style={{ color: 'var(--text)' }}>{r.type === 'off' ? 'Nghỉ' : 'Remote'} · {new Date(r.dateFrom).toLocaleDateString('vi-VN')}</span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
              {myRequests.length === 0 && <li style={{ color: 'var(--text-muted)' }}>Chưa có đơn nào.</li>}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
