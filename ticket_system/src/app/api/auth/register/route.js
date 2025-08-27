import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { signAccessToken } from '@/lib/jwt';

export async function POST(req) {
  await connectToDB();
  const body = await req.json();
  const { name, email, password, department } = body || {};
  if (!name || !email || !password) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }
  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ message: 'Email already registered' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'reporter', department });
  const token = signAccessToken({ sub: user.id, role: user.role });
  return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}
