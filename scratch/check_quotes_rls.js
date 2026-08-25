import pg from 'pg';
const { Client } = pg;

const host = 'aws-0-ca-central-1.pooler.supabase.com';
const password = 'u5m*-Nc?_q?6k8b';
const connectionString = `postgresql://postgres.lztxuvtmsqpovfkdoipt:${encodeURIComponent(password)}@${host}:6543/postgres`;

async function main() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected successfully!');

    // 1. Check if RLS is enabled on quotes
    const rlsRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('quotes', 'quote_items')
    `);
    console.log('\n--- RLS Status ---');
    console.log(JSON.stringify(rlsRes.rows, null, 2));

    // 2. Query policies for quotes
    console.log('\n--- Policies for quotes ---');
    const policiesRes = await client.query(`
      SELECT * FROM pg_policies WHERE tablename = 'quotes'
    `);
    console.log(JSON.stringify(policiesRes.rows, null, 2));

  } catch (err) {
    console.error('Error running SQL operations:', err);
  } finally {
    await client.end();
  }
}

main();
