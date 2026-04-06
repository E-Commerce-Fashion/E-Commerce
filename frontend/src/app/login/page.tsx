'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import axios from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useUserStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('All fields required'); return }

    setLoading(true)
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }
      const { data } = await api.post('/auth/login', payload)
      if (data.success) {
        const loggedInUser = data.data.user
        setUser(loggedInUser)
        toast.success('Welcome back!')
        router.replace(loggedInUser.role === 'admin' ? '/admin' : '/profile')
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Login failed'
        : 'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="page-with-navbar-offset relative min-h-dvh flex items-center justify-center px-3 sm:px-6 lg:px-8 pb-12 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '20%', right: '10%', width: '400px', height: '400px', borderRadius: '50%',
            background: 'rgba(var(--accent-gold-rgb), 0.05)', filter: 'blur(80px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', left: '10%', width: '300px', height: '300px', borderRadius: '50%',
            background: 'rgba(var(--accent-rose-rgb), 0.04)', filter: 'blur(60px)',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-lg"
        >
          <div className="p-7 sm:p-10 rounded-3xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
              >
                FF
              </div>
              <h1 className="text-2xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your FashionForge account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: 'var(--text-primary)' }}
                    autoComplete="email"
                    required
                    id="login-email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: 'var(--text-primary)' }}
                    autoComplete="current-password"
                    required
                    id="login-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} style={{ color: 'var(--text-muted)' }} /> : <Eye size={16} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                id="login-submit"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign In</span> <ArrowRight size={16} /></>}
              </motion.button>
            </form>

            <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--accent-gold)' }}>
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </>
  )
}
