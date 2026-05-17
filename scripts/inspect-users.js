import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://libre:libre@127.0.0.1:5432/libre';

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('Connected to', DATABASE_URL);

  // Show recent dev users and wallet addresses
  const res = await client.query(
    `SELECT id, email, firebase_uid, wallet_address, created_at
     FROM users
     WHERE email LIKE '%@dev.local' OR email LIKE '%@test.local' OR wallet_address IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 100`
  );

  console.log('Found', res.rows.length, 'rows');
  for (const r of res.rows) {
    console.log(r);
  }

  // Show count of distinct wallet addresses and any duplicates
  const dupRes = await client.query(
    `SELECT wallet_address, COUNT(*) as cnt
     FROM users
     WHERE wallet_address IS NOT NULL
     GROUP BY wallet_address
     HAVING COUNT(*) > 1
     LIMIT 50`
  );
  console.log('Duplicate wallet addresses:', dupRes.rows.length);
  for (const r of dupRes.rows) console.log(r);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});