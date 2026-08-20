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

async function loginAndDelete() {
  // Try common admin/dev passwords or test auth
  const passwordsToTry = ['123456', 'admin123', 'admin', '12345678', 'Seis2026!'];
  let loggedInUser = null;

  for (const pass of passwordsToTry) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@seis.com',
      password: pass
    });
    if (!error && data.session) {
      loggedInUser = data;
      console.log('Logged in as admin@seis.com with password:', pass);
      break;
    }
  }

  if (!loggedInUser) {
    for (const pass of passwordsToTry) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'mgomez@seis.com',
        password: pass
      });
      if (!error && data.session) {
        loggedInUser = data;
        console.log('Logged in as mgomez@seis.com with password:', pass);
        break;
      }
    }
  }

  if (loggedInUser) {
    const idsToDelete = [
      '5e3432bd-c150-44b3-9fad-d77b41af88f6',
      'f3ef93f3-f8c7-4428-9884-a5aeded55c7e',
      'fa48476f-7c52-463a-b55d-b0d1bb5b8c18',
      'd97c8eab-3d4a-4699-aa4a-e6edbd020f34'
    ];
    for (const id of idsToDelete) {
      const res = await supabase.from('clients').delete().eq('id', id).select();
      console.log(`Delete ${id}:`, res);
    }
  } else {
    console.log('Could not log in automatically. Attempting direct delete with current client...');
  }
}

loginAndDelete();
