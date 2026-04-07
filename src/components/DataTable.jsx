import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function DataTable({ columns, data, searchable = true, searchPlaceholder = 'Search...', pageSize = 10, onRowClick, emptyMessage = 'No data found', filters }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    let result = [...data]
    if (search) {
      result = result.filter(row => columns.some(col => { const v = col.accessor ? row[col.accessor] : ''; return String(v).toLowerCase().includes(search.toLowerCase()) }))
    }
    if (sortField) {
      result.sort((a, b) => {
        const aV = a[sortField] ?? '', bV = b[sortField] ?? ''
        if (typeof aV === 'number' && typeof bV === 'number') return sortDirection === 'asc' ? aV - bV : bV - aV
        return sortDirection === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV))
      })
    }
    return result
  }, [data, search, sortField, sortDirection, columns])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIdx = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIdx, startIdx + pageSize)
  const handleSort = (f) => { if (sortField === f) setSortDirection(p => p === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortDirection('asc') } }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {searchable && (
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
          </div>
        )}
        {filters && <div className="flex gap-2 flex-wrap">{filters}</div>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50">
              {columns.map(col => (
                <th key={col.accessor || col.header} className={`px-4 py-3 text-left font-semibold text-surface-500 dark:text-surface-400 whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-surface-700 dark:hover:text-surface-200' : ''}`}
                  onClick={() => col.sortable && col.accessor && handleSort(col.accessor)}>
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortField === col.accessor && (sortDirection === 'asc' ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            <AnimatePresence>
              {paginatedData.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-surface-400 dark:text-surface-500">{emptyMessage}</td></tr>
              ) : paginatedData.map((row, idx) => (
                <motion.tr key={row.id || idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className={`bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}>
                  {columns.map(col => (
                    <td key={col.accessor || col.header} className="px-4 py-3 whitespace-nowrap text-surface-700 dark:text-surface-300">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-surface-500 dark:text-surface-400">Showing {startIdx + 1}-{Math.min(startIdx + pageSize, filteredData.length)} of {filteredData.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page; if (totalPages <= 5) page = i + 1; else if (currentPage <= 3) page = i + 1; else if (currentPage >= totalPages - 2) page = totalPages - 4 + i; else page = currentPage - 2 + i
              return <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>{page}</button>
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
