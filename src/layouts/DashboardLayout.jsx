import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useContext, useEffect } from 'react'
import api from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext } from '../App'
import {
  ChartBarSquareIcon, ArrowsRightLeftIcon, FolderOpenIcon, ChartBarIcon,
  Cog6ToothIcon, Bars3Icon, XMarkIcon, SunIcon, MoonIcon, BellIcon,
  WalletIcon, ChevronRightIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: ChartBarSquareIcon },
  { path: '/transactions', label: 'Transactions', icon: ArrowsRightLeftIcon },
  { path: '/categories', label: 'Categories', icon: FolderOpenIcon },
  { path: '/reports', label: 'Reports', icon: ChartBarIcon },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { darkMode, setDarkMode, setSettings } = useContext(AppContext)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [setSettings])

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === location.pathname)
    return item ? item.label : 'Dashboard'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-950 flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-200 dark:border-surface-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <WalletIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-surface-900 dark:text-white leading-tight">FinanceApp</h1>
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">Expense Tracker</p>
          </div>
          <button className="ml-auto lg:hidden text-surface-400 hover:text-surface-600" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider px-3 mb-3">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200'}`}>
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                <ChevronRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-surface-200 dark:border-surface-800 space-y-1">
          <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
            {darkMode ? <SunIcon className="w-[18px] h-[18px]" /> : <MoonIcon className="w-[18px] h-[18px]" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <BellIcon className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-lg hover:shadow-primary-500/25 transition-shadow">U</div>
            <button onClick={handleLogout} className="p-2 rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Logout">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
