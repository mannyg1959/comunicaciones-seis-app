export const logEvent = (user, action, details) => {
  const saved = localStorage.getItem('comunicaciones_seis_logs');
  const logs = saved ? JSON.parse(saved) : [];
  const newLog = {
    id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    usuario: user ? user.name : 'Sistema',
    username: user ? user.username : 'sistema',
    action,
    details
  };
  logs.unshift(newLog);
  localStorage.setItem('comunicaciones_seis_logs', JSON.stringify(logs.slice(0, 500)));
};
