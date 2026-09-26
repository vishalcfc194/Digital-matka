/**
 * Seed script for the Matka Game Platform.
 * Creates:
 *   - SuperAdmin: superadmin / SuperAdmin@123
 *   - Admin:      admin1 / Admin@12345  (referral code ADMINDEMO)
 *   - User:       user1 / User@12345    (wallet welcome bonus: 5000)
 *   - Default PlatformConfig + standard markets
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BetType, DEFAULT_WINNING_MULTIPLIERS } from '../src/types/index.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// All standard Matka markets — DPBoss exact timings
// Lockout = result_time − 20 minutes (handled by marketLockout worker)
// ---------------------------------------------------------------------------

const STANDARD_MARKETS = [
  // ── MORNING MARKETS ──────────────────────────────────────────────────────
  { name: 'Sridevi Morning',    open_time: '09:15', close_time: '10:15', result_time: '10:30' },
  { name: 'Time Bazar Morning', open_time: '09:45', close_time: '10:45', result_time: '11:00' },
  { name: 'Milan Morning',      open_time: '09:00', close_time: '10:00', result_time: '11:00' },
  { name: 'Madhur Morning',     open_time: '10:30', close_time: '11:30', result_time: '12:00' },
  { name: 'Kalyan Morning',     open_time: '10:45', close_time: '11:45', result_time: '12:00' },

  // ── DAY MARKETS ──────────────────────────────────────────────────────────
  { name: 'Sridevi',            open_time: '11:35', close_time: '12:35', result_time: '12:35' },
  { name: 'Time Bazar',         open_time: '13:00', close_time: '14:00', result_time: '14:00' },
  { name: 'Madhur Day',         open_time: '13:30', close_time: '14:30', result_time: '14:30' },
  { name: 'Milan Day',          open_time: '15:10', close_time: '17:10', result_time: '17:10' },
  { name: 'Rajdhani Day',       open_time: '15:30', close_time: '17:30', result_time: '17:30' },
  { name: 'Supreme Day',        open_time: '14:00', close_time: '16:00', result_time: '16:00' },
  { name: 'Kalyan',             open_time: '16:00', close_time: '18:00', result_time: '18:00' },

  // ── NIGHT MARKETS ────────────────────────────────────────────────────────
  { name: 'Sridevi Night',      open_time: '18:30', close_time: '20:00', result_time: '20:00' },
  { name: 'Madhur Night',       open_time: '20:30', close_time: '22:00', result_time: '22:00' },
  { name: 'Supreme Night',      open_time: '20:00', close_time: '22:00', result_time: '22:00' },
  { name: 'Milan Night',        open_time: '21:00', close_time: '23:00', result_time: '23:00' },
  { name: 'Rajdhani Night',     open_time: '21:30', close_time: '23:30', result_time: '23:30' },
  { name: 'Kalyan Night',       open_time: '21:30', close_time: '23:30', result_time: '23:30' },
  { name: 'Main Bazar',         open_time: '21:00', close_time: '23:30', result_time: '23:40' },
] as const;

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // 1. Create SuperAdmin account
  const superAdminPassword = 'SuperAdmin@123';
  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  const superAdmin = await prisma.admin.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password_hash: passwordHash,
      referral_code: 'SUPERADMIN',
      is_active: true,
      min_bet_points: 10,
      max_bet_points: 10000,
    },
  });

  console.log(`✅ SuperAdmin created/found: ${superAdmin.username} (id: ${superAdmin.id})`);

  // 2. Create default PlatformConfig
  const existingConfig = await prisma.platformConfig.findFirst();

  if (!existingConfig) {
    const config = await prisma.platformConfig.create({
      data: {
        winning_multipliers: DEFAULT_WINNING_MULTIPLIERS as unknown as Record<string, number>,
        result_api_endpoint: 'https://api.example.com/results',
        result_poll_interval_sec: 300,
        upi_details: 'UPI ID: platform@upi',
        feature_flags: {
          manual_result_entry: true,
          withdrawals_enabled: true,
          deposits_enabled: true,
        },
      },
    });
    console.log(`✅ PlatformConfig created (id: ${config.id})`);
  } else {
    console.log(`ℹ️  PlatformConfig already exists (id: ${existingConfig.id}), skipping.`);
  }

  // 3. Upsert all standard Matka markets (create new + update timings of existing)
  let marketsCreated = 0;
  let marketsUpdated = 0;

  for (const market of STANDARD_MARKETS) {
    const existing = await prisma.market.findUnique({ where: { name: market.name } });

    if (!existing) {
      await prisma.market.create({
        data: {
          name: market.name,
          open_time: market.open_time,
          close_time: market.close_time,
          result_time: market.result_time,
          status: 'open',
          is_active: true,
        },
      });
      console.log(`  ✅ Created: ${market.name}`);
      marketsCreated++;
    } else {
      // Update timings even if market already exists
      await prisma.market.update({
        where: { name: market.name },
        data: {
          open_time: market.open_time,
          close_time: market.close_time,
          result_time: market.result_time,
          is_active: true,
        },
      });
      console.log(`  🔄 Updated: ${market.name}`);
      marketsUpdated++;
    }
  }

  // Deactivate markets not in the standard list (old/removed markets)
  const standardNames = STANDARD_MARKETS.map(m => m.name);
  const deactivated = await prisma.market.updateMany({
    where: { name: { notIn: standardNames } },
    data: { is_active: false },
  });

  console.log(`✅ Markets: ${marketsCreated} created, ${marketsUpdated} updated, ${deactivated.count} deactivated.`);

  // 4. Demo Admin
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 12);
  const demoAdmin = await prisma.admin.upsert({
    where: { username: 'admin1' },
    update: {},
    create: {
      username: 'admin1',
      password_hash: adminPasswordHash,
      referral_code: 'ADMINDEMO',
      is_active: true,
      min_bet_points: 10,
      max_bet_points: 10000,
      allocated_points: BigInt(10000),
      used_points: BigInt(5000),
    },
  });
  console.log(`✅ Admin created/found: ${demoAdmin.username} (referral: ${demoAdmin.referral_code})`);

  // Ensure admin has enough allocation for welcome bonus (idempotent)
  if (demoAdmin.allocated_points < BigInt(10000)) {
    await prisma.admin.update({
      where: { id: demoAdmin.id },
      data: { allocated_points: BigInt(10000) },
    });
  }

  // 5. Demo User + 5000 welcome bonus wallet
  const userPasswordHash = await bcrypt.hash('User@12345', 12);
  const existingUser = await prisma.user.findUnique({ where: { username: 'user1' } });

  let demoUser = existingUser;
  if (!demoUser) {
    demoUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: 'user1',
          password_hash: userPasswordHash,
          role: 'user',
          admin_id: demoAdmin.id,
          is_active: true,
        },
      });
      await tx.wallet.create({
        data: {
          user_id: user.id,
          balance_points: BigInt(5000),
          held_points: BigInt(0),
        },
      });
      return user;
    });
    console.log(`✅ User created: user1 with 5000 welcome bonus`);
  } else {
    await prisma.wallet.upsert({
      where: { user_id: demoUser.id },
      create: {
        user_id: demoUser.id,
        balance_points: BigInt(5000),
        held_points: BigInt(0),
      },
      update: {
        balance_points: BigInt(5000),
        held_points: BigInt(0),
      },
    });
    console.log(`✅ User found: user1 — wallet set to 5000 welcome bonus`);
  }

  console.log('🎉 Seed completed successfully.');
  console.log('');
  console.log('Login credentials:');
  console.log('  SuperAdmin  superadmin / SuperAdmin@123');
  console.log('  Admin       admin1     / Admin@12345');
  console.log('  User        user1      / User@12345   (wallet: 5000)');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
