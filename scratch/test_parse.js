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

const parseAddress = (addr) => {
  if (!addr) return { direccion: '', ciudad: '', estado: '' };
  if (addr.includes(' | ')) {
    const parts = addr.split(' | ');
    const dir = parts[0] || '';
    const loc = (parts[1] || '').split(',');
    return {
      direccion: dir,
      ciudad: (loc[0] || '').trim(),
      estado: (loc[1] || '').trim()
    };
  }
  const loc = addr.split(',');
  return {
    direccion: '',
    ciudad: (loc[0] || '').trim(),
    estado: (loc[1] || '').trim()
  };
};

async function testParse() {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error(error);
    return;
  }
  data.forEach(c => {
    try {
      console.log(`Parsing address for: ${c.name} (Address: ${JSON.stringify(c.address)})`);
      const parsed = parseAddress(c.address);
      console.log('Result:', parsed);
    } catch (e) {
      console.error('FAILED for', c.name, e);
    }
  });
}

testParse();
