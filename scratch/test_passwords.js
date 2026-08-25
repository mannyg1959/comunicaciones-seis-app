import pg from 'pg';
const { Client } = pg;

const host = 'aws-0-ca-central-1.pooler.supabase.com';
const passwords = [
  'u5m*-Nc?_q?6k8b',
  '*u5m*-Nc?_q?6k8b*',
  'u5m\\*-Nc?\\_q?6k8b',
  '*u5m\\*-Nc?\\_q?6k8b*'
];

async function main() {
  for (const pw of passwords) {
    console.log(`Testing password: "${pw}"...`);
    const connectionString = `postgresql://postgres.lztxuvtmsqpovfkdoipt:${encodeURIComponent(pw)}@${host}:6543/postgres`;
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });
    
    try {
      await client.connect();
      console.log(`SUCCESS! The correct password is: "${pw}"`);
      
      // Let's run a test query to confirm it works
      const res = await client.query('SELECT NOW()');
      console.log('Test query result:', res.rows[0]);
      
      await client.end();
      break;
    } catch (err) {
      console.log(`Failed: ${err.message}`);
    }
  }
}

main();
