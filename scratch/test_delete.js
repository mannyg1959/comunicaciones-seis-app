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

async function testDelete() {
  const targetId = '5e3432bd-c150-44b3-9fad-d77b41af88f6';
  const res = await supabase.from('clients').delete().eq('id', targetId);
  console.log('Delete result:', JSON.stringify(res, null, 2));
}

testDelete();
