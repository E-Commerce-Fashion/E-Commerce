'use client'

/**
 * AuthSync — mounts on every page (via layout.tsx).
 * On mount it hits /auth/me to verify the backend session is still alive.
 * If the backend returns 401/403 (e.g. token was cleared after logout),
 * it obliterates any stale Zustand + localStorage state so the UI resets.
 */
import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import api from '@/lib/axios'

export function AuthSync() {
  const { isAuthenticated, setUser, clearUser } = useUserStore()

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (data?.data) {
          setUser(data.data)
        }
      } catch (err: any) {
        const status = err?.response?.status
        // 401 = no session, 403 = wrong role — either way clear all client state
        if (status === 401 || status === 403) {
          clearUser()
          if (typeof window !== 'undefined') {
            localStorage.removeItem('fashionforge-user')
          }
        }
      }
    }

    verify()
    // Re-verify whenever the window regains focus (tab switching, OS lock, etc.)
    const onFocus = () => verify()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
