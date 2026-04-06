'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const themes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (theme === 'dim') {
      setTheme('dark')
    }
  }, [theme, setTheme])

  if (!mounted) return <div className="skeleton rounded-full" style={{ padding: '0.5rem 0.75rem' }} />

  return (
    <div
      role="group"
      aria-label="Select theme"
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      {themes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          title={label}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === id}
          className="flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200"
          style={{
            background: theme === id ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))' : 'transparent',
            color: theme === id ? '#0A0A0F' : 'var(--text-muted)',
          }}
        >
          <Icon size={14} strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}
