/**
 * Quick Database State Checker
 * 
 * Verifies that auth + wallet linking data persists in PostgreSQL.
 * 
 * Usage:
 *   node scripts/test-db-state.js [firebaseUid]
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabaseState(firebaseUid) {
  console.log('\n🔍 Checking database state...\n');

  try {
    // 1. Check user exists
    console.log('1️⃣ Checking user in `users` table...');
    const userResult = await pool.query(
      firebaseUid
        ? 'SELECT id, firebase_uid, email, wallet_address, wallet_verified_at, created_at FROM users WHERE firebase_uid = $1'
        : 'SELECT id, firebase_uid, email, wallet_address, wallet_verified_at, created_at FROM users ORDER BY created_at DESC LIMIT 5',
      firebaseUid ? [firebaseUid] : []
    );

    if (userResult.rows.length === 0) {
      console.log('   ❌ No users found');
    } else {
      console.log(`   ✅ Found ${userResult.rows.length} user(s):`);
      userResult.rows.forEach((user, i) => {
        console.log(`   User ${i + 1}:`);
        console.log(`     - ID: ${user.id}`);
        console.log(`     - Firebase UID: ${user.firebase_uid || 'NULL'}`);
        console.log(`     - Email: ${user.email || 'NULL'}`);
        console.log(`     - Wallet: ${user.wallet_address || 'NULL'}`);
        console.log(`     - Verified At: ${user.wallet_verified_at || 'NULL'}`);
        console.log(`     - Created: ${user.created_at}`);
      });
    }

    // 2. Check nonces
    console.log('\n2️⃣ Checking nonces in `wallet_link_nonces` table...');
    const nonceResult = await pool.query(
      firebaseUid
        ? 'SELECT firebase_uid, nonce, expires_at FROM wallet_link_nonces WHERE firebase_uid = $1'
        : 'SELECT firebase_uid, nonce, expires_at FROM wallet_link_nonces ORDER BY expires_at DESC LIMIT 10',
      firebaseUid ? [firebaseUid] : []
    );

    if (nonceResult.rows.length === 0) {
      console.log('   ✅ No active nonces (expected after wallet linking)');
    } else {
      console.log(`   ⚠️  Found ${nonceResult.rows.length} active nonce(s):`);
      nonceResult.rows.forEach((nonce, i) => {
        const expiresAt = new Date(nonce.expires_at);
        const isExpired = expiresAt < new Date();
        console.log(`   Nonce ${i + 1}:`);
        console.log(`     - Firebase UID: ${nonce.firebase_uid}`);
        console.log(`     - Nonce: ${nonce.nonce.substring(0, 16)}...`);
        console.log(`     - Expires: ${expiresAt.toISOString()} ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
      });
    }

    // 3. Check wallet uniqueness
    console.log('\n3️⃣ Checking wallet uniqueness...');
    const walletResult = await pool.query(
      'SELECT wallet_address, COUNT(*) as count FROM users WHERE wallet_address IS NOT NULL GROUP BY wallet_address HAVING COUNT(*) > 1'
    );

    if (walletResult.rows.length === 0) {
      console.log('   ✅ All wallets are unique (no duplicates)');
    } else {
      console.log('   ❌ Found duplicate wallets:');
      walletResult.rows.forEach((row) => {
        console.log(`     - ${row.wallet_address}: ${row.count} users`);
      });
    }

    // 4. Summary
    console.log('\n📊 Summary:');
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(wallet_address) as users_with_wallet,
        COUNT(wallet_verified_at) as verified_wallets
      FROM users
    `);
    const stats = statsResult.rows[0];
    console.log(`   - Total users: ${stats.total_users}`);
    console.log(`   - Users with wallet: ${stats.users_with_wallet}`);
    console.log(`   - Verified wallets: ${stats.verified_wallets}`);

    console.log('\n✅ Database check complete!\n');
  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get firebaseUid from command line args
const firebaseUid = process.argv[2];

if (firebaseUid) {
  console.log(`Checking state for Firebase UID: ${firebaseUid}`);
} else {
  console.log('Checking all recent users (no Firebase UID provided)');
  console.log('Usage: node scripts/test-db-state.js [firebaseUid]');
}

checkDatabaseState(firebaseUid);

