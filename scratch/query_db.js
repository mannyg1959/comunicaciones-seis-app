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

    // 1. Query policies for roles_permissions
    console.log('\n--- Policies for roles_permissions ---');
    const policiesRes = await client.query(`
      SELECT * FROM pg_policies WHERE tablename = 'roles_permissions'
    `);
    console.log(JSON.stringify(policiesRes.rows, null, 2));

    // 2. Query columns of roles_permissions to verify schema
    console.log('\n--- Columns of roles_permissions ---');
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'roles_permissions'
    `);
    console.log(JSON.stringify(columnsRes.rows, null, 2));

    // 3. Seed default permissions into roles_permissions
    console.log('\n--- Seeding default permissions ---');
    const defaultPermissions = {
      Admin: {
        cotizaciones: { ver: true, crear: true, editar: true, cambiar_estatus: true, anular: true, eliminar: true, imprimir: true, gestionar_clientes: true },
        ordenes_trabajo: { ver: true, crear: true, editar: true, asignar_tecnicos: true, cambiar_estatus: true, imprimir: true, eliminar: true },
        dashboard: { ver_general: true, ver_financieros: true, ver_operativos: true },
        herramientas_analiticas: { ver_reportes: true, exportar_datos: true, ver_alertas: true, monitor: true },
        ajustes: { acceso: true, gestionar_usuarios: true, gestionar_roles: true, configurar_kpis: true, ver_logs: true, configurar_monitor: true }
      },
      Ventas: {
        cotizaciones: { ver: true, crear: true, editar: true, cambiar_estatus: true, anular: false, eliminar: false, imprimir: true, gestionar_clientes: true },
        ordenes_trabajo: { ver: true, crear: false, editar: false, asignar_tecnicos: false, cambiar_estatus: false, imprimir: false, eliminar: false },
        dashboard: { ver_general: true, ver_financieros: true, ver_operativos: false },
        herramientas_analiticas: { ver_reportes: false, exportar_datos: true, ver_alertas: true, monitor: false },
        ajustes: { acceso: false, gestionar_usuarios: false, gestionar_roles: false, configurar_kpis: false, ver_logs: false, configurar_monitor: false }
      },
      Produccion: {
        cotizaciones: { ver: false, crear: false, editar: false, cambiar_estatus: false, anular: false, eliminar: false, imprimir: false, gestionar_clientes: false },
        ordenes_trabajo: { ver: true, crear: true, editar: true, asignar_tecnicos: true, cambiar_estatus: true, imprimir: true, eliminar: false },
        dashboard: { ver_general: true, ver_financieros: false, ver_operativos: true },
        herramientas_analiticas: { ver_reportes: true, exportar_datos: false, ver_alertas: true, monitor: false },
        ajustes: { acceso: false, gestionar_usuarios: false, gestionar_roles: false, configurar_kpis: false, ver_logs: false, configurar_monitor: false }
      }
    };

    for (const role of ['Admin', 'Ventas', 'Produccion']) {
      console.log(`Inserting/Updating permissions for role: ${role}`);
      await client.query(`
        INSERT INTO public.roles_permissions (role_name, permissions)
        VALUES ($1, $2)
        ON CONFLICT (role_name) 
        DO UPDATE SET permissions = EXCLUDED.permissions
      `, [role, JSON.stringify(defaultPermissions[role])]);
    }

    console.log('Seeding completed successfully!');

    // Let's check RLS policies on roles_permissions
    // If RLS is enabled but there are no policies for insert/update/select, let's create them!
    // Let's check if RLS is enabled on the table
    const rlsRes = await client.query(`
      SELECT relrowsecurity FROM pg_class WHERE oid = 'public.roles_permissions'::regclass
    `);
    const isRlsEnabled = rlsRes.rows[0]?.relrowsecurity;
    console.log('Is RLS enabled on roles_permissions?', isRlsEnabled);

    if (isRlsEnabled) {
      console.log('RLS is enabled. Checking if we need to add policies for Admin to manage permissions...');
      
      // Let's create policies if they don't exist:
      // 1. SELECT policy: allow anyone to select roles_permissions
      // 2. ALL/UPDATE policy: allow Admins to manage roles_permissions
      
      console.log('Creating SELECT policy...');
      await client.query(`
        DROP POLICY IF EXISTS "Permitir lectura global de roles_permissions" ON public.roles_permissions;
        CREATE POLICY "Permitir lectura global de roles_permissions" 
        ON public.roles_permissions 
        FOR SELECT 
        USING (true);
      `);
      
      console.log('Creating WRITE/ALL policy for Admins...');
      await client.query(`
        DROP POLICY IF EXISTS "Admins pueden gestionar roles_permissions" ON public.roles_permissions;
        CREATE POLICY "Admins pueden gestionar roles_permissions" 
        ON public.roles_permissions 
        FOR ALL 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Admin'
          )
        );
      `);
      
      console.log('Policies created successfully!');
    }

    // Let's verify final policies
    const finalPolicies = await client.query(`
      SELECT * FROM pg_policies WHERE tablename = 'roles_permissions'
    `);
    console.log('Final policies:', JSON.stringify(finalPolicies.rows, null, 2));

    // Let's verify rows again
    const finalRows = await client.query('SELECT * FROM public.roles_permissions');
    console.log('Final rows in roles_permissions:', JSON.stringify(finalRows.rows, null, 2));

  } catch (err) {
    console.error('Error running SQL operations:', err);
  } finally {
    await client.end();
  }
}

main();
