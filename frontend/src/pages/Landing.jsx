import { Link } from 'react-router-dom'
import { FileText, Sparkles, Shield, ArrowRight } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-700/20 dark:text-brand-100">
          AI-powered • Privacy first
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Understand your medical reports
          <span className="block text-brand-600">in plain language</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Upload lab results, radiology reports, or prescriptions. Get clear explanations,
          flagged values, and questions to ask your doctor — in seconds.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Go to dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">
                Get started free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary">
                I already have an account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={<FileText className="text-brand-600" />}
          title="Upload Any Report"
          desc="PDFs, scanned images — we extract the text automatically."
        />
        <FeatureCard
          icon={<Sparkles className="text-brand-600" />}
          title="Plain-Language AI"
          desc="No more confusing jargon. Get a clear summary you can actually understand."
        />
        <FeatureCard
          icon={<Shield className="text-brand-600" />}
          title="Your Data Stays Yours"
          desc="Reports are tied to your account and only visible to you."
        />
      </section>

      {/* Disclaimer */}
      <section className="mt-16 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <strong>⚠️ Medical Disclaimer:</strong> This tool is for educational purposes only
        and is not a substitute for professional medical advice. Always consult a qualified
        healthcare provider for diagnosis or treatment.
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-700/20">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  )
}
