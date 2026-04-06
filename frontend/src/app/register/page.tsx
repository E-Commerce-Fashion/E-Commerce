'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import axios from 'axios'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.email || !form.password) { toast.error('All fields required'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (data.success) {
        toast.success('Account created! Please log in.')
        router.replace('/login')
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Registration failed'
        : 'Registration failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="page-with-navbar-offset relative min-h-dvh flex items-center justify-center px-3 sm:px-6 lg:px-8 pb-12 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute left-[-8%] top-[12%] h-104 w-104 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(var(--accent-gold-rgb), 0.14), transparent 68%)', filter: 'blur(24px)' }}
            animate={{ x: [0, 30, 0], y: [0, 18, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-6%] top-[22%] h-88 w-88 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(var(--accent-rose-rgb), 0.12), transparent 68%)', filter: 'blur(26px)' }}
            animate={{ x: [0, -28, 0], y: [0, 22, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 opacity-[0.12]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-lg"
        >
          <div className="p-7 sm:p-10 rounded-3xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="text-left">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mb-4"
                  style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                >
                  FF
                </div>
                <h1 className="text-2xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Join FashionForge today</p>
              </div>

              <div className="shrink-0">
                <p className="text-[11px] uppercase tracking-[0.22em] mb-2 text-right" style={{ color: 'var(--text-muted)' }}>
                  Appearance
                </p>
                <ThemeSwitcher />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <User size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="John Doe" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} autoComplete="name" required id="register-name" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} autoComplete="tel" required id="register-phone" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} autoComplete="email" required id="register-email" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} autoComplete="new-password" required id="register-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} style={{ color: 'var(--text-muted)' }} /> : <Eye size={16} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                  <input type="password" placeholder="Re-enter password" value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} autoComplete="new-password" required id="register-confirm" />
                </div>
              </div>

              <motion.button
                type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                id="register-submit"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Account</span> <ArrowRight size={16} /></>}
              </motion.button>
            </form>

            <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--accent-gold)' }}>
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </>
  )
}
