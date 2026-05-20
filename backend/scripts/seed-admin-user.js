require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function getDatabaseUrl() {
  const template = process.env.DATABASE;
  if (!template) {
    throw new Error('DATABASE env var is required');
  }

  if (template.includes('<db_password>')) {
    if (!process.env.DATABASE_PASSWORD) {
      throw new Error('DATABASE_PASSWORD env var is required when DATABASE contains <db_password>');
    }
    return template.replace('<db_password>', process.env.DATABASE_PASSWORD);
  }

  return template;
}

async function run() {
  const email = getArg('email', process.env.ADMIN_SEED_EMAIL || 'admin@suraksha-setu.local').trim().toLowerCase();
  const password = getArg('password', process.env.ADMIN_SEED_PASSWORD || 'Admin@123456');
  const name = getArg('name', process.env.ADMIN_SEED_NAME || 'Suraksha Setu Admin').trim();
  const phone = getArg('phone', process.env.ADMIN_SEED_PHONE || '');

  if (!email || !password || !name) {
    throw new Error('Admin seed requires non-empty name, email, and password');
  }

  const db = getDatabaseUrl();
  await mongoose.connect(db, { maxPoolSize: 5 });
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'admin',
      isActive: true,
    });
    await user.save();
    console.log(`Created admin user: ${email}`);
  } else {
    user.name = name;
    user.role = 'admin';
    user.isActive = true;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    await user.save();
    console.log(`Updated existing user to admin: ${email}`);
  }

  console.log('Admin credentials');
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Failed to seed admin user:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_disconnectError) {
      // no-op
    }
    process.exit(1);
  });
