import { useContext, useMemo, useState, useEffect } from 'react'
import { AppContext } from '../App'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import api from '../services/api'
import {
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, WalletIcon,
  ExclamationTriangleIcon, ArrowRightIcon, DocumentTextIcon,
  ClockIcon, ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const COLORS = ['#3b93ff','#1aae62','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316']
const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(v) || 0)
const anim = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const animItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const { settings } = useContext(AppContext)
  const navigate = useNavigate()
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, unpaidCount: 0, recent: [] })
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      api.get('/dashboard'),
      api.get('/reminder'),
    ]).then(([dashRes, remRes]) => {
      if (dashRes.status === 'fulfilled' && dashRes.value.data) {
        const d = dashRes.value.data
        setStats({
          income: parseFloat(d.total_income) || 0,
          expense: parseFloat(d.total_expense) || 0,
          balance: parseFloat(d.balance) || 0,
          unpaidCount: parseInt(d.unpaid_count) || 0,
          recent: d.transactions || d.recent_transactions || [],
        })
      }
      if (remRes.status === 'fulfilled' && Array.isArray(remRes.value.data)) {
        setReminders(remRes.value.data)
      }
      setLoading(false)
    }).catch(() => { setError('Gagal memuat data'); setLoading(false) })
  }, [])

  const monthlyChartData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const year = new Date().getFullYear()
    const inc = new Array(12).fill(0)
    const exp = new Array(12).fill(0)
    stats.recent.forEach(t => {
      const d = new Date(t.transaction_date || t.date)
      if (d.getFullYear() === year) {
        if (t.type === 'income') inc[d.getMonth()] += parseFloat(t.amount) || 0
        else exp[d.getMonth()] += parseFloat(t.amount) || 0
      }
    })
    return {
      labels: months,
      datasets: [
        { label: 'Income', data: inc, borderColor: '#3b93ff', backgroundColor: 'rgba(59,147,255,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
        { label: 'Expense', data: exp, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
      ],
    }
  }, [stats.recent])

  const categoryChartData = useMemo(() => {
    const map = {}
    stats.recent.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category_name || 'Lainnya'
      map[cat] = (map[cat] || 0) + (parseFloat(t.amount) || 0)
    })
    return {
      labels: Object.keys(map),
      datasets: [{ data: Object.values(map), backgroundColor: COLORS.slice(0, Object.keys(map).length), borderWidth: 0, hoverOffset: 8 }],
    }
  }, [stats.recent])

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 10, callbacks: { label: c => c.dataset.label + ': ' + fmt(c.raw) } } },
    scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }, y: { grid: { color: 'rgba(226,232,240,0.5)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => v >= 1e6 ? (v/1e6)+'M' : v >= 1e3 ? (v/1e3)+'K' : v } } },
  }
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } }, tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 10, callbacks: { label: c => c.label + ': ' + fmt(c.raw) } } },
  }

  const cards = [
    { key: 'income', show: settings.showIncome, label: 'Total Income', value: stats.income, icon: ArrowTrendingUpIcon, iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'expense', show: settings.showExpense, label: 'Total Expense', value: stats.expense, icon: ArrowTrendingDownIcon, iconBg: 'bg-red-100 dark:bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400', textColor: 'text-red-600 dark:text-red-400' },
    { key: 'balance', show: settings.showBalance, label: 'Balance', value: stats.balance, icon: WalletIcon, iconBg: 'bg-primary-100 dark:bg-primary-500/10', iconColor: 'text-primary-600 dark:text-primary-400', textColor: 'text-primary-600 dark:text-primary-400' },
  ]

  const hasData = stats.recent.length > 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-center">
      <div>
        <p className="text-red-500 mb-2">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary-500 hover:underline">Coba lagi</button>
      </div>
    </div>
  )

  return (
    <motion.div variants={anim} initial="hidden" animate="show" className="space-y-6">
      {settings.showReminder && reminders.length > 0 && (
        <motion.div variants={animItem} className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Ada {reminders.length} tagihan belum dibayar</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Total: {fmt(reminders.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0))}</p>
          </div>
          <button onClick={() => navigate('/transactions')} className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">Lihat <ArrowRightIcon className="w-3.5 h-3.5" /></button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.filter(c => c.show).map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={card.key} delay={idx * 0.1} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>{fmt(card.value)}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {!hasData && (
        <Card className="p-12 text-center" hover={false}>
          <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <WalletIcon className="w-10 h-10 text-surface-400" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Belum ada transaksi</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">Mulai catat pemasukan dan pengeluaran kamu.</p>
          <button onClick={() => navigate('/transactions')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25">
            <DocumentTextIcon className="w-4 h-4" /> Tambah Transaksi
          </button>
        </Card>
      )}

      {hasData && (
        <motion.div variants={animItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Tren Bulanan</h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Income vs Expense</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Income</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Expense</span>
              </div>
            </div>
            <div className="h-[280px]"><Line data={monthlyChartData} options={lineOpts} /></div>
          </Card>
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-1">Kategori Pengeluaran</h3>
            {categoryChartData.labels.length > 0 ? (
              <div className="h-[250px]"><Doughnut data={categoryChartData} options={doughnutOpts} /></div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-surface-400">Belum ada data</div>
            )}
          </Card>
        </motion.div>
      )}

      {hasData && (
        <motion.div variants={animItem} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Transaksi Terkini</h3>
              <button onClick={() => navigate('/transactions')} className="text-xs font-semibold text-primary-500 flex items-center gap-1">Lihat Semua <ArrowRightIcon className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-3">
              {stats.recent.slice(0, 5).map((t, i) => (
                <div key={t.id || i} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                      {t.type === 'income' ? <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" /> : <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{t.title}</p>
                      <p className="text-xs text-surface-400">{t.category_name || '-'}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-2"><ClockIcon className="w-4 h-4 text-amber-500" /> Tagihan Unpaid</h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600">{reminders.length}</span>
            </div>
            {reminders.length === 0 ? (
              <div className="py-8 text-center">
                <ChartBarIcon className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-surface-500">Semua tagihan sudah dibayar!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.slice(0, 5).map((t, i) => (
                  <div key={t.id || i} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{t.title}</p>
                      <p className="text-xs text-surface-400">{t.category_name || '-'}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{fmt(t.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
