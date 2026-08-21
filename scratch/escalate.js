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

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testadmin@seis.com',
    password: 'Password123!'
  });
  if (authError) return console.error(authError);
  
  console.log('Logged in. Updating profile to Admin...');
  const { data, error } = await supabase.from('profiles').update({
    role: 'Admin',
    requires_password_change: false
  }).eq('id', authData.user.id).select();
  
  if (error) console.error(error);
  else console.log('Escalated successfully:', data);
}
run();
