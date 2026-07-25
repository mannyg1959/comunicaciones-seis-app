import { User, Mail, Phone, MapPin } from 'lucide-react';

export default function Perfiles({ user }) {
  if (!user) return null;

  return (
    <div className="page-content">
      <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <User size={28} color="var(--primary-color)" /> Mi Perfil
      </h1>
      
      <div className="card glass-panel" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'var(--primary-color)', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 1rem auto',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          {user.name.charAt(0)}
        </div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>{user.name}</h2>
        <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: '500' }}>{user.role}</p>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1rem' }}>Información de Contacto</h3>
      
      <div className="card" style={{ padding: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <User size={20} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usuario</p>
            <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>@{user.username}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <Mail size={20} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correo</p>
            <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{user.username}@seis.com</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <Phone size={20} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teléfono</p>
            <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>+52 55 1234 5678</p>
          </div>
        </div>
      </div>
    </div>
  );
}
