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

async function testMap() {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error(error);
    return;
  }

  const uniqueClientsMap = new Map();
  const duplicateIdsToDelete = [];

  data.forEach(c => {
    if (!c || !c.name) return;
    const normName = c.name.trim().toLowerCase();
    if (!uniqueClientsMap.has(normName)) {
      const parsed = parseAddress(c.address);
      uniqueClientsMap.set(normName, {
        id: c.id || '',
        empresa: c.name || '',
        contacto: c.contact_name || '',
        rif: c.id || '',
        telefono: c.contact_phone || '',
        correo: c.contact_email || '',
        ciudad: parsed.ciudad,
        estado: parsed.estado,
        direccion: parsed.direccion,
        observaciones: ''
      });
    } else {
      if (c.id) duplicateIdsToDelete.push(c.id);
    }
  });

  const activeClients = Array.from(uniqueClientsMap.values());
  console.log('Processed activeClients length:', activeClients.length);
  console.log('Duplicates to delete count:', duplicateIdsToDelete.length);
  console.log('Client list:', activeClients.map(c => c.empresa));
}

testMap();
