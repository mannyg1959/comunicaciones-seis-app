import { Wrench } from 'lucide-react';

export default function Herramientas() {
  return (
    <div className="page-content">
      <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Wrench size={28} color="var(--primary-color)" /> Herramientas
      </h1>
      <div className="card">
        <p style={{ color: 'var(--text-muted)' }}>Próximamente: herramientas y utilidades de la aplicación.</p>
      </div>
    </div>
  );
}
