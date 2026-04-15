'use client'

/**
 * AuthSync — mounts on every page (via layout.tsx).
 * Only calls /auth/me when the Zustand store believes the user is logged in.
 * This prevents needless 401→refresh→redirect loops for unauthenticated visitors.
 * Skips entirely on auth pages (login/register) to avoid redirect loops.
 */
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import api from '@/lib/axios'

// Pages where we should never call /auth/me
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']

export function AuthSync() {
  const pathname = usePathname()
  const { isAuthenticated, setUser, clearUser } = useUserStore()

  useEffect(() => {
    // Never run on auth pages
    if (AUTH_PAGES.some((p) => pathname.startsWith(p))) return
    // Don't hit the network at all if we don't think we're logged in
    if (!isAuthenticated) return

    const verify = async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (data?.data) {
          setUser(data.data)
        }
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          clearUser()
          if (typeof window !== 'undefined') {
            localStorage.removeItem('fashionforge-user')
          }
          // Do NOT redirect — unauthenticated visitors can browse freely
        }
      }
    }

    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAuthenticated])

  return null
}
