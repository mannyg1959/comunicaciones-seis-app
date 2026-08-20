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

async function inspectDuplicates() {
  const { data: clients, error: cErr } = await supabase.from('clients').select('*');
  const { data: quotes, error: qErr } = await supabase.from('quotes').select('id, client_id, client_name');
  const { data: workOrders, error: wErr } = await supabase.from('work_orders').select('id, client_id, client_name');

  if (cErr) { console.error(cErr); return; }

  console.log('--- CLIENTS ---');
  clients.forEach(c => {
    const qCount = quotes ? quotes.filter(q => q.client_id === c.id || q.client_name === c.name).length : 0;
    const wCount = workOrders ? workOrders.filter(w => w.client_id === c.id || w.client_name === c.name).length : 0;
    console.log(`ID: ${c.id} | Name: "${c.name}" | Quotes: ${qCount} | WorkOrders: ${wCount}`);
  });
}

inspectDuplicates();
