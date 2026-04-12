'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import axios from 'axios'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!form.firstName || !form.email || !form.password) {
      toast.error('Essential fields are required')
      return
    }

    setLoading(true)
    try {
      // For the backend, we combine names and provide a mock phone as it's required by the existing logic
      const payload = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: '1234567890', // Default phone for now since it's not in the new UI
      }

      const { data } = await api.post('/auth/register', payload)
      if (data.success) {
        toast.success('Journey begins! Please sign in.')
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

  const reveal = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <main className="auth-centered-page auth-shell relative overflow-hidden bg-[#070a18] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-14%] right-[-8%] h-136 w-136 rounded-full bg-violet-700/12 blur-[120px]" />
        <div className="absolute bottom-[-18%] left-[-12%] h-136 w-136 rounded-full bg-cyan-500/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative z-10 mx-auto grid w-full max-w-6xl overflow-hidden rounded-4xl border border-white/12 bg-[#0a0d1d]/80 shadow-[0_34px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:grid-cols-[1.02fr_0.98fr]"
      >
        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative border-b border-white/10 bg-[#0b1026]/80 px-6 py-8 sm:px-8 sm:py-10 md:border-b-0 md:border-r md:px-10 md:py-12"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-8 top-0 h-52 w-52 rounded-full bg-violet-600/18 blur-[90px]" />
            <div className="absolute right-0 bottom-0 h-44 w-44 rounded-full bg-cyan-500/14 blur-[86px]" />
          </div>

          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/16 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200/90">
              <Sparkles size={12} className="text-violet-300" />
              New Member Setup
            </p>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold leading-[0.95] text-white">
              Build
              <br />
              Your Profile
            </h2>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-7 text-slate-300/85">
              Set up your account to unlock personalized picks, faster checkout, and complete order visibility.
            </p>

            <div className="mt-8 space-y-3">
              {[{ icon: ShieldCheck, text: 'Protected account and secure payment flow' }, { icon: Truck, text: 'Priority dispatch tracking for every order' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center bg-violet-500/18 text-violet-200">
                    <Icon size={15} />
                  </span>
                  <p className="text-sm text-slate-200/90">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45, delay: 0.14 }}
          className="px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12"
        >
          <div className="mb-7 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl leading-none font-bold text-white">Create Account</h1>
            <p className="mt-3 text-sm text-slate-400">
              Already a member?{' '}
              <Link href="/login" className="text-slate-200 hover:text-violet-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
            className="space-y-5"
          >
            <motion.div variants={reveal} className="space-y-2">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-400 focus:bg-white/7"
                placeholder="you@example.com"
              />
            </motion.div>

            <motion.div variants={reveal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">First Name</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-400 focus:bg-white/7"
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-400 focus:bg-white/7"
                  placeholder="Last name"
                />
              </div>
            </motion.div>

            <motion.div variants={reveal} className="space-y-2 relative">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 pr-11 text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-400 focus:bg-white/7"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-3.5 text-slate-500 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>

            <motion.div variants={reveal} className="space-y-2">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">Date of Birth (Optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr] gap-3">
                <select
                  value={form.dobMonth}
                  onChange={(e) => setForm({ ...form, dobMonth: e.target.value })}
                  className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 text-slate-200 outline-none transition-all focus:border-violet-400 focus:bg-white/7"
                >
                  <option value="" className="bg-[#0a0b16]">Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                    <option key={m} value={m} className="bg-[#0a0b16]">{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Day"
                  value={form.dobDay}
                  onChange={(e) => setForm({ ...form, dobDay: e.target.value })}
                  className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 text-white text-center outline-none transition-all placeholder:text-slate-500 focus:border-violet-400 focus:bg-white/7"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={form.dobYear}
                  onChange={(e) => setForm({ ...form, dobYear: e.target.value })}
                  className="auth-input w-full border border-white/18 bg-white/5 px-4 py-3.5 text-white text-center outline-none transition-all placeholder:text-slate-500 focus:border-violet-400 focus:bg-white/7"
                />
              </div>
            </motion.div>

            <motion.div variants={reveal} className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-linear-to-r from-violet-600 via-violet-500 to-indigo-500 px-6 py-3.5 text-lg text-white shadow-[0_16px_34px_rgba(99,70,235,0.45)] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={17} />
                  </>
                )}
              </motion.button>
            </motion.div>

            <motion.p variants={reveal} className="pt-1 text-xs leading-6 text-slate-400/90">
              By creating an account, you agree to our platform security and usage guidelines.
            </motion.p>
          </motion.form>
        </motion.div>
      </motion.section>
    </main>
  )
}
