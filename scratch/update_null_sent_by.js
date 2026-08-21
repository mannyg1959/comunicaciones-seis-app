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
  const adminId = 'bcc850c0-3c0d-4a7c-9dde-2c86786ada3e';
  console.log('Attempting to update null sent_by to admin ID...');
  const { data, error } = await supabase.from('monitor_ticker')
    .update({ sent_by: adminId })
    .is('sent_by', null)
    .select();
    
  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('Update success, updated rows:', data);
  }
}
run();
