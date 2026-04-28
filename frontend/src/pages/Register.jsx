import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react'

import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register: registerUser, user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await registerUser(data.email, data.fullName, data.password)
      toast.success('Account created! Welcome.')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.'
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Free • No credit card required
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <div className="relative">
              <UserIcon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                className="input pl-10"
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

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
                placeholder="At least 6 characters"
                className="input pl-10"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            <UserPlus size={18} />
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
