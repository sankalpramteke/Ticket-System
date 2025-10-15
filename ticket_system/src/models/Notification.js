import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'ticket_created',
      'ticket_updated', 
      'ticket_assigned',
      'comment_added',
      'profile_updated'
    ], 
    required: true,
    index: true
  },
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', index: true },
  recipientEmail: { type: String, required: true },
  subject: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['sent', 'failed', 'skipped'], 
    default: 'sent',
    index: true
  },
  error: { type: String },
  sentAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Indexes for querying
NotificationSchema.index({ userId: 1, sentAt: -1 });
NotificationSchema.index({ ticketId: 1, sentAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
