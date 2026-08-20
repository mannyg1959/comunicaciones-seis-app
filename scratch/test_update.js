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

async function testUpdate() {
  const { data, error } = await supabase
    .from('clients')
    .update({ name: 'DELETE_ME' })
    .eq('id', '5e3432bd-c150-44b3-9fad-d77b41af88f6')
    .select();

  console.log('Update result:', { data, error });
}

testUpdate();
