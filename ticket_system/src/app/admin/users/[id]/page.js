'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/clientAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'

const roles = ['reporter','admin','technician']

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('reporter')
  const [department, setDepartment] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { user } = await apiFetch(`/api/users/${id}`)
      setUser(user)
      setName(user.name || '')
      setEmail(user.email || '')
      setRole(user.role || 'reporter')
      setDepartment(user.department || '')
    } catch (e) {
      setError(e.message || 'Failed to load user')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (id) load() }, [id])

  const hasChanges = user && (
    name !== user.name ||
    email !== user.email ||
    role !== user.role ||
    department !== (user.department || '')
  )

  async function save() {
    setError('')
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'PATCH', body: { name, email, role, department } })
      setUser(res.user)
      setName(res.user.name)
      setEmail(res.user.email)
      setRole(res.user.role)
      setDepartment(res.user.department || '')
    } catch (e) {
      setError(e.message || 'Failed to save changes')
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> <span>Loading user...</span></div>
  if (error) return <p className="text-red-600">{error}</p>
  if (!user) return <p>Not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage User</h1>
        <Button onClick={() => router.back()}>Back</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 border rounded-xl p-4 sm:p-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <Input value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <Input value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Role</label>
          <Select value={role} onChange={e=>setRole(e.target.value)}>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Department</label>
          <Input value={department} onChange={e=>setDepartment(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button disabled={!hasChanges} onClick={save}>Save Changes</Button>
      </div>
    </div>
  )
}
