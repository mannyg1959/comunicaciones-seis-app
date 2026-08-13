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
    // Inicializar el cliente Supabase con privilegios de administrador (Service Role Key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Variables de entorno no configuradas.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Obtener los datos enviados desde la aplicación React
    const { email, password, name, username, role, cargo, contact_phone } = await req.json()

    if (!email || !password || !name || !username || !role) {
      throw new Error("Faltan parámetros obligatorios.");
    }

    // 1. Crear el usuario en el módulo de Autenticación
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Se autoconfirma para que puedan entrar directamente
    })

    if (authError) throw authError

    // 2. Actualizar su perfil correspondiente en la tabla 'profiles' (el trigger ya lo insertó)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
          username: username, 
          name: name, 
          role: role,
          cargo: cargo || (role === 'Admin' ? 'Administrador' : role === 'Ventas' ? 'Ejecutivo de Ventas' : 'Jefe de Producción'),
          contact_phone: contact_phone || null,
          avatar_url: '/FotoPerfilPlantilla.jpg'
      })
      .eq('id', authData.user.id)

    if (profileError) {
      throw profileError
    }

    return new Response(
      JSON.stringify({ user: authData.user }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
