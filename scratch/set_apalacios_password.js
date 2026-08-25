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

    console.log('Updating apalacios@seis.com password...');
    const res = await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('Misecreto12*', gen_salt('bf', 10)) 
      WHERE email = 'apalacios@seis.com';
    `);
    
    console.log('Update result:', res.rowCount, 'rows updated.');

  } catch (err) {
    console.error('Error running SQL operations:', err);
  } finally {
    await client.end();
  }
}

main();
