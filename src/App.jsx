import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Requests from './pages/Requests'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Settings from './pages/Settings'

function ThemeSync() {
  const { theme } = useApp()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return null
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>Đang tải…</div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { isAuthenticated, ready } = useApp()
  if (!ready) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { currentUser, ready } = useApp()
  if (!ready) return <LoadingScreen />
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated, ready } = useApp()

  return (
    <Routes>
      <Route path="/login" element={ready && isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/requests" element={<Requests />} />
        <Route
          path="/employees"
          element={
            <RequireAdmin>
              <Employees />
            </RequireAdmin>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <RequireAdmin>
              <EmployeeDetail />
            </RequireAdmin>
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ThemeSync />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
