import { supabase } from './supabaseClient';

export const logEvent = (user, action, details) => {
  try {
    const newLog = {
      usuario: user ? user.name : 'Sistema',
      username: user ? user.username : 'sistema',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    
    // Fire-and-forget background save
    supabase.from('system_logs').insert([newLog]).then(({ error }) => {
      if (error) console.error('Error saving system log:', error);
    });
  } catch (err) {
    console.error('Exception saving system log:', err);
  }
};
