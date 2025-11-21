/**
 * Migration helper: populate `locationGeo` for users from existing `location.lat`/`location.lng`.
 * Usage: 
 *   node backend/scripts/migrate-user-locations.js
 * Ensure env vars (DATABASE) are set or a .env file in backend/ exists.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const DB = process.env.DATABASE;
  if (!DB) {
    console.error('Please set DATABASE env var (MongoDB connection string)');
    process.exit(1);
  }

  await mongoose.connect(DB, { maxPoolSize: 5 });
  console.log('Connected to DB');

  const users = await User.find({ 'location.lat': { $exists: true }, 'location.lng': { $exists: true }, $or: [ { locationGeo: { $exists: false } }, { 'locationGeo.coordinates': { $exists: false } } ] });
  console.log(`Found ${users.length} users to migrate`);

  let count = 0;
  for (const u of users) {
    try {
      const lat = parseFloat(u.location.lat);
      const lng = parseFloat(u.location.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        u.locationGeo = { type: 'Point', coordinates: [lng, lat] };
        await u.save();
        count++;
      }
    } catch (e) {
      console.warn('Failed for user', u._id, e.message);
    }
  }

  console.log(`Migrated ${count} users`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(2);
});
