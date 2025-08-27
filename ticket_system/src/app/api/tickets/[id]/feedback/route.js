import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { getUserFromRequest } from '@/lib/jwt'
import Activity from '@/models/Activity'
import Ticket from '@/models/Ticket'
import { getEventBus } from '@/lib/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function toId(v){ return v && typeof v === 'object' ? String(v._id || v.id) : (v != null ? String(v) : '') }

async function canRead(user, ticket) {
  const reporterId = toId(ticket.reporterId)
  const assigneeId = toId(ticket.assigneeId)
  return user.role === 'admin' || reporterId === String(user.id) || (assigneeId && assigneeId === String(user.id))
}

export async function GET(req, { params }) {
  await connectToDB()
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const ticket = await Ticket.findById(id).lean()
  if (!ticket) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (!(await canRead(user, ticket))) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const feedback = await Activity.findOne({ ticketId: id, type: 'feedback' }).lean()
  return NextResponse.json({ feedback: feedback ? { rating: feedback.payload?.rating, comment: feedback.payload?.comment, createdAt: feedback.createdAt } : null })
}

export async function POST(req, { params }) {
  await connectToDB()
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const ticket = await Ticket.findById(id)
  if (!ticket) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const reporterId = toId(ticket.reporterId)
  if (String(user.id) !== String(reporterId)) return NextResponse.json({ message: 'Only reporter can give feedback' }, { status: 403 })
  if (!['resolved','closed'].includes(ticket.status)) return NextResponse.json({ message: 'Feedback allowed after resolution' }, { status: 400 })

  const body = await req.json()
  const rating = Number(body?.rating)
  const comment = (body?.comment || '').trim()
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ message: 'Rating must be 1-5' }, { status: 400 })

  // single feedback per ticket
  const existing = await Activity.findOne({ ticketId: id, type: 'feedback' })
  if (existing) return NextResponse.json({ message: 'Feedback already submitted' }, { status: 400 })

  const activity = await Activity.create({ ticketId: id, actorId: user.id, type: 'feedback', payload: { rating, comment } })
  try { getEventBus().emit('tickets:update', { id }) } catch {}

  return NextResponse.json({ ok: true, createdAt: activity.createdAt })
}
