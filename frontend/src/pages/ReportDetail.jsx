import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Trash2, Calendar, FileText, Sparkles,
  AlertCircle, MessageSquare, Loader2, RefreshCw,
  Activity, Hash,
} from 'lucide-react'

import { reportsApi } from '../api/reports'

const PROCESSING_MARKERS = ['⏳ Analyzing', '⏳ Re-analyzing']

// ==================== KEYWORD HIGHLIGHTING ====================
const KEYWORD_PATTERNS = [
  // Numbers with units (lab values, dosages) — emerald
  {
    pattern: /\b(\d+\.?\d*)\s?(mg\/dL|mg|mL|g\/dL|U\/L|mIU\/L|mmol\/L|mEq\/L|%|bpm|mmHg|kg|lbs|cm|°C|°F)\b/gi,
    className: 'bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono text-sm dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  // Dates — sky
  {
    pattern: /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/g,
    className: 'bg-sky-100 text-sky-900 px-1.5 py-0.5 rounded font-mono text-sm dark:bg-sky-900/40 dark:text-sky-200',
  },
  // Medications — purple
  {
    pattern: /\b(Tylenol|Motrin|Ibuprofen|Acetaminophen|Aspirin|Penicillin|Amoxicillin|Flexeril|Percocet|Vicodin|Oxycodone|Morphine|Insulin|Metformin|Lisinopril|Atorvastatin|Statin|Antibiotic|antibiotic|prescription|prescribed|medication|tablet|capsule|injection)\b/gi,
    className: 'bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-medium dark:bg-purple-900/40 dark:text-purple-200',
  },
  // Critical/emergency terms — rose
  {
    pattern: /\b(pain|severe|acute|chronic|emergency|urgent|critical|abnormal|elevated|high|low|positive|negative|deficient|excessive|fracture|tumor|cancer|infection|inflammation|bleeding|hemorrhage)\b/gi,
    className: 'bg-rose-100 text-rose-900 px-1 py-0.5 rounded font-medium dark:bg-rose-900/40 dark:text-rose-200',
  },
  // Diagnoses & conditions — amber
  {
    pattern: /\b(diagnosis|diagnosed|condition|syndrome|disease|disorder|radiculopathy|hypertension|diabetes|cholesterol|arthritis|migraine|asthma|pneumonia|strain|sprain|cervical|lumbar|thoracic)\b/gi,
    className: 'bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-medium dark:bg-amber-900/40 dark:text-amber-200',
  },
  // Medical professionals — indigo
  {
    pattern: /\b(Dr\.|Doctor|Physician|MD|D\.O\.|Nurse|RN|Specialist|Surgeon|Cardiologist|Neurologist|Radiologist)\b/g,
    className: 'bg-indigo-100 text-indigo-900 px-1 py-0.5 rounded font-medium dark:bg-indigo-900/40 dark:text-indigo-200',
  },
]

function highlightMedicalText(text) {
  if (!text) return ''

  const matches = []
  KEYWORD_PATTERNS.forEach(({ pattern, className }) => {
    const regex = new RegExp(pattern.source, pattern.flags)
    let m
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        className,
      })
    }
  })

  matches.sort((a, b) => a.start - b.start)
  const filtered = []
  let lastEnd = 0
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m)
      lastEnd = m.end
    }
  }

  const result = []
  let cursor = 0
  filtered.forEach((m, i) => {
    if (m.start > cursor) result.push(text.slice(cursor, m.start))
    result.push(<span key={i} className={m.className}>{m.text}</span>)
    cursor = m.end
  })
  if (cursor < text.length) result.push(text.slice(cursor))
  return result
}

// ==================== MAIN ====================
export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reprocessing, setReprocessing] = useState(false)
  const pollRef = useRef(null)

  const isProcessing = (r) =>
    r && PROCESSING_MARKERS.some((m) => (r.simplified_text || '').includes(m))

  const fetchReport = async () => {
    try {
      const data = await reportsApi.get(id)
      setReport(data)
      return data
    } catch {
      toast.error('Report not found')
      return null
    }
  }

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const data = await fetchReport()
      if (cancelled) return
      setLoading(false)
      if (data && isProcessing(data)) {
        pollRef.current = setInterval(async () => {
          const fresh = await fetchReport()
          if (fresh && !isProcessing(fresh)) {
            clearInterval(pollRef.current)
            pollRef.current = null
            toast.success('Analysis complete!')
          }
        }, 3000)
      }
    }
    init()
    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this report? This cannot be undone.')) return
    try {
      await reportsApi.delete(id)
      toast.success('Report deleted')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleReprocess = async () => {
    setReprocessing(true)
    try {
      const updated = await reportsApi.reprocess(id)
      setReport(updated)
      toast('Re-analyzing...', { icon: '⏳' })
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        const fresh = await fetchReport()
        if (fresh && !isProcessing(fresh)) {
          clearInterval(pollRef.current)
          pollRef.current = null
          toast.success('Analysis complete!')
        }
      }, 3000)
    } catch {
      toast.error('Failed to reprocess')
    } finally {
      setReprocessing(false)
    }
  }

  const highlightedSummary = useMemo(
    () => highlightMedicalText(report?.simplified_text || ''),
    [report?.simplified_text]
  )
  const highlightedOriginal = useMemo(
    () => highlightMedicalText(report?.original_text || ''),
    [report?.original_text]
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Report not found.</p>
        <Link to="/dashboard" className="btn-primary mt-4">
          <ArrowLeft size={18} /> Back to dashboard
        </Link>
      </div>
    )
  }

  let flagged = []
  let questions = []
  try { flagged = JSON.parse(report.flagged_values || '[]') } catch {}
  try { questions = JSON.parse(report.suggested_questions || '[]') } catch {}

  const processing = isProcessing(report)
  const failed = (report.simplified_text || '').includes('AI analysis failed')

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-brand-600 dark:text-slate-400"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      {/* GRADIENT HEADER CARD */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-sky-500 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <FileText size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{report.filename}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
              <Calendar size={14} />
              Uploaded {new Date(report.created_at).toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Stat icon={<Hash size={12} />} label={`${(report.original_text || '').length} chars extracted`} />
              {flagged.length > 0 && <Stat icon={<AlertCircle size={12} />} label={`${flagged.length} flagged values`} />}
              {questions.length > 0 && <Stat icon={<MessageSquare size={12} />} label={`${questions.length} questions`} />}
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-white/20 p-2 backdrop-blur transition-colors hover:bg-red-500"
            aria-label="Delete report"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* PROCESSING / FAILED BANNER */}
      {processing && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-sky-50 p-4 dark:border-brand-700/30 dark:from-brand-700/10 dark:to-sky-700/10">
          <Loader2 className="animate-spin text-brand-600" size={22} />
          <div>
            <p className="font-semibold text-brand-900 dark:text-brand-100">AI is analyzing your report</p>
            <p className="text-sm text-brand-700 dark:text-brand-200">This usually takes 5-15 seconds.</p>
          </div>
        </div>
      )}

      {failed && !processing && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950">
          <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={22} />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-100">AI analysis failed</p>
            <p className="text-sm text-rose-700 dark:text-rose-200">
              Check your GROQ_API_KEY in the backend .env file, then click "Re-run analysis".
            </p>
          </div>
        </div>
      )}

      {/* PARALLEL 2-COLUMN LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — AI ANALYSIS */}
        <div className="space-y-6">
          <Section icon={<Sparkles className="text-brand-600" />} title="Plain-language explanation" accent="brand">
            <div className="leading-relaxed text-slate-700 dark:text-slate-300">
              {processing || failed ? (
                <p className="whitespace-pre-wrap">{report.simplified_text}</p>
              ) : (
                <div className="whitespace-pre-wrap">{highlightedSummary}</div>
              )}
            </div>
            {!processing && (
              <button
                onClick={handleReprocess}
                disabled={reprocessing}
                className="btn-secondary mt-4 text-sm"
              >
                <RefreshCw size={14} className={reprocessing ? 'animate-spin' : ''} />
                Re-run analysis
              </button>
            )}
          </Section>

          {flagged.length > 0 && (
            <Section icon={<Activity className="text-amber-600" />} title="Values to discuss with your doctor" accent="amber">
              <div className="space-y-3">
                {flagged.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/40 dark:to-orange-950/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-amber-900 dark:text-amber-100">{item.name}</div>
                      <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-700 dark:text-amber-100">
                        {item.value}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {questions.length > 0 && (
            <Section icon={<MessageSquare className="text-violet-600" />} title="Questions to ask your doctor" accent="violet">
              <ol className="space-y-2.5">
                {questions.map((q, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 p-3.5 dark:from-violet-950/40 dark:to-fuchsia-950/40"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">{q}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        {/* RIGHT — ORIGINAL TEXT */}
        <div>
          <Section icon={<FileText className="text-slate-600" />} title="Original extracted text" accent="slate" sticky>
            <Legend />
            <div className="mt-4 max-h-[700px] overflow-auto rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {highlightedOriginal || '(processing or no text extracted)'}
              </div>
            </div>
          </Section>
        </div>
      </div>

      <p className="mt-8 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:from-amber-950 dark:to-yellow-950 dark:text-amber-200">
        ⚠️ <strong>Disclaimer:</strong> This is for informational purposes only. Always consult your doctor for medical advice.
      </p>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

const ACCENT_STYLES = {
  brand: 'border-l-brand-500 dark:border-l-brand-400',
  amber: 'border-l-amber-500 dark:border-l-amber-400',
  violet: 'border-l-violet-500 dark:border-l-violet-400',
  slate: 'border-l-slate-400 dark:border-l-slate-500',
}

function Section({ icon, title, children, accent = 'brand', sticky = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${ACCENT_STYLES[accent]} ${
        sticky ? 'lg:sticky lg:top-20' : ''
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Stat({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs backdrop-blur">
      {icon}
      {label}
    </span>
  )
}

function Legend() {
  const items = [
    { color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200', label: 'Lab values' },
    { color: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200', label: 'Dates' },
    { color: 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200', label: 'Medications' },
    { color: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200', label: 'Critical terms' },
    { color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200', label: 'Diagnoses' },
    { color: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200', label: 'Doctors' },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item.label} className={`rounded px-1.5 py-0.5 text-xs font-medium ${item.color}`}>
          {item.label}
        </span>
      ))}
    </div>
  )
}