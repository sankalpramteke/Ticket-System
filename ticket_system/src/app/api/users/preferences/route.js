import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get current user's notification preferences
export async function GET(req) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const userData = await User.findById(user.id)
    .select('notificationPreferences')
    .lean();

  if (!userData) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Return default preferences if not set
  const preferences = userData.notificationPreferences || {
    emailEnabled: true,
    ticketCreated: true,
    ticketAssigned: true,
    ticketStatusChanged: true,
    ticketPriorityChanged: true,
    newComment: true,
    profileUpdated: true
  };

  return NextResponse.json({ preferences });
}

// Update current user's notification preferences
export async function PATCH(req) {
  await connectToDB();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates = {};

  // Validate and set preferences
  const allowedPrefs = [
    'emailEnabled',
    'ticketCreated',
    'ticketAssigned',
    'ticketStatusChanged',
    'ticketPriorityChanged',
    'newComment',
    'profileUpdated'
  ];

  for (const key of allowedPrefs) {
    if (typeof body[key] === 'boolean') {
      updates[`notificationPreferences.${key}`] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No valid preferences to update' }, { status: 400 });
  }

  const updated = await User.findByIdAndUpdate(
    user.id,
    { $set: updates },
    { new: true, projection: { notificationPreferences: 1 } }
  );

  if (!updated) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  return NextResponse.json({ 
    preferences: updated.notificationPreferences,
    message: 'Preferences updated successfully'
  });
}
