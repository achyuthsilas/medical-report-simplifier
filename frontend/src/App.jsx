import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import ReportDetail from './pages/ReportDetail'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes — wrapped in ProtectedRoute */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <ReportDetail />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="mx-auto max-w-md px-4 py-20 text-center">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">404</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Page not found.</p>
            </div>
          }
        />
      </Routes>
    </div>
  )
}
