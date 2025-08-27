import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import { verifyPassword } from '@/lib/password';
import { signAccessToken } from '@/lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectToDB();
  const body = await req.json();
  const { email, password } = body || {};
  if (!email || !password) return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

  user.lastLoginAt = new Date();
  await user.save();
  const token = signAccessToken({ sub: user.id, role: user.role });
  return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
