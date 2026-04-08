import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext } from 'react'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

export const AppContext = createContext()

const defaultSettings = { showIncome: true, showExpense: true, showBalance: true, showReminder: true }

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const s = localStorage.getItem('darkMode')
    return s ? JSON.parse(s) : false
  })
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('dashboardSettings')
    return s ? JSON.parse(s) : defaultSettings
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
  }, [darkMode])
  useEffect(() => { localStorage.setItem('dashboardSettings', JSON.stringify(settings)) }, [settings])

  const updateSettings = (s) => setSettings(prev => ({ ...prev, ...s }))

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, settings, updateSettings }}>
      <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
    </AppContext.Provider>
  )
}

export default App
