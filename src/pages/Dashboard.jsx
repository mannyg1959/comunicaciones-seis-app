import React, { useState } from 'react';
import { 
  mockCotizaciones, 
  mockOrdenesTrabajo,
  mockConversionData,
  mockTimeToCloseData,
  mockRejectionReasonData,
  mockTopClientsData,
  mockOnTimeDeliveryData,
  mockProductionCycleTimeData,
  mockWorkloadByTypeData
} from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Package, User, LayoutDashboard, LogOut, TrendingUp, PieChart as PieChartIcon, BarChart2, Users, CheckCircle, Activity } from 'lucide-react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, LineChart, Line, Legend
} from 'recharts';

export default function Dashboard({ user, onLogout }) {
  const [activeKpiTab, setActiveKpiTab] = useState('cotizaciones');
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

      {/* KPI CHARTS SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', margin: '2rem 0 1.5rem 0' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} color="var(--primary-color)" /> Indicadores Clave (KPIs)
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--surface-hover)', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
          <button 
            className={`btn ${activeKpiTab === 'cotizaciones' ? 'btn-solid' : 'btn-text'}`}
            style={{ padding: '0.5rem 1rem', margin: 0, fontSize: '0.875rem' }}
            onClick={() => setActiveKpiTab('cotizaciones')}
          >
            Cotizaciones
          </button>
          <button 
            className={`btn ${activeKpiTab === 'produccion' ? 'btn-solid' : 'btn-text'}`}
            style={{ padding: '0.5rem 1rem', margin: 0, fontSize: '0.875rem' }}
            onClick={() => setActiveKpiTab('produccion')}
          >
            Producción
          </button>
        </div>
      </div>
      
      {activeKpiTab === 'cotizaciones' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* KPI 1: Tasa de Conversión */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChartIcon size={18} color="var(--success-color)" /> Tasa de Conversión de Cotizaciones
            </h3>
            <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockConversionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockConversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '42%', left: '0', right: '0', textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>65%</span>
              </div>
            </div>
          </div>
          <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
              Mide la efectividad de las propuestas comerciales, calculando el porcentaje de cotizaciones que se convierten en proyectos aprobados.
            </p>
          </div>
        </div>

        {/* KPI 2: Tiempo Medio de Cierre */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--primary-color)" /> Tiempo Medio de Cierre
            </h3>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTimeToCloseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="d" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Line type="monotone" dataKey="dias" name="Días" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
              Mide el promedio de días que transcurren desde que se emite una cotización hasta que el cliente la acepta o rechaza.
            </p>
          </div>
        </div>

        {/* KPI 3: Tasa de Cotizaciones Rechazadas por Motivo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="var(--error-color)" /> Rechazos por Motivo
            </h3>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRejectionReasonData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    cursor={{ fill: 'var(--surface-hover)' }}
                  />
                  <Bar dataKey="value" name="Porcentaje" radius={[0, 4, 4, 0]}>
                    {mockRejectionReasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="right" formatter={(val) => `${val}%`} style={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
              Analiza las razones principales por las cuales los clientes no aprueban las cotizaciones, ayudando a identificar áreas de mejora.
            </p>
          </div>
        </div>

        {/* KPI 4: Top Clientes por Volumen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--secondary-color)" /> Top Clientes (Volumen $)
            </h3>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTopClientsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    cursor={{ fill: 'var(--surface-hover)' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Volumen']}
                  />
                  <Bar dataKey="volumen" fill="var(--secondary-color)" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="volumen" 
                      position="top" 
                      formatter={(val) => `$${(val/1000).toFixed(1)}k`}
                      style={{ fill: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '500' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
              Muestra los clientes que generan el mayor volumen de ingresos proyectados a partir de las cotizaciones aprobadas.
            </p>
          </div>
        </div>
      </div>
      )}

      {activeKpiTab === 'produccion' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* KPI 1: On-Time Delivery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="var(--success-color)" /> Índice de Entregas a Tiempo
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockOnTimeDeliveryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockOnTimeDeliveryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '42%', left: '0', right: '0', textAlign: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>88%</span>
                </div>
              </div>
            </div>
            <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                Porcentaje de Órdenes de Trabajo que se completan y entregan al cliente en o antes de la fecha límite acordada.
              </p>
            </div>
          </div>

          {/* KPI 2: Production Cycle Time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--primary-color)" /> Ciclo de Producción
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockProductionCycleTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="d" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Line type="monotone" dataKey="dias" name="Días" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                Cantidad promedio de días que una Orden de Trabajo pasa estrictamente en el estado de Producción.
              </p>
            </div>
          </div>

          {/* KPI 3: Workload Distribution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--secondary-color)" /> Carga por Servicio
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockWorkloadByTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      cursor={{ fill: 'var(--surface-hover)' }}
                    />
                    <Bar dataKey="value" name="Volumen" radius={[0, 4, 4, 0]}>
                      {mockWorkloadByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="right" formatter={(val) => `${val}%`} style={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                Distribución del volumen de Órdenes de Trabajo activas divididas por el tipo de servicio.
              </p>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}
