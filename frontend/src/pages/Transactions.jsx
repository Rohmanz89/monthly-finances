import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import api from '../services/api'
import {
  PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  PencilSquareIcon, TrashIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'

const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
const emptyForm = { title: '', amount: '', type: 'expense', categoryId: '', status: 'unpaid', date: new Date().toISOString().split('T')[0], is_recurring: false }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    api.get('/transactions').then(r => setTransactions(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let r = [...transactions]
    if (typeFilter !== 'all') r = r.filter(t => t.type === typeFilter)
    if (statusFilter !== 'all') r = r.filter(t => t.status === statusFilter)
    return r
  }, [transactions, typeFilter, statusFilter])

  const openModal = (t = null) => {
    if (t) { setEditingId(t.id); setForm({ title: t.title, amount: t.amount, type: t.type, categoryId: t.category_id || t.categoryId, status: t.status, date: t.transaction_date || t.date, is_recurring: t.is_recurring || false }) }
    else { setEditingId(null); setForm(emptyForm) }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.amount) return
    if (editingId) await api.put(`/transactions/${editingId}`, form).catch(() => {})
    else await api.post('/transactions', form).catch(() => {})
    setShowModal(false); setEditingId(null); setForm(emptyForm); load()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Hapus transaksi ini?')) { await api.delete(`/transactions/${id}`).catch(() => {}); load() }
  }

  const filteredCats = categories.filter(c => c.type === form.type)
  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"

  const columns = [
    { header: 'Transaksi', accessor: 'title', sortable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${row.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
          {row.type === 'income' ? <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-surface-900 dark:text-white">{row.title}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400">{row.category_name || 'Uncategorized'}</span>
            {row.is_recurring && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-1.5 py-0.5 rounded-full"><ArrowPathIcon className="w-2.5 h-2.5" /> Monthly</span>}
          </div>
        </div>
      </div>
    )},
    { header: 'Amount', accessor: 'amount', sortable: true, render: (row) => <span className={`text-sm font-semibold ${row.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{row.type === 'income' ? '+' : '-'}{fmt(row.amount)}</span> },
    { header: 'Date', accessor: 'transaction_date', sortable: true, render: (row) => <span className="text-sm text-surface-600 dark:text-surface-300">{new Date(row.transaction_date || row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
    { header: 'Status', accessor: 'status', sortable: true, render: (row) => (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${row.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'paid' ? 'bg-emerald-500' : 'bg-red-500'}`} />{row.status === 'paid' ? 'Paid' : 'Unpaid'}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openModal(row) }} className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><TrashIcon className="w-4 h-4" /></button>
      </div>
    )},
  ]

  const filterBtns = (<>
    <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
      {['all','income','expense'].map(v => <button key={v} onClick={() => setTypeFilter(v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === v ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500'}`}>{v === 'all' ? 'All' : v === 'income' ? '↑ Income' : '↓ Expense'}</button>)}
    </div>
    <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
      {['all','paid','unpaid'].map(v => <button key={v} onClick={() => setStatusFilter(v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === v ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500'}`}>{v === 'all' ? 'All' : v === 'paid' ? '🟢 Paid' : '🔴 Unpaid'}</button>)}
    </div>
  </>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Transaksi</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">{transactions.length} total transaksi</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all">
          <PlusIcon className="w-4 h-4" /> Tambah Transaksi
        </motion.button>
      </div>
      <Card className="p-5" hover={false}>
        <DataTable columns={columns} data={filtered} searchPlaceholder="Cari transaksi..." emptyMessage="Tidak ada transaksi" filters={filterBtns} />
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Judul</label><input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} required /></div>
          <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Jumlah (Rp)</label><input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputClass} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Tipe</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, categoryId: '' }))} className={inputClass}><option value="expense">Expense</option><option value="income">Income</option></select></div>
            <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Kategori</label><select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className={inputClass}><option value="">Pilih</option>{filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Tanggal</label><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputClass} required /></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <input type="checkbox" id="recurring" checked={form.is_recurring} onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))} className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
            <label htmlFor="recurring" className="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer flex-1">Recurring bulanan</label>
            {form.is_recurring && <span className="text-xs font-semibold text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-1 rounded-full">🔁 Monthly</span>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">Batal</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all">{editingId ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
