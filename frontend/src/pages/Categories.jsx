import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import Modal from '../components/Modal'
import api from '../services/api'
import { PlusIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, FolderOpenIcon } from '@heroicons/react/24/outline'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'expense' })
  const [activeTab, setActiveTab] = useState('all')

  const load = () => api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await api.post('/categories', form).catch(() => {})
    setShowModal(false); setForm({ name: '', type: 'expense' }); load()
  }
  const handleDelete = async (id) => { if (window.confirm('Hapus kategori ini?')) { await api.delete(`/categories/${id}`).catch(() => {}); load() } }

  const filtered = activeTab === 'all' ? categories : categories.filter(c => c.type === activeTab)
  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Kategori</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">{categories.length} kategori</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all">
          <PlusIcon className="w-4 h-4" /> Tambah Kategori
        </motion.button>
      </div>
      <div className="flex items-center gap-1 bg-white dark:bg-surface-900 rounded-xl p-1 border border-surface-200 dark:border-surface-800 w-fit">
        {[{ key: 'all', label: 'Semua' }, { key: 'income', label: 'Income' }, { key: 'expense', label: 'Expense' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>{tab.label}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Card className="p-12 text-center" hover={false}>
          <FolderOpenIcon className="w-12 h-12 text-surface-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-surface-900 dark:text-white mb-1">Belum ada kategori</h3>
        </Card>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(cat => (
            <motion.div key={cat.id} variants={item}>
              <Card className="p-4 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                      {cat.type === 'income' ? <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <ArrowTrendingDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{cat.name}</p>
                      <span className={`text-xs font-medium ${cat.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{cat.type}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Kategori" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Nama</label><input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required /></div>
          <div><label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Tipe</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputClass}><option value="expense">Expense</option><option value="income">Income</option></select></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">Batal</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
