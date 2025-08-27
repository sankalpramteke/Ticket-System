import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import User from '@/models/User';
import { getEventBus } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  await connectToDB();
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = params;
  const body = await req.json();
  const { role } = body || {};
  const allowed = ['reporter','admin','technician'];
  if (!allowed.includes(role)) return NextResponse.json({ message: 'Invalid role' }, { status: 400 });

  const updated = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true, projection: { name:1, email:1, role:1 } });
  if (!updated) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Notify subscribers that users changed (e.g., technicians list)
  try { getEventBus().emit('users:update', { id: updated._id.toString(), role: updated.role }) } catch {}

  return NextResponse.json({ user: updated });
}
