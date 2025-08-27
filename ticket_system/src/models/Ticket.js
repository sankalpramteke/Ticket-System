import mongoose, { Schema } from 'mongoose';

const TicketSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['AC','Computer','Electrical','Plumbing','Other'], required: true, index: true },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium', index: true },
  status: { type: String, enum: ['new','in_progress','resolved','closed'], default: 'new', index: true },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  room: { type: String },
  building: { type: String }
}, { timestamps: true });

TicketSchema.index({ status: 1, priority: 1, category: 1, createdAt: -1 });

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
