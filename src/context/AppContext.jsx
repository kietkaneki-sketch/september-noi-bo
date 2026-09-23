import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { db, auth } from '../lib/store'

const AppContext = createContext(null)

const EMPTY_DATA = { users: [], shifts: [], requests: [], announcements: [], shiftTypes: [], departments: [], updatedAt: null }

export function AppProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA)
  // undefined = "haven't checked yet", null = "checked, logged out", object = the Supabase auth user
  const [authUser, setAuthUser] = useState(undefined)
  const [dataLoading, setDataLoading] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('september_theme') || 'light')

  const refresh = useCallback(async () => {
    const fresh = await db.fetchAll()
    setData(fresh)
    return fresh
  }, [])

  // Track the Supabase session.
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setAuthUser(session?.user || null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Load app data whenever we go from "logged out" to "logged in" (or on first login).
  useEffect(() => {
    if (authUser === undefined) return
    if (!authUser) {
      setData(EMPTY_DATA)
      return
    }
    setDataLoading(true)
    refresh().finally(() => setDataLoading(false))
  }, [authUser, refresh])

  // Live updates: when anyone changes shifts/requests/announcements, everyone's view refreshes
  // without needing a manual reload — this is what makes "đăng ký ca hiện lên ngay" actually true.
  useEffect(() => {
    if (!authUser) return
    const channel = supabase
      .channel('september-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_types' }, refresh)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [authUser, refresh])

  const withRefresh = useCallback(
    (fn) =>
      async (...args) => {
        const result = await fn(...args)
        await refresh()
        return result
      },
    [refresh]
  )

  const actions = useMemo(
    () => ({
      createEmployee: withRefresh(db.createEmployee),
      updateUser: withRefresh(db.updateUser),
      setUserActive: withRefresh(db.setUserActive),
      addDepartment: withRefresh(db.addDepartment),
      renameDepartment: withRefresh(db.renameDepartment),
      deleteDepartment: withRefresh(db.deleteDepartment),
      addShiftType: withRefresh(db.addShiftType),
      updateShiftType: withRefresh(db.updateShiftType),
      deleteShiftType: withRefresh(db.deleteShiftType),
      addShift: withRefresh(db.addShift),
      deleteShift: withRefresh(db.deleteShift),
      addRequest: withRefresh(db.addRequest),
      reviewRequest: withRefresh(db.reviewRequest),
      addAnnouncement: withRefresh(db.addAnnouncement),
      deleteAnnouncement: withRefresh(db.deleteAnnouncement),
    }),
    [withRefresh]
  )

  const login = useCallback((username, password) => auth.login(username, password), [])
  const logout = useCallback(() => auth.logout(), [])
  const changePassword = useCallback(
    (currentPassword, newPassword) => {
      if (!currentUserEmail(authUser)) return Promise.reject(new Error('Chưa đăng nhập.'))
      return auth.changePassword(currentUserEmail(authUser), currentPassword, newPassword)
    },
    [authUser]
  )

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('september_theme', next)
      return next
    })
  }, [])

  const currentUser = useMemo(() => {
    if (!authUser) return null
    return data.users.find((u) => u.id === authUser.id) || null
  }, [authUser, data.users])

  const authChecked = authUser !== undefined
  const ready = authChecked && (!authUser || !dataLoading)

  const value = {
    data,
    refresh,
    currentUser,
    login,
    logout,
    changePassword,
    theme,
    toggleTheme,
    ready,
    isAuthenticated: !!authUser,
    ...actions,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function currentUserEmail(authUser) {
  return authUser?.email || null
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
