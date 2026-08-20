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

async function check() {
  console.log('Fetching clients...');
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Total records in clients table: ${data.length}`);
  data.forEach(c => console.log(c.name, c.address));
}

check();
