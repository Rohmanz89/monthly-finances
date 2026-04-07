import { useContext } from 'react'
import { AppContext } from '../App'
import { Switch } from '@headlessui/react'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import { EyeIcon, SunIcon, MoonIcon, SwatchIcon } from '@heroicons/react/24/outline'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Settings() {
  const { settings, updateSettings, darkMode, setDarkMode } = useContext(AppContext)
  const toggles = [
    { key: 'showIncome', label: 'Tampilkan Income', desc: 'Kartu Total Income di dashboard' },
    { key: 'showExpense', label: 'Tampilkan Expense', desc: 'Kartu Total Expense di dashboard' },
    { key: 'showBalance', label: 'Tampilkan Balance', desc: 'Kartu Balance di dashboard' },
    { key: 'showReminder', label: 'Tampilkan Reminder', desc: 'Alert tagihan belum dibayar' },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      <div><h2 className="text-xl font-bold text-surface-900 dark:text-white">Pengaturan</h2><p className="text-sm text-surface-500 dark:text-surface-400">Kustomisasi tampilan dashboard</p></div>
      <motion.div variants={item}>
        <Card className="p-5" hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center"><SwatchIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" /></div>
            <div><h3 className="text-sm font-bold text-surface-900 dark:text-white">Tema</h3><p className="text-xs text-surface-500 dark:text-surface-400">Pilih tema</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setDarkMode(false)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${!darkMode ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-surface-200 dark:border-surface-700'}`}>
              <SunIcon className={`w-5 h-5 ${!darkMode ? 'text-primary-500' : 'text-surface-400'}`} /><div className="text-left"><p className="text-sm font-semibold">Light</p><p className="text-xs text-surface-400">Terang</p></div>
            </button>
            <button onClick={() => setDarkMode(true)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${darkMode ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-surface-200 dark:border-surface-700'}`}>
              <MoonIcon className={`w-5 h-5 ${darkMode ? 'text-primary-500' : 'text-surface-400'}`} /><div className="text-left"><p className="text-sm font-semibold">Dark</p><p className="text-xs text-surface-400">Gelap</p></div>
            </button>
          </div>
        </Card>
      </motion.div>
      <motion.div variants={item}>
        <Card className="p-5" hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center"><EyeIcon className="w-5 h-5 text-accent-600 dark:text-accent-400" /></div>
            <div><h3 className="text-sm font-bold text-surface-900 dark:text-white">Dashboard</h3><p className="text-xs text-surface-500 dark:text-surface-400">Atur widget</p></div>
          </div>
          <div className="space-y-3">
            {toggles.map(ti => (
              <div key={ti.key} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                <div><p className="text-sm font-medium text-surface-900 dark:text-white">{ti.label}</p><p className="text-xs text-surface-400 mt-0.5">{ti.desc}</p></div>
                <Switch checked={settings[ti.key]} onChange={(val) => updateSettings({ [ti.key]: val })}
                  className={`${settings[ti.key] ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}>
                  <span className={`${settings[ti.key] ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform`} />
                </Switch>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
