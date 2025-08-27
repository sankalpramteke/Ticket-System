'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/clientAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import Skeleton, { SkeletonText } from '@/components/ui/Skeleton'

const statuses = ['new','in_progress','resolved','closed']
const priorities = ['low','medium','high']

function statusBadgeClass(s) {
  return 'bg-white text-black border-neutral-300 dark:bg-white dark:text-black dark:border-neutral-300'
}

function priorityBadgeClass(p) {
  return 'bg-white text-black border-neutral-300 dark:bg-white dark:text-black dark:border-neutral-300'
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('new')
  const [assigneeId, setAssigneeId] = useState('')
  const [me, setMe] = useState(null)
  const [techs, setTechs] = useState([])
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [assignmentNote, setAssignmentNote] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [fbRating, setFbRating] = useState(5)
  const [fbComment, setFbComment] = useState('')
  const [feedbackError, setFeedbackError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [meRes, data] = await Promise.all([
        apiFetch('/api/auth/me'),
        apiFetch(`/api/tickets/${id}`)
      ])
      setMe(meRes.user)
      setTicket(data.ticket)
      setPriority(data.ticket.priority)
      setStatus(data.ticket.status)
      const initialAssignee = typeof data.ticket.assigneeId === 'object' && data.ticket.assigneeId
        ? (data.ticket.assigneeId._id || data.ticket.assigneeId.id)
        : data.ticket.assigneeId
      setAssigneeId(initialAssignee || '')

      // If admin, load technicians list
      if (meRes.user?.role === 'admin') {
        await loadTechs()
      }

      await loadComments()
      await loadFeedback()
    } catch (e) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function loadTechs() {
    try {
      const { users } = await apiFetch('/api/users?role=technician')
      setTechs(users)
    } catch { setTechs([]) }
  }

  useEffect(() => { if (id) load() }, [id])

  // Real-time: refetch on SSE events
  useEffect(() => {
    function onTicketUpdate(e) {
      const { id: changedId } = e.detail || {}
      if (String(changedId) === String(id)) load()
    }
    function onUsersUpdate() {
      if (me?.role === 'admin') loadTechs()
    }
    window.addEventListener('sse:tickets:update', onTicketUpdate)
    window.addEventListener('sse:users:update', onUsersUpdate)
    return () => {
      window.removeEventListener('sse:tickets:update', onTicketUpdate)
      window.removeEventListener('sse:users:update', onUsersUpdate)
    }
  }, [id, me?.role])

  async function loadComments() {
    setLoadingComments(true)
    try {
      const res = await apiFetch(`/api/tickets/${id}/comments`)
      setComments(res.comments || [])
    } catch { setComments([]) } finally { setLoadingComments(false) }
  }

  async function sendMessage() {
    const message = newMessage.trim()
    if (!message) return
    try {
      await apiFetch(`/api/tickets/${id}/comments`, { method: 'POST', body: { message } })
      setNewMessage('')
      await loadComments()
    } catch (e) {
      setError(e.message || 'Failed to send message')
    }
  }

  async function loadFeedback() {
    setLoadingFeedback(true)
    try {
      const res = await apiFetch(`/api/tickets/${id}/feedback`)
      setFeedback(res.feedback || null)
    } catch { setFeedback(null) } finally { setLoadingFeedback(false) }
  }

  async function submitFeedback() {
    setFeedbackError('')
    try {
      await apiFetch(`/api/tickets/${id}/feedback`, { method: 'POST', body: { rating: fbRating, comment: fbComment } })
      setFbComment('')
      await loadFeedback()
    } catch (e) {
      setFeedbackError(e.message || 'Failed to submit feedback')
    }
  }

  async function update(fields) {
    setError('')
    try {
      const res = await apiFetch(`/api/tickets/${id}`, { method: 'PATCH', body: fields })
      setTicket(res.ticket)
      // sync form with server response
      setPriority(res.ticket.priority)
      setStatus(res.ticket.status)
      const nextAssignee = typeof res.ticket.assigneeId === 'object' && res.ticket.assigneeId
        ? (res.ticket.assigneeId._id || res.ticket.assigneeId.id)
        : res.ticket.assigneeId
      setAssigneeId(nextAssignee || '')
    } catch (e) {
      setError(e.message || 'Update failed')
    }
  }

  function getTicketAssigneeId() {
    return typeof ticket.assigneeId === 'object' && ticket.assigneeId
      ? (ticket.assigneeId._id || ticket.assigneeId.id)
      : ticket.assigneeId
  }

  if (loading) return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6">
            <Skeleton className="h-6 w-40 rounded" />
            <div className="mt-4 space-y-3">
              {Array.from({length:4}).map((_,i)=> (
                <div key={i} className="rounded-md p-3 border">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                  <Skeleton className="h-4 w-5/6 rounded mt-2" />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-3 sm:p-4">
            <Skeleton className="h-10 w-28 rounded" />
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-7 w-3/4 rounded" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-6 w-24 rounded" />
                  <Skeleton className="h-6 w-28 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded mt-4" />
                <Skeleton className="h-4 w-2/3 rounded mt-2" />
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({length:3}).map((_,i)=> (
                    <div key={i} className="rounded-lg p-3 border">
                      <Skeleton className="h-3 w-20 rounded" />
                      <Skeleton className="h-4 w-3/4 rounded mt-2" />
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton className="h-10 w-20 rounded" />
            </div>
          </div>
        </div>
        <div className="border rounded-xl p-5 sm:p-7">
          <Skeleton className="h-6 w-32 rounded" />
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 rounded" />
          </div>
          <div className="mt-4 flex justify-end">
            <Skeleton className="h-10 w-40 rounded" />
          </div>
        </div>
        <div className="border rounded-xl p-5 sm:p-7">
          <Skeleton className="h-6 w-28 rounded" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
  if (error) return <p className="text-red-600">{error}</p>
  if (!ticket) return <p>Not found</p>

  const isAdmin = me?.role === 'admin'
  const myId = me ? (me._id || me.id) : ''
  const assigneeIdVal = typeof ticket.assigneeId === 'object' && ticket.assigneeId ? (ticket.assigneeId._id || ticket.assigneeId.id) : ticket.assigneeId
  const isAssignedTech = me?.role === 'technician' && assigneeIdVal && String(assigneeIdVal) === String(myId)
  const canUpdateStatus = isAdmin || isAssignedTech
  const reporterIdVal = typeof ticket.reporterId === 'object' && ticket.reporterId ? (ticket.reporterId._id || ticket.reporterId.id) : ticket.reporterId
  const canPostMessage = isAdmin || isAssignedTech || (myId && String(myId) === String(reporterIdVal))
  const isReporter = myId && String(myId) === String(reporterIdVal)
  const canGiveFeedback = isReporter && ['resolved','closed'].includes(status) && !feedback

  const originalAssignee = getTicketAssigneeId()
  const hasChanges = (
    (canUpdateStatus && status !== ticket.status) ||
    (isAdmin && priority !== ticket.priority) ||
    (isAdmin && String(assigneeId || '') !== String(originalAssignee || ''))
  )

  async function handleSave() {
    const body = {}
    if (canUpdateStatus) body.status = status
    if (isAdmin) {
      body.priority = priority
      body.assigneeId = assigneeId || null
    }
    const prevAssignee = originalAssignee
    const nextAssignee = assigneeId || ''
    await update(body)
    // If admin changed assignee and provided a note, post it as a message
    if (isAdmin && String(nextAssignee) !== String(prevAssignee) && assignmentNote.trim()) {
      const tech = techs.find(t => String(t._id) === String(nextAssignee))
      const techName = tech ? tech.name : 'technician'
      const message = `Assigned to ${techName}. ${assignmentNote.trim()}`
      try { await apiFetch(`/api/tickets/${id}/comments`, { method: 'POST', body: { message } }); await loadComments() } catch {}
      setAssignmentNote('')
    }
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Left column: Messages */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border rounded-xl overflow-hidden dark:bg-white dark:border-neutral-200">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-3">Messages</h2>
            {loadingComments ? (
              <div className="space-y-3">
                {Array.from({length:4}).map((_,i)=> (
                  <div key={i} className="rounded-md p-3 border">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                    </div>
                    <Skeleton className="h-4 w-5/6 rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {comments.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
                {comments.map(c => (
                  <div key={c._id} className="rounded-md p-3 border border-neutral-200 dark:border-neutral-700">
                    <div className="text-sm text-gray-700 flex items-center justify-between dark:text-neutral-200">
                      <span className="font-medium">{c.actor?.name || 'User'}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words">{c.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {canPostMessage && (
            <div className="border-t p-3 sm:p-4 flex items-start gap-2 dark:border-neutral-200">
              <Textarea placeholder="Write a message to the reporter/technician..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} className="flex-1" />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          )}
        </div>
      </div>

      {/* Right column: Summary, Controls, Feedback */}
      <div className="space-y-6 lg:col-span-2">
        {/* Summary Card */}
        <div className="bg-white border border-neutral-300 rounded-xl shadow-sm overflow-hidden dark:bg-white dark:border-neutral-300">
          <div className="p-5 sm:p-7 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold truncate">{ticket.title}</h1>
                <Badge className={statusBadgeClass(ticket.status)}>{ticket.status.replace('_',' ')}</Badge>
                <Badge className={priorityBadgeClass(ticket.priority)}>priority: {ticket.priority}</Badge>
              </div>
              <p className="mt-2 leading-relaxed text-gray-800 dark:text-black break-words">{ticket.description}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-base text-gray-800 dark:text-black">
                <div className="rounded-lg p-3 border border-neutral-200 dark:border-neutral-200"><span className="text-gray-600">Category</span><div className="font-medium break-words">{ticket.category}</div></div>
                <div className="rounded-lg p-3 border border-neutral-200 dark:border-neutral-200"><span className="text-gray-600">Technician</span><div className="font-medium break-words">{ticket.assigneeId?.name || 'Unassigned'}</div></div>
                <div className="rounded-lg p-3 border border-neutral-200 dark:border-neutral-200"><span className="text-gray-600">Reporter</span><div className="font-medium break-words">{ticket.reporterId?.name || ticket.reporterId}</div></div>
              </div>
            </div>
            <Button onClick={() => router.back()}>Back</Button>
          </div>
        </div>

        {(isAdmin || isAssignedTech) && (
          <div className="border rounded-xl p-4 sm:p-6 space-y-4 dark:border-neutral-700">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h2 className="font-medium">Status</h2>
                <Select disabled={!canUpdateStatus} value={status} onChange={e=>setStatus(e.target.value)}>
                  {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <h2 className="font-medium">Priority</h2>
                  <Select value={priority} onChange={e=>setPriority(e.target.value)}>
                    {priorities.map(p=> <option key={p} value={p}>{p}</option>)}
                  </Select>
                </div>
              )}

              {isAdmin && (
                <div className="space-y-2">
                  <h2 className="font-medium">Assign</h2>
                  <Select value={assigneeId} onChange={e=>setAssigneeId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {techs.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <h3 className="font-medium">Assignment note (optional)</h3>
                <Input placeholder="This will be sent to the reporter" value={assignmentNote} onChange={e=>setAssignmentNote(e.target.value)} />
              </div>
            )}

            <div className="flex justify-end">
              <Button disabled={!hasChanges} onClick={handleSave}>Update Changes</Button>
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="border border-neutral-300 rounded-xl overflow-hidden dark:border-neutral-300">
          <div className="p-5 sm:p-7 space-y-4">
            <h2 className="text-lg font-semibold">Feedback</h2>
            {loadingFeedback ? (
              <div className="rounded-md p-3 border">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-6 w-24 rounded mt-2" />
                <Skeleton className="h-4 w-5/6 rounded mt-3" />
              </div>
            ) : feedback ? (
              <div className="rounded-md p-3 border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-gray-600 dark:text-neutral-300">Rating</p>
                <p className="text-xl font-semibold">{feedback.rating} / 5</p>
                {feedback.comment && (
                  <p className="mt-2 whitespace-pre-wrap break-words">{feedback.comment}</p>
                )}
              </div>
            ) : canGiveFeedback ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rating</label>
                  <Select value={fbRating} onChange={e=>setFbRating(Number(e.target.value))}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Comment (optional)</label>
                  <Textarea value={fbComment} onChange={e=>setFbComment(e.target.value)} placeholder="Share your experience" className="break-words" />
                </div>
                {feedbackError && <p className="text-sm text-red-600">{feedbackError}</p>}
                <div className="flex justify-end">
                  <Button onClick={submitFeedback}>Submit Feedback</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Feedback will be available after the ticket is resolved.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
