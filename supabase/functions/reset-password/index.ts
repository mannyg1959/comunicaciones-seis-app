import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
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

    // Resetear la contraseña del usuario a la predeterminada
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: 'Password123!'
    })

    if (authError) throw authError

    // Marcar que el usuario debe cambiar su contraseña obligatoriamente
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ requires_password_change: true })
      .eq('id', userId)

    if (profileError) {
      console.error("No se pudo actualizar el flag requires_password_change:", profileError);
      // No bloqueamos el flujo por esto, pero idealmente debe funcionar
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contraseña reseteada exitosamente" }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
