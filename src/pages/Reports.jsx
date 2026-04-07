import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import api from '../services/api'
import { ArrowDownTrayIcon, DocumentTextIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)
const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function Reports() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year] = useState(now.getFullYear())
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    api.get('/transactions').then(r => setTransactions(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    let r = transactions.filter(t => { const d = new Date(t.transaction_date || t.date); return d.getMonth() === month && d.getFullYear() === year })
    if (catFilter !== 'all') r = r.filter(t => (t.category_name || '') === catFilter)
    return r
  }, [transactions, month, year, catFilter])

  const stats = useMemo(() => {
    const inc = filtered.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const exp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    return { income: inc, expense: exp, balance: inc - exp }
  }, [filtered])

  const chartData = useMemo(() => {
    const map = {}
    filtered.forEach(t => { const c = t.category_name || 'Lainnya'; if (!map[c]) map[c] = { income: 0, expense: 0 }; map[c][t.type] += parseFloat(t.amount) })
    const labels = Object.keys(map)
    return { labels, datasets: [{ label: 'Income', data: labels.map(l => map[l].income), backgroundColor: '#1aae62', borderRadius: 6 }, { label: 'Expense', data: labels.map(l => map[l].expense), backgroundColor: '#ef4444', borderRadius: 6 }] }
  }, [filtered])

  const exportCSV = () => {
    const csv = [['Title','Amount','Type','Category','Status','Date'], ...filtered.map(t => [t.title, t.amount, t.type, t.category_name, t.status, t.transaction_date])].map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `report_${monthNames[month]}_${year}.csv`; a.click()
  }

  const selectClass = "px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-xl font-bold text-surface-900 dark:text-white">Laporan</h2><p className="text-sm text-surface-500 dark:text-surface-400">{monthNames[month]} {year}</p></div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
          <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
        </motion.button>
      </div>
      <Card className="p-4" hover={false}>
        <div className="flex flex-wrap gap-3">
          <div><label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Bulan</label><select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectClass}>{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Kategori</label><select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={selectClass}><option value="all">Semua</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center"><ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-xs font-medium text-surface-500">Income</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(stats.income)}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center"><ArrowTrendingDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" /></div><div><p className="text-xs font-medium text-surface-500">Expense</p><p className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(stats.expense)}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center"><ChartBarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" /></div><div><p className="text-xs font-medium text-surface-500">Balance</p><p className="text-lg font-bold text-primary-600 dark:text-primary-400">{fmt(stats.balance)}</p></div></div></Card>
      </div>
      <Card className="p-5" hover={false}>
        <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4">Per Kategori</h3>
        {chartData.labels.length > 0 ? (
          <div className="h-[300px]"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(226,232,240,0.5)' } } } }} /></div>
        ) : <div className="h-[300px] flex items-center justify-center text-sm text-surface-400">Tidak ada data</div>}
      </Card>
    </div>
  )
}
