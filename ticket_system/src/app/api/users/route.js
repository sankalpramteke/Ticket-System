import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const q = role ? { role } : {};

  const users = await User.find(q, { name: 1, email: 1, role: 1 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users });
}
