import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Ticket from '@/models/Ticket';
import Activity from '@/models/Activity';
import { getUserFromRequest } from '@/lib/jwt';
import User from '@/models/User';
import { notifyTicketCreated } from '@/services/notificationService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const category = searchParams.get('category');
  const assigneeId = searchParams.get('assigneeId');
  const mine = searchParams.get('mine');

  const q = {};
  if (status) q.status = status;
  if (priority) q.priority = priority;
  if (category) q.category = category;
  if (assigneeId) q.assigneeId = assigneeId;
  if (mine === 'reporter') q.reporterId = user.id;
  if (mine === 'assignee') q.assigneeId = user.id;

  // If no user-scoped filter provided, only admins can list all tickets.
  const isUserScoped = !!(mine || assigneeId);
  if (!isUserScoped && user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const tickets = await Ticket.find(q).sort({ createdAt: -1 }).limit(200);
  return NextResponse.json({ tickets });
}

export async function POST(req) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, category, subCategory, issuerName, room, department } = body || {};
  if (!title || !description || !category || !subCategory || !issuerName || !room || !department) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }

  const allowedDepartments = ['DIC','CSE','Civil','Mechanical','AI','AIML','MBA','Electrical','Electronics','ETC'];
  if (!allowedDepartments.includes(department)) {
    return NextResponse.json({ message: 'Invalid department' }, { status: 400 });
  }

  // Only admins can set priority during creation; everyone else defaults to 'medium'.
  const allowedPriorities = ['low','medium','high'];
  const priority = (user.role === 'admin' && allowedPriorities.includes(body?.priority)) ? body.priority : 'medium';

  const ticket = await Ticket.create({ title, description, category, subCategory, issuerName, priority, room, department, reporterId: user.id });
  await Activity.create({ ticketId: ticket._id, actorId: user.id, type: 'create' });

  // Notify reporter and admins via email (best-effort)
  try {
    const reporter = await User.findById(user.id).select('_id name email').lean();
    await notifyTicketCreated(ticket, reporter);
  } catch (e) {
    console.warn('[mail] create ticket notification failed:', e?.message)
  }
  return NextResponse.json({ ticket }, { status: 201 });
}
