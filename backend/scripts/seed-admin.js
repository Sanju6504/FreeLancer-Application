#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../src/db.js';
import { Admin } from '../src/models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Load .env from backend root regardless of current working directory
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  const email = process.env.ADMIN_EMAIL || 'palkishakula22@gmail.com';
  const password = process.env.ADMIN_PASSWORD || '1234567890';
  const fullName = process.env.ADMIN_NAME || 'Palkishakula';

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment');
    process.exit(1);
  }

  await connectToDatabase(process.env.MONGODB_URI);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    email,
    password: hashed,
    role: 'admin',
    profile: { fullName },
  });

  console.log('Seeded admin:');
  console.log({ email: admin.email, fullName: admin.profile?.fullName || '' });
  console.log('You can override credentials via ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env vars.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
