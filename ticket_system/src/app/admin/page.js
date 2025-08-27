
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/clientAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Skeleton, { SkeletonText } from '@/components/ui/Skeleton'

// Avoid static prerender so useSearchParams works without a Suspense boundary during build
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function AdminDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assignFilter, setAssignFilter] = useState('all') // all | assigned | unassigned
  const [initialized, setInitialized] = useState(false)

  async function load() {
    try {
      const data = await apiFetch('/api/tickets')
      setTickets(data.tickets || [])
    } catch (e) {
      setError(e.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Initialize filters from URL on first render
  useEffect(() => {
    if (initialized) return
    const qp = new URLSearchParams(searchParams?.toString() || '')
    const nextQ = qp.get('q') || ''
    const nextStatus = qp.get('status') || 'all'
    const nextPriority = qp.get('priority') || 'all'
    const nextAssign = qp.get('assign') || 'all'
    setQ(nextQ)
    setStatusFilter(nextStatus)
    setPriorityFilter(nextPriority)
    setAssignFilter(nextAssign)
    setInitialized(true)
  }, [searchParams, initialized])

  // Update URL when filters change
  useEffect(() => {
    if (!initialized) return
    const qp = new URLSearchParams()
    if (q) qp.set('q', q)
    if (statusFilter !== 'all') qp.set('status', statusFilter)
    if (priorityFilter !== 'all') qp.set('priority', priorityFilter)
    if (assignFilter !== 'all') qp.set('assign', assignFilter)
    const qs = qp.toString()
    const href = qs ? `/admin?${qs}` : '/admin'
    router.replace(href)
  }, [q, statusFilter, priorityFilter, assignFilter, initialized, router])

  // Real-time: refresh when any ticket updates
  useEffect(() => {
    function onTicketUpdate() { load() }
    window.addEventListener('sse:tickets:update', onTicketUpdate)
    return () => window.removeEventListener('sse:tickets:update', onTicketUpdate)
  }, [])

  function statusBadgeClass(s) {
    return 'bg-white text-black border-neutral-300 dark:bg-white dark:text-black dark:border-neutral-300'
  }

  function priorityBadgeClass(p) {
    return 'bg-white text-black border-neutral-300 dark:bg-white dark:text-black dark:border-neutral-300'
  }

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (assignFilter === 'assigned' && !t.assigneeId) return false
    if (assignFilter === 'unassigned' && t.assigneeId) return false
    const text = `${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase()
    return text.includes(q.toLowerCase())
  })

  const kpi = {
    total: tickets.length,
    new: tickets.filter(t=>t.status==='new').length,
    in_progress: tickets.filter(t=>t.status==='in_progress').length,
    resolved: tickets.filter(t=>t.status==='resolved').length,
    closed: tickets.filter(t=>t.status==='closed').length,
    unassigned: tickets.filter(t=>!t.assigneeId).length,
    high: tickets.filter(t=>t.priority==='high').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button href="/admin/users" as="a">Users</Button>
          <Button href="/tickets/new" as="a">Create Ticket</Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({length:6}).map((_,i)=> (
              <div key={i} className="bg-white border border-neutral-300 rounded-xl p-3 text-center">
                <Skeleton className="h-3 w-16 mx-auto rounded" />
                <Skeleton className="h-6 w-10 mx-auto rounded mt-2" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-neutral-300 rounded-xl p-3 flex flex-wrap gap-2 items-center">
            <Skeleton className="h-9 w-full sm:w-64 rounded" />
            <Skeleton className="h-9 w-36 rounded" />
            <Skeleton className="h-9 w-36 rounded" />
            <Skeleton className="h-9 w-36 rounded" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i)=> (
              <div key={i} className="bg-white border rounded-xl p-4">
                <Skeleton className="h-5 w-2/3 rounded" />
                <Skeleton className="h-3 w-24 rounded mt-2" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-6 w-24 rounded" />
                  <Skeleton className="h-6 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* KPIs */}
      {!loading && (
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {label:'Total', value:kpi.total},
            {label:'New', value:kpi.new},
            {label:'In Progress', value:kpi.in_progress},
            {label:'Resolved', value:kpi.resolved},
            {label:'Closed', value:kpi.closed},
            {label:'Unassigned', value:kpi.unassigned},
          ].map((c,i)=> (
            <div key={i} className="bg-white border border-neutral-300 rounded-xl p-3 text-center dark:bg-white dark:border-neutral-300">
              <div className="text-xs text-gray-600 dark:text-black">{c.label}</div>
              <div className="text-xl font-semibold text-black">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-neutral-300 rounded-xl p-3 flex flex-wrap gap-2 items-center dark:bg-white dark:border-neutral-300">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by title, desc, category" className="border border-neutral-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[200px] bg-white text-black" />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-2 text-sm bg-white text-black">
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-2 text-sm bg-white text-black">
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={assignFilter} onChange={e=>setAssignFilter(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-2 text-sm bg-white text-black">
          <option value="all">All</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="border rounded-xl p-6 text-center text-gray-600">No tickets yet.</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <Link key={t._id} href={`/tickets/${t._id}`} className="block bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{t.title}</p>
                <p className="text-sm text-gray-600 truncate">{t.category}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge className={statusBadgeClass(t.status)}>{t.status.replace('_',' ')}</Badge>
                  <Badge className={priorityBadgeClass(t.priority)}>priority: {t.priority}</Badge>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div className="px-2 py-1 rounded border inline-block">
                  {t.assigneeId ? 'Assigned' : 'Unassigned'}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
      <AdminDashboardInner />
    </Suspense>
  )
}
