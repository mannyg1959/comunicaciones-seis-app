export const mockProfiles = [
  { id: 1, role: 'Admin', username: 'admin', name: 'Administrador' },
  { id: 2, role: 'Ventas', username: 'ventas', name: 'Ejecutivo de Ventas' },
  { id: 3, role: 'Produccion', username: 'prod', name: 'Jefe de Producción' }
];

export const mockCotizaciones = [
  {
    id: 'C-1001',
    cliente: 'Coca Cola',
    tipo: 'Impresión',
    monto: 1500.00,
    estado: 'Pendiente',
    fecha: '2026-07-25',
    fechaEntrega: '2026-07-28',
    ejecutivo: 'Carlos Mendoza'
  },
  {
    id: 'C-1002',
    cliente: 'Pepsi',
    tipo: 'Impresión',
    monto: 3200.50,
    estado: 'Aprobada',
    fecha: '2026-07-24',
    fechaEntrega: '2026-07-30',
    ejecutivo: 'Ana Gómez'
  },
  {
    id: 'C-1003',
    cliente: 'Nescafé',
    tipo: 'Instalación',
    monto: 12500.00,
    estado: 'Pendiente',
    fecha: '2026-07-23',
    fechaEntrega: '2026-07-20',
    ejecutivo: 'Luis Rojas'
  }
];

export const mockOrdenesTrabajo = [
  {
    id: 'OT-5001',
    cotizacionId: 'C-1002',
    cliente: 'Pepsi',
    tipo: 'Impresión',
    estado: 'Producción',
    progreso: 45,
    fechaEntrega: '2026-08-01'
  },
  {
    id: 'OT-5002',
    cotizacionId: 'C-0990',
    cliente: 'Bimbo',
    tipo: 'Corte',
    estado: 'Finalizado',
    progreso: 100,
    fechaEntrega: '2026-07-20'
  },
  {
    id: 'OT-5003',
    cotizacionId: 'C-1005',
    cliente: 'Coca Cola',
    tipo: 'Impresión',
    estado: 'Programación',
    progreso: 0,
    fechaEntrega: '2026-08-10'
  },
  {
    id: 'OT-5004',
    cotizacionId: 'C-1001',
    cliente: 'Nescafé',
    tipo: 'Instalación',
    estado: 'Revisión',
    progreso: 90,
    fechaEntrega: '2026-07-28'
  },
  {
    id: 'OT-5005',
    cotizacionId: 'C-0985',
    cliente: 'Bimbo',
    tipo: 'Impresión',
    estado: 'Entregado',
    progreso: 100,
    fechaEntrega: '2026-07-15'
  }
];

export const mockKPIs = {
  cotizacionesActivas: 15,
  pendientesAprobar: 3,
  ordenesProduccion: 8
};

export const mockChartData = [
  { name: 'Ene', produccion: 4000, ventas: 2400 },
  { name: 'Feb', produccion: 3000, ventas: 1398 },
  { name: 'Mar', produccion: 2000, ventas: 9800 },
  { name: 'Abr', produccion: 2780, ventas: 3908 },
  { name: 'May', produccion: 1890, ventas: 4800 },
  { name: 'Jun', produccion: 2390, ventas: 3800 },
  { name: 'Jul', produccion: 3490, ventas: 4300 },
];

export const mockOrderStatusData = [
  { name: 'Programación', cantidad: 12 },
  { name: 'Producción', cantidad: 8 },
  { name: 'Revisión', cantidad: 4 },
  { name: 'Finalizado', cantidad: 15 },
  { name: 'Entregado', cantidad: 20 },
];

export const mockConversionData = [
  { name: 'Aprobadas', value: 65, color: 'var(--success-color)' },
  { name: 'Rechazadas', value: 20, color: 'var(--error-color)' },
  { name: 'Pendientes', value: 15, color: 'var(--warning-color)' }
];

export const mockTimeToCloseData = [
  { name: 'Sem 1', dias: 4.5 },
  { name: 'Sem 2', dias: 3.8 },
  { name: 'Sem 3', dias: 5.2 },
  { name: 'Sem 4', dias: 2.9 },
  { name: 'Sem 5', dias: 4.0 },
];

export const mockRejectionReasonData = [
  { name: 'Precio Alto', value: 45, color: '#ff4d4f' },
  { name: 'Competencia', value: 25, color: '#faad14' },
  { name: 'Presupuesto Cancelado', value: 20, color: '#722ed1' },
  { name: 'Tiempos de Entrega', value: 10, color: '#595959' }
];

export const mockTopClientsData = [
  { name: 'Coca Cola', volumen: 45000 },
  { name: 'Pepsi', volumen: 32000 },
  { name: 'Bimbo', volumen: 28500 },
  { name: 'Nescafé', volumen: 19000 },
  { name: 'HUBB', volumen: 12500 }
];

export const mockOnTimeDeliveryData = [
  { name: 'A Tiempo', value: 88, color: 'var(--success-color)' },
  { name: 'Con Retraso', value: 12, color: 'var(--error-color)' }
];

export const mockProductionCycleTimeData = [
  { name: 'Sem 1', dias: 3.2 },
  { name: 'Sem 2', dias: 3.8 },
  { name: 'Sem 3', dias: 4.5 },
  { name: 'Sem 4', dias: 3.1 },
  { name: 'Sem 5', dias: 2.8 },
];

export const mockWorkloadByTypeData = [
  { name: 'Corte', value: 20, color: 'var(--warning-color)' },
  { name: 'Impresión', value: 45, color: 'var(--primary-color)' },
  { name: 'Diseño', value: 15, color: 'var(--secondary-color)' },
  { name: 'Instalación', value: 20, color: 'var(--success-color)' }
];
