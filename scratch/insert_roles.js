import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getStructure() {
  console.log('Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@seis.com',
    password: 'CaracasCCS1*'
  });

  if (authError) {
    console.error('Error logging in:', authError);
    return;
  }

  console.log('Login successful. Querying table info...');
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
    console.log(`Upserting permissions for role: ${role}`);
    const { data, error } = await supabase
      .from('roles_permissions')
      .upsert({
        role_name: role,
        permissions: defaultPermissions[role]
      }, { onConflict: 'role_name' })
      .select();

    if (error) {
      console.error(`Error upserting ${role}:`, error);
    } else {
      console.log(`Success upserting ${role}:`, data);
    }
  }
}

getStructure();
