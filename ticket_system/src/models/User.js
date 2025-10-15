import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['reporter','admin','technician'], default: 'reporter', index: true },
  department: { type: String },
  lastLoginAt: { type: Date },
  notificationPreferences: {
    emailEnabled: { type: Boolean, default: true },
    ticketCreated: { type: Boolean, default: true },
    ticketAssigned: { type: Boolean, default: true },
    ticketStatusChanged: { type: Boolean, default: true },
    ticketPriorityChanged: { type: Boolean, default: true },
    newComment: { type: Boolean, default: true },
    profileUpdated: { type: Boolean, default: true }
  }
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
