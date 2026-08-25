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

    // 1. Drop existing Ventas policy
    console.log('Dropping existing Ventas policy...');
    await client.query(`
      DROP POLICY IF EXISTS "Ventas ve y edita sus propias cotizaciones" ON public.quotes;
    `);

    // 2. Recreate it with the explicit check that the user has the 'Ventas' role
    console.log('Recreating Ventas policy with role validation...');
    await client.query(`
      CREATE POLICY "Ventas ve y edita sus propias cotizaciones" 
      ON public.quotes 
      FOR ALL 
      TO authenticated
      USING (
        seller_id = auth.uid() AND 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = 'Ventas'
        )
      );
    `);

    console.log('Ventas policy updated successfully!');

    // 3. Verify final policies
    const policiesRes = await client.query(`
      SELECT * FROM pg_policies WHERE tablename = 'quotes'
    `);
    console.log('Final policies on quotes:', JSON.stringify(policiesRes.rows, null, 2));

  } catch (err) {
    console.error('Error running SQL operations:', err);
  } finally {
    await client.end();
  }
}

main();
