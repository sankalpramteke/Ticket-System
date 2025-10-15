import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Ticket from '@/models/Ticket';
import Activity from '@/models/Activity';
import { getUserFromRequest } from '@/lib/jwt';
import { getEventBus } from '@/lib/events';
import User from '@/models/User';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ticket = await Ticket.findById(id)
    .populate({ path: 'assigneeId', select: 'name email' })
    .populate({ path: 'reporterId', select: 'name email' })
    .lean();
  if (!ticket) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const toId = (v) => v && typeof v === 'object' ? String(v._id || v.id) : (v != null ? String(v) : '')
  const reporterId = toId(ticket.reporterId)
  const assigneeId = toId(ticket.assigneeId)
  const canRead = user.role === 'admin' || reporterId === String(user.id) || (assigneeId && assigneeId === String(user.id));
  if (!canRead) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ ticket });
}

export async function PATCH(req, { params }) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ticket = await Ticket.findById(id);
  if (!ticket) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updates = {};
  const requestedStatus = body.status;

  if (user.role === 'admin') {
    if (body.priority) updates.priority = body.priority;
    if (typeof body.assigneeId !== 'undefined') updates.assigneeId = body.assigneeId || null;
    if (requestedStatus) {
      // Admin can close only after technician has resolved the ticket
      if (requestedStatus === 'closed' && ticket.status !== 'resolved') {
        return NextResponse.json({ message: 'Ticket can be closed by admin only after it is resolved.' }, { status: 400 });
      }
      updates.status = requestedStatus;
    }
  }

  const toId2 = (v) => v && typeof v === 'object' ? String(v._id || v.id) : (v != null ? String(v) : '')
  const assignedTo = toId2(ticket.assigneeId)
  if (user.role === 'technician' && assignedTo && assignedTo === String(user.id)) {
    if (requestedStatus) {
      if (requestedStatus === 'closed') {
        return NextResponse.json({ message: 'Technicians cannot close tickets.' }, { status: 403 });
      }
      updates.status = requestedStatus;
    }
  }

  // Reporters are read-only; no changes allowed.

  if (Object.keys(updates).length === 0) return NextResponse.json({ message: 'No permitted changes' }, { status: 400 });

  await Ticket.findByIdAndUpdate(id, { $set: updates }, { new: false });
  // Return fresh populated doc
  const updated = await Ticket.findById(id)
    .populate({ path: 'assigneeId', select: 'name email' })
    .populate({ path: 'reporterId', select: 'name email' })
    .lean();

  const activityType = body.status ? 'update_status' : body.priority ? 'update_priority' : 'assign';
  await Activity.create({ ticketId: ticket._id, actorId: user.id, type: activityType, payload: updates });
  // Also log a visible comment when admin closes the ticket
  if (user.role === 'admin' && requestedStatus === 'closed') {
    await Activity.create({ ticketId: ticket._id, actorId: user.id, type: 'comment', payload: { message: 'Admin closed the ticket', system: true } });
    try { getEventBus().emit('tickets:update', { id: ticket._id.toString(), fields: { status: 'closed' } }) } catch {}
  }

  // Emit SSE event to notify clients a ticket has changed
  try { getEventBus().emit('tickets:update', { id: ticket._id.toString(), fields: updates }) } catch {}

  // Email notifications (best-effort): notify reporter and admins
  try {
    const [reporter, admins] = await Promise.all([
      User.findById(updated.reporterId?._id || updated.reporterId).select('name email').lean(),
      User.find({ role: 'admin' }).select('name email').lean(),
    ])
    const adminEmails = (admins || []).map(a => a.email).filter(Boolean)
    const ticketUrl = `${process.env.APP_BASE_URL || ''}/tickets/${updated._id}`
    const changes = []
    if (typeof updates.status !== 'undefined') changes.push(`Status: ${ticket.status} -> ${updates.status}`)
    if (typeof updates.priority !== 'undefined') changes.push(`Priority: ${ticket.priority} -> ${updates.priority}`)
    if (Object.prototype.hasOwnProperty.call(updates, 'assigneeId')) {
      const prev = ticket.assigneeId ? 'assigned' : 'unassigned'
      const next = updates.assigneeId ? 'assigned' : 'unassigned'
      changes.push(`Assignment: ${prev} -> ${next}`)
    }
    const subject = `Ticket Updated #${updated._id.toString().slice(-6)}`
    const details = `
Ticket: ${updated._id}
Issuer: ${updated.issuerName}
Category: ${updated.category} / ${updated.subCategory}
Department: ${updated.department}
Room: ${updated.room}
Status: ${updated.status}
Priority: ${updated.priority}
Changes: ${changes.join('; ')}
Link: ${ticketUrl}
`.trim()
    if (reporter?.email) {
      await sendMail({ to: reporter.email, subject, text: details })
    }
    if (adminEmails.length) {
      await sendMail({ to: adminEmails.join(','), subject, text: details })
    }
  } catch (e) {
    console.warn('[mail] update ticket notification failed:', e?.message)
  }

  return NextResponse.json({ ticket: updated });
}
