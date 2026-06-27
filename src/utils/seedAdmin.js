/**
 * One-time setup script to create the FIRST admin account.
 * Since registration is disabled and admins create every other account,
 * this script is the only way to bootstrap the system initially.
 *
 * Run manually: npm run seed:admin
 * Uses SEED_ADMIN_* values from .env — change SEED_ADMIN_PASSWORD
 * immediately after first login (mustResetPassword is set to true by
 * default, so the API will require it).
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User.model');

async function seedAdmin() {
  try {
    console.log('Starting admin seed...');

   console.log('MONGO_URI =', process.env.MONGO_URI);
await connectDB();
console.log('Database connected');

    const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
    const name = process.env.SEED_ADMIN_NAME || 'System Administrator';
    const plainPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123';

    console.log('Email from .env:', email);

    if (!email) {
      console.error('SEED_ADMIN_EMAIL is not set in .env');
      process.exit(1);
    }

    console.log('Checking existing admin...');

    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`Admin account already exists for ${email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('Creating admin account...');

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(plainPassword, salt);

    await User.create({
      name,
      email,
      password: hashed,
      role: 'admin',
      mustResetPassword: true,
    });

    console.log('==========================');
    console.log('Admin account created!');
    console.log('Email:', email);
    console.log('Password:', plainPassword);
    console.log('==========================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('SEED ERROR:');
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();