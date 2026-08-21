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

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@seis.com',
    password: 'Password123!'
  });
  if (authError) {
    console.log('Login failed:', authError.message);
    return;
  }
  console.log('Logged in successfully!');
  
  const { data } = await supabase.from('monitor_ticker').select('*').limit(1);
  if (data && data.length > 0) {
    const id = data[0].id;
    console.log('Trying to delete ID:', id);
    const { data: dData, error: dError } = await supabase.from('monitor_ticker').delete().eq('id', id).select();
    console.log('Delete returned data:', dData, 'error:', dError);
  } else {
    console.log('No monitor_ticker records found');
  }
}
test();
