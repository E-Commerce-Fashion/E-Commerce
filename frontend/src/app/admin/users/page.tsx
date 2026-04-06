'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, UserCog } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { formatCurrency, formatDate } from '@/utils'

type UserRole = 'user' | 'admin'

type AdminUser = {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  phone: string | null
  created_at: string
  order_count: number
  total_spent: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated, user } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [draftRole, setDraftRole] = useState<Record<string, UserRole>>({})

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { limit: 100 }
      if (roleFilter !== 'all') params.role = roleFilter
      if (debouncedSearch) params.search = debouncedSearch

      const { data } = await api.get('/admin/users', { params })
      if (data.success) {
        setUsers((data.data || []) as AdminUser[])
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load users'
        : 'Failed to load users'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (user?.role !== 'admin') {
      router.replace('/profile')
      toast.error('Admin access required')
      return
    }

    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isAuthenticated, router, user?.role, roleFilter, debouncedSearch])

  const updateRole = async (record: AdminUser) => {
    const nextRole = draftRole[record.id] || record.role
    if (nextRole === record.role) return

    if (record.id === user?.id && nextRole === 'user') {
      toast.error('You cannot remove your own admin role')
      return
    }

    setUpdatingId(record.id)
    try {
      const { data } = await api.put(`/admin/users/${record.id}/role`, { role: nextRole })
      if (data.success) {
        setUsers((prev) => prev.map((item) => (
          item.id === record.id ? { ...item, role: nextRole } : item
        )))
        toast.success('User role updated')
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update role'
        : 'Failed to update role'
      toast.error(message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-none border p-5 sm:p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>User management</p>
        <h1 className="mt-2 text-3xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
          Manage Users
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Review customer accounts and grant/revoke admin access.
        </p>
      </motion.div>

      <div className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or phone"
            className="min-w-55 flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          Loading users...
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((record) => {
            const selectedRole = draftRole[record.id] || record.role

            return (
              <div
                key={record.id}
                className="rounded-2xl border p-4 sm:p-5"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {record.name || 'Unnamed user'}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {record.email || 'No email available'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Joined {formatDate(record.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--accent-gold)' }}>Orders</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {record.order_count}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(Number(record.total_spent || 0))} spent
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    value={selectedRole}
                    onChange={(e) => setDraftRole((prev) => ({ ...prev, [record.id]: e.target.value as UserRole }))}
                    className="rounded-xl px-3 py-2 text-sm capitalize outline-none"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => updateRole(record)}
                    disabled={updatingId === record.id || selectedRole === record.role}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                  >
                    {updatingId === record.id ? <Loader2 size={14} className="animate-spin" /> : <UserCog size={14} />}
                    Update Role
                  </button>
                </div>
              </div>
            )
          })}

          {!users.length && (
            <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found for the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
