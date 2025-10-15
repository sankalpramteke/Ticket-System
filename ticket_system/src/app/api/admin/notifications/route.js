import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import Notification from '@/models/Notification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectToDB();
  const user = getUserFromRequest(req);
  
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .populate('userId', 'name email role')
      .lean();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('[admin/notifications] Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
