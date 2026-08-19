import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { helpData } from '../data/helpData';

export default function HelpDrawer({ module }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Obtener el contenido basado en el prop 'module'
  const content = helpData[module] || <p>No hay ayuda disponible para este módulo.</p>;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn-icon"
        title="Ver ayuda de este módulo"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px', // Mantenemos la regla de altura de botones de 48px
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(30, 58, 138, 0.4)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <HelpCircle size={24} />
      </button>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div 
            className="glass-panel" 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              height: '100%',
              backgroundColor: 'var(--bg-card, #1e293b)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              margin: 0,
              borderRadius: 0
            }}
          >
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2rem 2rem 1rem 2rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'var(--bg-card, #1e293b)',
                zIndex: 10,
                flexShrink: 0
              }}
            >
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={24} color="var(--primary-color, #3b82f6)" /> Ayuda del Módulo
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div 
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '1.5rem 2rem 6rem 2rem',
                color: 'var(--text-main, #f1f5f9)', 
                fontSize: '0.95rem', 
                lineHeight: '1.6' 
              }}
            >
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
