'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/clientAuth'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      setError('')
      setLoading(true)
      try {
        const data = await apiFetch('/api/tickets?mine=reporter')
        setTickets(data.tickets || [])
      } catch (e) {
        setError(e.message || 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function statusBadgeClass(s) {
    switch (s) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  function priorityBadgeClass(p) {
    switch (p) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Tickets</h1>
      {loading && <div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> <span>Loading tickets...</span></div>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && tickets.length === 0 && (
        <div className="border rounded-xl p-6 text-center text-gray-600">No tickets yet. <Link className="underline" href="/tickets/new">Create one</Link>.</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map(t => (
          <Link key={t._id} href={`/tickets/${t._id}`} className="block bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="min-w-0">
              <p className="font-semibold truncate">{t.title}</p>
              <p className="text-sm text-gray-600 truncate">{t.category}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge className={statusBadgeClass(t.status)}>{t.status.replace('_',' ')}</Badge>
                <Badge className={priorityBadgeClass(t.priority)}>priority: {t.priority}</Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
