import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  // Already logged in? Redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Log in to access your medical reports
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="input pl-10"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
                })}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="input pl-10"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
