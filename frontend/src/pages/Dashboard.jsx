import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, FileText, Trash2, Calendar, Eye } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { reportsApi } from '../api/reports'

export default function Dashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const data = await reportsApi.list()
      setReports(data)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, filename) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await reportsApi.delete(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
      toast.success('Report deleted')
    } catch {
      toast.error('Failed to delete report')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Hello, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {reports.length === 0
              ? "You haven't uploaded any reports yet"
              : `You have ${reports.length} report${reports.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link to="/upload" className="btn-primary">
          <Plus size={18} />
          Upload report
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onDelete={() => handleDelete(r.id, r.filename)}
              deleting={deletingId === r.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportCard({ report, onDelete, deleting }) {
  return (
    <div className="card flex flex-col">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-700/20">
        <FileText size={20} className="text-brand-600" />
      </div>
      <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100" title={report.filename}>
        {report.filename}
      </h3>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Calendar size={12} />
        {new Date(report.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <div className="mt-4 flex gap-2">
        <Link to={`/reports/${report.id}`} className="btn-secondary flex-1 !px-3 !py-1.5 text-sm">
          <Eye size={14} />
          View
        </Link>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="btn-secondary !px-3 !py-1.5 text-sm hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950"
          aria-label="Delete report"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-700/20">
        <FileText size={28} className="text-brand-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        No reports yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
        Upload your first medical report and let AI explain it in plain language.
      </p>
      <Link to="/upload" className="btn-primary mt-6">
        <Plus size={18} />
        Upload your first report
      </Link>
    </div>
  )
}
