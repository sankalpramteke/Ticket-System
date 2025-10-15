// Script to create an admin user
import mongoose from 'mongoose';
import { hashPassword } from '../src/lib/password.js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// User Schema (simplified)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  department: String,
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Admin details - CHANGE THESE!
    const adminData = {
      name: 'Sankalp Ramteke',
      email: 'sankalpramteke74@gmail.com',
      password: 'admin123',  // Change this to a secure password
      department: 'DIC',
      role: 'admin'
    };

    // Check if admin already exists
    const existingUser = await User.findOne({ email: adminData.email });
    
    if (existingUser) {
      console.log(`👤 User exists: ${existingUser.email}`);
      console.log(`   Current role: ${existingUser.role}`);
      
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ User role updated to admin!\n');
      } else {
        console.log('✅ User is already an admin!\n');
      }
      
      console.log('📧 Admin account details:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Department: ${existingUser.department}`);
    } else {
      console.log('👤 Creating new admin user...');
      const passwordHash = await hashPassword(adminData.password);
      
      const admin = await User.create({
        name: adminData.name,
        email: adminData.email,
        passwordHash: passwordHash,
        role: 'admin',
        department: adminData.department,
        notificationPreferences: {
          emailEnabled: true,
          ticketCreated: true,
          ticketAssigned: true,
          ticketStatusChanged: true,
          ticketPriorityChanged: true,
          newComment: true,
          profileUpdated: true
        }
      });

      console.log('✅ Admin user created successfully!\n');
      console.log('📧 Admin account details:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Department: ${admin.department}`);
      console.log(`\n🔐 Login credentials:`);
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
      console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done! You can now login at http://localhost:3000/login');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
