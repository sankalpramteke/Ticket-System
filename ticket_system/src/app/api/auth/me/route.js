import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectToDB();
  const userInfo = getUserFromRequest(req);
  if (!userInfo) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const user = await User.findById(userInfo.id).select('name email role department createdAt updatedAt');
  return NextResponse.json({ user });
}
