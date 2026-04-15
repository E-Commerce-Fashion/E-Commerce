import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // Send HttpOnly cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Endpoints that should NEVER be retried on 401
const NO_RETRY_URLS = ['/auth/logout', '/auth/refresh', '/auth/login', '/auth/register']

// Response interceptor — auto-refresh on 401, but only for eligible requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url: string = originalRequest?.url ?? ''

    const isNoRetry = NO_RETRY_URLS.some((path) => url.includes(path))

    if (error.response?.status === 401 && !originalRequest._retry && !isNoRetry) {
      originalRequest._retry = true
      try {
        await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
        return api(originalRequest)
      } catch {
        // Refresh failed — clear client state so the UI shows "logged out"
        // Do NOT redirect here: that causes infinite loops on public pages.
        // Protected pages use their own auth guards to redirect to /login.
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fashionforge-user')
          const { useUserStore } = await import('@/store/userStore')
          useUserStore.getState().clearUser()
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
