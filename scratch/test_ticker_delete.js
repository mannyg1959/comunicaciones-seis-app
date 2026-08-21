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
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
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
