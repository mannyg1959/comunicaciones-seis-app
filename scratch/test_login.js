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

async function test() {
  const passwords = ['FlowLog2026!', 'CaracasCCS1*'];
  for (const pw of passwords) {
    console.log(`Trying login with admin@seis.com and password ${pw}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@seis.com',
      password: pw
    });
    if (error) {
      console.log(`Failed for password ${pw}:`, error.message);
    } else {
      console.log(`Success for password ${pw}! User ID:`, data.user.id);
      break;
    }
  }
}

test();
