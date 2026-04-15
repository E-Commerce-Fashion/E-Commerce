'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import axios from 'axios'
import { signIn } from 'next-auth/react'

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

/* ─── Google SVG Icon ─────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const setUser = useUserStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [focused, setFocused] = useState<string | null>(null)

  const handleForgot = () => toast('Password reset coming soon.')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('All fields required'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (data.success) {
        setUser(data.data.user)
        toast.success('Welcome back!')
        router.replace(data.data.user.role === 'admin' ? '/profile' : '/')
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message || 'Login failed' : 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch {
      toast.error('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Ambient Background Blobs ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(var(--accent-gold-rgb), 0.5), transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -right-20 h-[600px] w-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(var(--accent-rose-rgb), 0.5), transparent 70%)' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Main Card ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[1040px] overflow-hidden rounded-3xl border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="grid md:grid-cols-[1fr_1.1fr]">

          {/* ── Left: Branding Panel ──────────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative hidden md:flex flex-col justify-between overflow-hidden p-10 lg:p-14"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {/* Image backdrop */}
            <div className="absolute inset-0">
              <Image
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop"
                alt="Fashion backdrop"
                fill
                className="object-cover object-center opacity-20"
                sizes="50vw"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--bg-elevated) 0%, transparent 40%, var(--bg-elevated) 100%)' }} />
            </div>

            <div className="relative z-10">
              <motion.div variants={fadeUp} custom={0}>
                <span className="luxury-label flex items-center gap-2">
                  <Sparkles size={12} style={{ color: 'var(--accent-gold)' }} />
                  Member Access
                </span>
              </motion.div>

              <motion.h2 variants={fadeUp} custom={1} className="mt-6 text-5xl lg:text-6xl luxury-heading">
                Welcome<br />
                <span className="italic font-light" style={{ color: 'var(--accent-gold)' }}>Back.</span>
              </motion.h2>

              <motion.p variants={fadeUp} custom={2} className="mt-5 max-w-sm luxury-body text-sm">
                Continue your style journey. Access your curated profile, order history, and wishlist.
              </motion.p>
            </div>

            {/* Feature chips */}
            <motion.div variants={stagger} className="relative z-10 mt-10 space-y-3">
              {[
                'Secure, encrypted checkout',
                'Real-time order tracking',
                'Exclusive member drops',
              ].map((text, i) => (
                <motion.div
                  key={text}
                  variants={fadeUp}
                  custom={i + 3}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{ background: 'var(--glass-bg)', borderColor: 'rgba(var(--accent-gold-rgb), 0.18)', backdropFilter: 'blur(12px)' }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--accent-gold)' }}
                  />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Form Panel ─────────────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14"
            style={{ background: 'var(--bg-surface)' }}
          >
            {/* Header */}
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <h1 className="text-4xl sm:text-5xl luxury-heading">Sign In</h1>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                New here?{' '}
                <Link
                  href="/register"
                  className="font-semibold transition-colors"
                  style={{ color: 'var(--accent-gold)' }}
                >
                  Create an account →
                </Link>
              </p>
            </motion.div>

            {/* Google Sign-In */}
            <motion.div variants={fadeUp} custom={1} className="mb-6">
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 rounded-xl border py-3.5 text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google</span>
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={fadeUp} custom={2} className="mb-6 flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
                or
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {/* Email */}
              <motion.div variants={fadeUp} custom={0}>
                <label
                  className="luxury-label mb-2 block"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div
                  className="relative overflow-hidden rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: focused === 'email' ? 'var(--accent-gold)' : 'var(--border)',
                    boxShadow: focused === 'email' ? `0 0 0 3px rgba(var(--accent-gold-rgb), 0.12)` : 'none',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    className="w-full bg-transparent px-4 py-4 text-sm outline-none placeholder:opacity-40"
                    style={{ color: 'var(--text-primary)' }}
                    placeholder="you@example.com"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeUp} custom={1}>
                <div className="mb-2 flex items-center justify-between">
                  <label className="luxury-label" htmlFor="password">Password</label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-[10px] uppercase tracking-widest font-semibold transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Forgot?
                  </button>
                </div>
                <div
                  className="relative overflow-hidden rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: focused === 'password' ? 'var(--accent-gold)' : 'var(--border)',
                    boxShadow: focused === 'password' ? `0 0 0 3px rgba(var(--accent-gold-rgb), 0.12)` : 'none',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    className="w-full bg-transparent px-4 py-4 pr-12 text-sm outline-none placeholder:opacity-40"
                    style={{ color: 'var(--text-primary)' }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showPassword ? 'hide' : 'show'}
                        initial={{ opacity: 0, rotate: -10 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fadeUp} custom={2} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full overflow-hidden rounded-xl py-4 text-sm font-bold uppercase tracking-widest text-black transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))',
                    boxShadow: `0 10px 32px rgba(var(--accent-gold-rgb), 0.35)`,
                  }}
                >
                  {/* Shine sweep */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>

              <motion.p variants={fadeUp} custom={3} className="pt-1 text-[11px] leading-6 text-center" style={{ color: 'var(--text-muted)' }}>
                By signing in, you agree to our{' '}
                <span className="underline underline-offset-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Terms of Service</span>
                {' '}and{' '}
                <span className="underline underline-offset-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</span>.
              </motion.p>
            </motion.form>
          </motion.div>
        </div>
      </motion.div>
    </main>
  )
}
