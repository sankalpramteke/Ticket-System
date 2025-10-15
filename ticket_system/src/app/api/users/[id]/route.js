import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { getUserFromRequest } from '@/lib/jwt'
import User from '@/models/User'
import { getEventBus } from '@/lib/events'
import { notifyProfileUpdated } from '@/services/notificationService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  await connectToDB()
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const user = await User.findById(id, { name: 1, email: 1, role: 1, department: 1, createdAt: 1, updatedAt: 1 }).lean()
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(req, { params }) {
  await connectToDB()
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const updates = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.email === 'string' && body.email.trim()) updates.email = body.email.trim().toLowerCase()
  if (typeof body.department === 'string') updates.department = body.department
  if (typeof body.role === 'string') {
    const allowed = ['reporter','admin','technician']
    if (!allowed.includes(body.role)) return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
    updates.role = body.role
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ message: 'No changes' }, { status: 400 })

  const updated = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, projection: { name:1, email:1, role:1, department:1 } })
  if (!updated) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  try { getEventBus().emit('users:update', { id: updated._id.toString(), fields: updates }) } catch {}

  // Send email notification to the user (best-effort)
  try {
    const admin = await User.findById(auth.id).select('name').lean()
    const changes = []
    if (updates.name) changes.push(`Name updated to: ${updates.name}`)
    if (updates.email) changes.push(`Email updated to: ${updates.email}`)
    if (updates.department) changes.push(`Department updated to: ${updates.department}`)
    if (updates.role) changes.push(`Role updated to: ${updates.role}`)
    if (changes.length > 0) {
      await notifyProfileUpdated(updated, changes, admin)
    }
  } catch (e) {
    console.warn('[mail] profile update notification failed:', e?.message)
  }

  return NextResponse.json({ user: updated })
}
