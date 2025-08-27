import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { getUserFromRequest } from '@/lib/jwt'
import Activity from '@/models/Activity'
import Ticket from '@/models/Ticket'
import User from '@/models/User'
import { getEventBus } from '@/lib/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function canReadTicket(user, ticket) {
  const toId = (v) => v && typeof v === 'object' ? String(v._id || v.id) : (v != null ? String(v) : '')
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
  if (!(await canReadTicket(user, ticket))) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const comments = await Activity.find({ ticketId: id, type: 'comment' })
    .sort({ createdAt: 1 })
    .lean()

  // attach actor name
  const actorIds = [...new Set(comments.map(c => String(c.actorId)))]
  const actors = await User.find({ _id: { $in: actorIds } }, { name: 1, email: 1 }).lean()
  const actorMap = Object.fromEntries(actors.map(a => [String(a._id), a]))
  const withActors = comments.map(c => ({
    _id: c._id,
    message: c.payload?.message || '',
    createdAt: c.createdAt,
    actor: actorMap[String(c.actorId)] || { name: 'User', email: '' },
  }))

  return NextResponse.json({ comments: withActors })
}

export async function POST(req, { params }) {
  await connectToDB()
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const ticket = await Ticket.findById(id).lean()
  if (!ticket) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (!(await canReadTicket(user, ticket))) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const message = (body?.message || '').trim()
  if (!message) return NextResponse.json({ message: 'Message required' }, { status: 400 })

  const activity = await Activity.create({ ticketId: id, actorId: user.id, type: 'comment', payload: { message } })
  try { getEventBus().emit('tickets:update', { id }) } catch {}

  return NextResponse.json({ ok: true, id: activity._id })
}
