import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Megaphone } from 'lucide-react';

/**
 * MonitorTicker — Banda horizontal inferior estilo noticiario TV.
 * Se suscribe a la tabla `monitor_ticker` via Supabase Realtime.
 * Los mensajes scrollan de derecha a izquierda en un loop continuo.
 */
export default function MonitorTicker() {
  const [messages, setMessages] = useState([]);
  const trackRef = useRef(null);

  const fetchMessages = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('monitor_ticker')
      .select('id, message, sender_name, priority, created_at, expires_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Suscripción Realtime a cambios en monitor_ticker
    const channel = supabase
      .channel('monitor_ticker_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monitor_ticker' },
        () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Si no hay mensajes activos, no renderizar nada
  if (messages.length === 0) return null;

  // Construir texto concatenado del ticker
  const tickerText = messages
    .map(m => {
      const prefix = m.priority === 'urgente' ? '🚨 URGENTE: ' : '📢 ';
      return `${prefix}${m.message}`;
    })
    .join('     ◆     ');

  const hasUrgent = messages.some(m => m.priority === 'urgente');

  return (
    <div className={`monitor-ticker-bar ${hasUrgent ? 'urgent' : ''}`}>
      {/* Icono identificador */}
      <div className="ticker-icon">
        <Megaphone size={16} />
        <span>AVISOS</span>
      </div>

      {/* Banda de texto scrollable */}
      <div className="ticker-viewport">
        <div className="ticker-track" ref={trackRef}>
          {/* Texto duplicado para loop continuo sin salto visual */}
          <span className="ticker-content">{tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span className="ticker-content" aria-hidden="true">{tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
