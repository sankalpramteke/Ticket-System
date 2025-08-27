import mongoose, { Schema } from 'mongoose';

const ActivitySchema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['create','assign','update_status','update_priority','comment','attach','feedback'], required: true },
  payload: { type: Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
