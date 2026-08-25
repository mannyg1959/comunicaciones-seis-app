import pg from 'pg';
const { Client } = pg;

const host = 'aws-0-ca-central-1.pooler.supabase.com';
const password = 'u5m*-Nc?_q?6k8b';
const connectionString = `postgresql://postgres.lztxuvtmsqpovfkdoipt:${encodeURIComponent(password)}@${host}:6543/postgres`;

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // Check all users in public.profiles
    const profiles = await client.query(`
      SELECT id, username, name, role FROM public.profiles
    `);
    console.log('PROFILES IN DATABASE:');
    console.log(profiles.rows);

    // Check emails of auth.users
    const users = await client.query(`
      SELECT id, email FROM auth.users
    `);
    console.log('AUTH USERS IN DATABASE:');
    console.log(users.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
