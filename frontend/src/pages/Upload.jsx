import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload as UploadIcon, FileText, X, Loader2 } from 'lucide-react'

import { reportsApi } from '../api/reports'

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const MAX_SIZE_MB = 10

export default function Upload() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error('Only PDF, PNG, and JPG files are allowed')
      return false
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB`)
      return false
    }
    return true
  }

  const handleFile = (f) => {
    if (validateFile(f)) setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    try {
      const report = await reportsApi.upload(file)
      toast.success('Report uploaded successfully!')
      navigate(`/reports/${report.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Upload a medical report
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Upload a PDF, PNG, or JPG. Max {MAX_SIZE_MB}MB.
      </p>

      <div className="mt-6">
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
              dragOver
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/10'
                : 'border-slate-300 hover:border-brand-400 dark:border-slate-700'
            }`}
          >
            <UploadIcon size={36} className="text-slate-400" />
            <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">
              Drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              PDF, PNG, JPG up to {MAX_SIZE_MB}MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="card">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-700/20">
                <FileText size={22} className="text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                disabled={uploading}
                className="text-slate-400 hover:text-red-600"
                aria-label="Remove file"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                disabled={uploading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="btn-primary flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadIcon size={18} />
                    Upload & analyze
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
