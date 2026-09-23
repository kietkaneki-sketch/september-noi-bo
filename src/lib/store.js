// Data layer for the SEPTEMBER NỘI BỘ app — backed by Supabase (Postgres + Auth).
//
// Every function returns a Promise. Row-level security on the Supabase side is the real
// gatekeeper (see supabase/schema.sql); this file just shapes the requests/responses so
// the rest of the app can work with plain camelCase objects instead of raw DB rows.

import { supabase, usernameToEmail } from './supabaseClient'

export const REQUEST_TYPES = [
  { id: 'off', label: 'Xin nghỉ' },
  { id: 'remote', label: 'Làm remote' },
]

function must(error) {
  if (error) throw new Error(error.message)
}

async function callAdminFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let msg = error.message
    try {
      const errBody = await error.context.json()
      if (errBody?.error) msg = errBody.error
    } catch {
      /* keep default message */
    }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// ---- row -> app-shape mappers ----

const mapDirectoryUser = (row) => ({
  id: row.id,
  username: row.username,
  fullName: row.full_name,
  role: row.role,
  department: row.department,
  position: row.position || '',
  phone: row.phone || '',
  email: row.email || '',
  active: row.active,
  avatarColor: row.avatar_color,
  createdAt: row.created_at,
})

const mapFullProfile = (row) => ({
  ...mapDirectoryUser(row),
  personalInfo: row.personal_info || {},
  contract: row.contract || {},
})

const mapShift = (row) => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  shiftType: row.shift_type,
  start: row.start_time,
  end: row.end_time,
  note: row.note || '',
  createdAt: row.created_at,
})

const mapRequest = (row) => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  dateFrom: row.date_from,
  dateTo: row.date_to,
  reason: row.reason,
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewNote: row.review_note || '',
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
})

const mapAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  body: row.body || '',
  createdBy: row.created_by,
  pinned: row.pinned,
  createdAt: row.created_at,
})

const mapShiftType = (row) => ({
  id: row.id,
  label: row.label,
  start: row.start_time,
  end: row.end_time,
  color: row.color,
})

export const db = {
  // Loads everything the app needs in one go. `users` here is the safe team directory
  // (no salary/CCCD) — full profile detail is fetched separately, per-employee, only
  // where an admin is actually viewing that one person (see getEmployeeDetail).
  async fetchAll() {
    const [usersRes, shiftsRes, requestsRes, announcementsRes, shiftTypesRes, deptsRes] = await Promise.all([
      supabase.from('team_directory').select('*').order('created_at'),
      supabase.from('shifts').select('*'),
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('shift_types').select('*'),
      supabase.from('departments').select('*').order('name'),
    ])
    must(usersRes.error)
    must(shiftsRes.error)
    must(requestsRes.error)
    must(announcementsRes.error)
    must(shiftTypesRes.error)
    must(deptsRes.error)

    return {
      users: usersRes.data.map(mapDirectoryUser),
      shifts: shiftsRes.data.map(mapShift),
      requests: requestsRes.data.map(mapRequest),
      announcements: announcementsRes.data.map(mapAnnouncement),
      shiftTypes: shiftTypesRes.data.map(mapShiftType),
      departments: deptsRes.data.map((d) => d.name),
      updatedAt: new Date().toISOString(),
    }
  },

  // ---- Departments ----
  async addDepartment(name) {
    const clean = name.trim()
    if (!clean) return
    const { error } = await supabase.from('departments').insert({ name: clean })
    if (error && error.code !== '23505') throw new Error(error.message)
  },
  async renameDepartment(oldName, newName) {
    const clean = newName.trim()
    if (!clean || oldName === clean) return
    const { error } = await supabase.from('departments').update({ name: clean }).eq('name', oldName)
    if (error) throw new Error(error.code === '23505' ? 'Tên phòng ban đã tồn tại.' : error.message)
  },
  async deleteDepartment(name) {
    const { error } = await supabase.from('departments').delete().eq('name', name)
    if (error) throw new Error(error.code === '23503' ? 'Không thể xoá: vẫn còn nhân viên ở phòng ban này.' : error.message)
  },

  // ---- Shift types ----
  async addShiftType({ label, start, end, color }) {
    const id = `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    const { error } = await supabase.from('shift_types').insert({
      id,
      label,
      start_time: start || '08:00',
      end_time: end || '17:00',
      color: color || '#a37a34',
    })
    must(error)
  },
  async updateShiftType(id, patch) {
    const dbPatch = {}
    if (patch.label !== undefined) dbPatch.label = patch.label
    if (patch.start !== undefined) dbPatch.start_time = patch.start
    if (patch.end !== undefined) dbPatch.end_time = patch.end
    if (patch.color !== undefined) dbPatch.color = patch.color
    const { error } = await supabase.from('shift_types').update(dbPatch).eq('id', id)
    must(error)
  },
  async deleteShiftType(id) {
    const { error } = await supabase.from('shift_types').delete().eq('id', id)
    if (error) throw new Error(error.code === '23503' ? 'Không thể xoá: đang có ca làm dùng loại này.' : error.message)
  },

  // ---- Users / employees ----
  // Creating a login account (or resetting one's password) needs the service-role key,
  // which must never reach the browser — so both go through Edge Functions that do the
  // privileged part server-side, after checking the caller is really an admin.
  async createEmployee(payload) {
    return callAdminFunction('admin-create-employee', payload)
  },
  async resetEmployeePassword(userId, newPassword) {
    return callAdminFunction('admin-reset-password', { userId, newPassword })
  },
  async getEmployeeDetail(id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    must(error)
    return mapFullProfile(data)
  },
  async updateUser(id, patch) {
    const dbPatch = {}
    if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName
    if (patch.department !== undefined) dbPatch.department = patch.department
    if (patch.position !== undefined) dbPatch.position = patch.position
    if (patch.phone !== undefined) dbPatch.phone = patch.phone
    if (patch.email !== undefined) dbPatch.email = patch.email
    if (patch.active !== undefined) dbPatch.active = patch.active
    if (patch.avatarColor !== undefined) dbPatch.avatar_color = patch.avatarColor
    if (patch.personalInfo !== undefined) dbPatch.personal_info = patch.personalInfo
    if (patch.contract !== undefined) dbPatch.contract = patch.contract
    const { error } = await supabase.from('profiles').update(dbPatch).eq('id', id)
    must(error)
  },
  async setUserActive(id, active) {
    return db.updateUser(id, { active })
  },

  // ---- Shifts ----
  async addShift(payload) {
    const { error } = await supabase.from('shifts').insert({
      user_id: payload.userId,
      date: payload.date,
      shift_type: payload.shiftType,
      start_time: payload.start,
      end_time: payload.end,
      note: payload.note || '',
    })
    must(error)
  },
  async deleteShift(id) {
    const { error } = await supabase.from('shifts').delete().eq('id', id)
    must(error)
  },

  // ---- Requests (off / remote) ----
  async addRequest(payload) {
    const { error } = await supabase.from('requests').insert({
      user_id: payload.userId,
      type: payload.type,
      date_from: payload.dateFrom,
      date_to: payload.dateTo,
      reason: payload.reason,
    })
    must(error)
  },
  async reviewRequest(id, { status, reviewedBy, reviewNote }) {
    const { error } = await supabase
      .from('requests')
      .update({ status, reviewed_by: reviewedBy, review_note: reviewNote || '', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    must(error)
  },

  // ---- Announcements ----
  async addAnnouncement(payload) {
    const { error } = await supabase.from('announcements').insert({
      title: payload.title,
      body: payload.body || '',
      created_by: payload.createdBy,
      pinned: !!payload.pinned,
    })
    must(error)
  },
  async deleteAnnouncement(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    must(error)
  },
}

// ---- Auth ----
export const auth = {
  async login(username, password) {
    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu.' }

    const { data: profile } = await supabase.from('profiles').select('active').eq('id', data.user.id).single()
    if (profile && profile.active === false) {
      await supabase.auth.signOut()
      return { ok: false, error: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' }
    }
    return { ok: true }
  },
  async logout() {
    await supabase.auth.signOut()
  },
  async changePassword(email, currentPassword, newPassword) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (verifyError) throw new Error('Mật khẩu hiện tại không đúng.')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    must(error)
  },
}
