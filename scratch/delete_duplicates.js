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

const duplicateIdsToDelete = [
  '5e3432bd-c150-44b3-9fad-d77b41af88f6', // Bimbo duplicate
  'f3ef93f3-f8c7-4428-9884-a5aeded55c7e', // HUBB duplicate
  'fa48476f-7c52-463a-b55d-b0d1bb5b8c18', // Polar duplicate
  'd97c8eab-3d4a-4699-aa4a-e6edbd020f34'  // Farmatodo duplicate
];

async function removeDuplicates() {
  console.log('Deleting duplicate clients...');
  const { data, error } = await supabase
    .from('clients')
    .delete()
    .in('id', duplicateIdsToDelete)
    .select();

  if (error) {
    console.error('Error deleting duplicates:', error);
  } else {
    console.log('Successfully deleted duplicates:', data);
  }
}

removeDuplicates();
