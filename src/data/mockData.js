export const mockProfiles = [
  { id: 1, role: 'Admin', username: 'admin', name: 'Administrador' },
  { id: 2, role: 'Ventas', username: 'ventas', name: 'Ejecutivo de Ventas' },
  { id: 3, role: 'Produccion', username: 'prod', name: 'Jefe de Producción' }
];

export const mockCotizaciones = [
  {
    id: 'C-1001',
    cliente: 'Coca Cola',
    tipo: 'Litografía/Digital',
    monto: 1500.00,
    estado: 'Pendiente',
    fecha: '2026-07-25'
  },
  {
    id: 'C-1002',
    cliente: 'Pepsi',
    tipo: 'Lona/Vinil',
    monto: 3200.50,
    estado: 'Aprobada',
    fecha: '2026-07-24'
  },
  {
    id: 'C-1003',
    cliente: 'Nescafé',
    tipo: 'Publicidad Estructural',
    monto: 12500.00,
    estado: 'Pendiente',
    fecha: '2026-07-23'
  }
];

export const mockOrdenesTrabajo = [
  {
    id: 'OT-5001',
    cotizacionId: 'C-1002',
    cliente: 'Pepsi',
    tipo: 'Lona/Vinil',
    estado: 'Producción',
    progreso: 45,
    fechaEntrega: '2026-08-01'
  },
  {
    id: 'OT-5002',
    cotizacionId: 'C-0990',
    cliente: 'Bimbo',
    tipo: 'Troquelado',
    estado: 'Finalizado',
    progreso: 100,
    fechaEntrega: '2026-07-20'
  },
  {
    id: 'OT-5003',
    cotizacionId: 'C-1005',
    cliente: 'Coca Cola',
    tipo: 'Litografía/Digital',
    estado: 'Pendiente',
    progreso: 0,
    fechaEntrega: '2026-08-10'
  },
  {
    id: 'OT-5004',
    cotizacionId: 'C-1001',
    cliente: 'Nescafé',
    tipo: 'Publicidad Estructural',
    estado: 'Revisión',
    progreso: 90,
    fechaEntrega: '2026-07-28'
  },
  {
    id: 'OT-5005',
    cotizacionId: 'C-0985',
    cliente: 'Bimbo',
    tipo: 'Impresión Offset',
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
  { name: 'Pendiente', cantidad: 12 },
  { name: 'Producción', cantidad: 8 },
  { name: 'Revisión', cantidad: 4 },
  { name: 'Finalizado', cantidad: 15 },
  { name: 'Entregado', cantidad: 20 },
];
