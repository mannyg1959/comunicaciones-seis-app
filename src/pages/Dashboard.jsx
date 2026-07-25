import { mockCotizaciones, mockOrdenesTrabajo } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Package, User, LayoutDashboard, LogOut } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const activeCotizaciones = mockCotizaciones.filter(c => !c.convertidaAOT);
  const cotizacionStatusCounts = {
    'Borrador': 0,
    'Pendiente': 0,
    'Enviada': 0,
    'Aprobada': 0
  };
  activeCotizaciones.forEach(c => {
    if (cotizacionStatusCounts[c.estado] !== undefined) {
      cotizacionStatusCounts[c.estado]++;
    }
  });

  const cotizacionesList = [
    { name: 'Borrador', count: cotizacionStatusCounts['Borrador'], color: 'var(--text-muted)' },
    { name: 'Pendiente', count: cotizacionStatusCounts['Pendiente'], color: 'var(--warning-color)' },
    { name: 'Enviada', count: cotizacionStatusCounts['Enviada'], color: 'var(--secondary-color)' },
    { name: 'Aprobada', count: cotizacionStatusCounts['Aprobada'], color: 'var(--success-color)' }
  ];

  const orderStatusCounts = {
    'Pendiente': 0,
    'Producción': 0,
    'Revisión': 0,
    'Finalizado': 0,
    'Entregado': 0
  };
  
  mockOrdenesTrabajo.forEach(ot => {
    if (orderStatusCounts[ot.estado] !== undefined) {
      orderStatusCounts[ot.estado]++;
    }
  });

  const ordenesList = [
    { name: 'Pendiente', count: orderStatusCounts['Pendiente'], color: 'var(--status-pendiente)' },
    { name: 'Producción', count: orderStatusCounts['Producción'], color: 'var(--status-produccion)' },
    { name: 'Revisión', count: orderStatusCounts['Revisión'], color: 'var(--status-revision)' },
    { name: 'Finalizado', count: orderStatusCounts['Finalizado'], color: 'var(--status-finalizado)' },
    { name: 'Entregado', count: orderStatusCounts['Entregado'], color: 'var(--status-entregado)' }
  ];

  const dynamicOrderStatusData = [
    { name: 'Pendiente', cantidad: orderStatusCounts['Pendiente'] },
    { name: 'Producción', cantidad: orderStatusCounts['Producción'] },
    { name: 'Revisión', cantidad: orderStatusCounts['Revisión'] },
    { name: 'Finalizado', cantidad: orderStatusCounts['Finalizado'] },
    { name: 'Entregado', cantidad: orderStatusCounts['Entregado'] },
  ];

  const filteredOrderStatusData = dynamicOrderStatusData.filter(item => item.name !== 'Entregado');
  const totalOrders = filteredOrderStatusData.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="page-content">
      <div className="app-header" style={{ padding: '0 0 1.5rem 0', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Bienvenido de nuevo</p>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={28} color="var(--primary-color)" /> Panel de Control
          </h1>
        </div>
        <div className="logo-container" onClick={() => window.location.reload()} title="Recargar Panel">
          <img src="/logo.png" alt="Logo" />
        </div>
      </div>

      <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', color: 'var(--text-main)', lineHeight: '1.5', fontWeight: 'bold', textAlign: 'center' }}>
        Sistema Centralizado de Trazabilidad y Gestión de Pedidos
      </p>

      <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1.5rem', background: 'var(--surface-hover)' }}>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.75rem', borderRadius: '50%' }}>
          <User size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--text-main)' }}>{user?.name || 'Administrador'}</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Usuario: @{user?.username || 'admin'}</p>
        </div>
        {onLogout && (
          <button className="btn-icon btn-icon-red" onClick={onLogout} title="Cerrar sesión" style={{ cursor: 'pointer', border: 'none' }}>
            <LogOut size={20} />
          </button>
        )}
      </div>

      <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Acciones Rápidas</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-solid" onClick={() => navigate('/cotizaciones')}>Nueva Cotización</button>
        <button className="btn btn-secondary" onClick={() => navigate('/ordenes')}>Ver Órdenes</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* COTIZACIONES */}
        <div className="card glass-panel" style={{ padding: '1rem', margin: 0 }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary-color)" /> Cotizaciones
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cotizacionesList.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  <span style={{ fontSize: '0.875rem' }}>{item.name}</span>
                </div>
                <strong style={{ fontSize: '1rem' }}>{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
        
        {/* ORDENES DE TRABAJO */}
        <div className="card glass-panel" style={{ padding: '1rem', margin: 0 }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--primary-color)" /> Órdenes (OT)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ordenesList.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  <span style={{ fontSize: '0.875rem' }}>{item.name}</span>
                </div>
                <strong style={{ fontSize: '1rem' }}>{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="card glass-panel" style={{ padding: '1rem', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Órdenes por Estatus</h2>
        <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredOrderStatusData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                itemStyle={{ color: 'var(--text-main)' }}
                cursor={{ fill: 'var(--surface-hover)' }}
              />
              <Bar dataKey="cantidad" fill="var(--primary-color)" radius={[6, 6, 0, 0]}>
                <LabelList 
                  dataKey="cantidad" 
                  position="top" 
                  formatter={(value) => `${Math.round((value / totalOrders) * 100)}%`}
                  style={{ fill: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '500' }}
                />
                {
                  filteredOrderStatusData.map((entry, index) => {
                    let fillColor = 'var(--primary-color)';
                    switch(entry.name) {
                      case 'Pendiente': fillColor = 'var(--status-pendiente)'; break;
                      case 'Producción': fillColor = 'var(--status-produccion)'; break;
                      case 'Revisión': fillColor = 'var(--status-revision)'; break;
                      case 'Finalizado': fillColor = 'var(--status-finalizado)'; break;
                      case 'Entregado': fillColor = 'var(--status-entregado)'; break;
                    }
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
