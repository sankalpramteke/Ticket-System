'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/clientAuth'
import Link from 'next/link'
import Spinner from '@/components/ui/Spinner'

const roles = ['reporter','admin','technician']

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { users } = await apiFetch('/api/users')
      setUsers(users)
    } catch (e) {
      setError(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Real-time: refetch users when roles change elsewhere
  useEffect(() => {
    function onUsersUpdate() { load() }
    window.addEventListener('sse:users:update', onUsersUpdate)
    return () => window.removeEventListener('sse:users:update', onUsersUpdate)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      {loading && <div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> <span>Loading users...</span></div>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && users.length === 0 && (
        <div className="border rounded-xl p-6 text-center text-gray-600">No users found.</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <Link key={u._id} href={`/admin/users/${u._id}`} className="block bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{u.name}</p>
                <p className="text-sm text-gray-600 truncate">{u.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded border capitalize">{u.role}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
