import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    envVars[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  }
});
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function create() {
  const email = 'testadmin@seis.com';
  const password = 'Password123!';
  
  console.log('Registering user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) {
    console.error('SignUp error:', authError.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log('User registered with ID:', userId);
  
  console.log('Creating profile...');
  const { data: profileData, error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username: 'testadmin',
    name: 'Test Admin',
    role: 'Admin',
    cargo: 'Administrador de Pruebas',
    requires_password_change: false
  }).select();
  
  if (profileError) {
    console.error('Profile creation error:', profileError.message);
  } else {
    console.log('Profile created:', profileData);
  }
}
create();
