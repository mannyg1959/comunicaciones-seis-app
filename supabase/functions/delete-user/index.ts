import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Variables de entorno no configuradas.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { userId } = await req.json()

    if (!userId) {
      throw new Error("Falta el parámetro userId.");
    }

    // VALIDACIÓN EXPLÍCITA:
    // Algunas tablas tienen ON DELETE SET NULL (ej. work_orders), por lo que la base de datos 
    // no bloquea automáticamente el borrado con un error 23503. Hacemos la comprobación manualmente.
    
    // 1. Revisar si tiene cotizaciones
    const { data: quotes } = await supabaseAdmin.from('quotes').select('id').eq('seller_id', userId).limit(1);
    // 2. Revisar si tiene órdenes de trabajo asignadas
    const { data: wos } = await supabaseAdmin.from('work_orders').select('id').eq('assigned_technician_id', userId).limit(1);
    // 3. Revisar si reportó incidencias
    const { data: inc } = await supabaseAdmin.from('work_order_incidents').select('id').eq('reported_by', userId).limit(1);
    // 4. Revisar si tiene movimientos/logs en el historial
    const { data: logs } = await supabaseAdmin.from('work_order_logs').select('id').eq('user_id', userId).limit(1);

    if (
      (quotes && quotes.length > 0) || 
      (wos && wos.length > 0) || 
      (inc && inc.length > 0) || 
      (logs && logs.length > 0)
    ) {
      throw new Error("No se puede eliminar este usuario porque tiene cotizaciones, órdenes de trabajo o movimientos históricos en el sistema. Para conservar el historial, considera deshabilitarlo o cambiar su estatus en lugar de borrarlo.");
    }

    // Si pasó las validaciones, borramos primero de profiles (por precaución ante otros RESTRICT)
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
    
    if (profileError) {
      if (profileError.code === '23503') {
        throw new Error("No se puede eliminar este usuario porque tiene registros históricos asociados.");
      }
      throw profileError;
    }

    // Y finalmente de auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) throw authError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    // Retornamos 200 incluso para errores de negocio para que el cliente Supabase-js
    // no envuelva la respuesta en un error genérico "non-2xx status code"
    // y nos permita leer el mensaje JSON en el frontend.
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
