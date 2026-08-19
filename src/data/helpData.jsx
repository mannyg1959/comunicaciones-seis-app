import React from 'react';

export const helpData = {
  dashboard: (
    <div>
      <p>El <strong>Dashboard</strong> proporciona una vista de alto nivel del estado general del negocio en tiempo real.</p>
      
      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Tarjetas KPI</h4>
      <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong>Total Cotizaciones:</strong> Número total de cotizaciones activas (sin Orden de Trabajo generada).</li>
        <li style={{ marginBottom: '0.5rem' }}><strong>Aprobadas:</strong> Cotizaciones con estatus "Aprobada" listas para producción.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong>En Proceso:</strong> Cotizaciones en etapas intermedias (Enviada, En Negociación).</li>
        <li><strong>OTs Activas:</strong> Órdenes de trabajo en producción (no finalizadas).</li>
      </ul>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Pestañas de Análisis</h4>
      <p>Alternan entre métricas de ventas (Cotizaciones) y métricas operativas (Órdenes de Trabajo).</p>
      
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '1rem', marginTop: '1.5rem', borderRadius: '4px' }}>
        <strong>IMPORTANTE:</strong> Los gráficos de <em>Ranking de Clientes</em> solo contabilizan cotizaciones en estado <strong>Aprobada</strong> que tengan una Orden de Trabajo asociada.
      </div>
    </div>
  ),
  cotizaciones: (
    <div>
      <p>Gestione el ciclo de las propuestas comerciales. Aquí solo se muestran cotizaciones que <strong>no</strong> tienen una OT asignada.</p>
      
      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Estatus de Cotizaciones</h4>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>⚪ <strong>Borrador:</strong> En preparación.</li>
        <li style={{ marginBottom: '0.5rem' }}>🟡 <strong>Pendiente:</strong> Preparada, pendiente de acción.</li>
        <li style={{ marginBottom: '0.5rem' }}>🔵 <strong>Enviada:</strong> Enviada al cliente.</li>
        <li style={{ marginBottom: '0.5rem' }}>🟠 <strong>En Negociación:</strong> Conversación activa con el cliente.</li>
        <li style={{ marginBottom: '0.5rem' }}>🟢 <strong>Aprobada:</strong> Aceptada. Lista para generar OT.</li>
        <li style={{ marginBottom: '0.5rem' }}>🔴 <strong>Rechazada:</strong> Rechazada por el cliente o internamente.</li>
        <li>⚫ <strong>Anulada:</strong> Cancelada internamente.</li>
      </ul>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Generar PDF</h4>
      <p>Presione el ícono de documento en la tarjeta para generar un PDF listo para enviar al cliente. Contiene todos los detalles y el membrete de la empresa.</p>

      <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', marginTop: '1.5rem', borderRadius: '4px' }}>
        <strong>ADVERTENCIA:</strong> Solo se pueden eliminar permanentemente cotizaciones en estado <strong>Borrador</strong> o <strong>Anulada</strong>. Si tiene otro estatus, deberá anularla primero.
      </div>
    </div>
  ),
  ordenesTrabajo: (
    <div>
      <p>Las Órdenes de Trabajo (OTs) representan la ejecución operativa de los servicios aprobados.</p>
      
      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Etapas (Kanban)</h4>
      <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong>Programación:</strong> Planificada, pendiente de iniciar producción.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong>Producción:</strong> Trabajo en ejecución activa.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong>Revisión:</strong> Terminada, en control de calidad.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong>Finalizado:</strong> Aprobada internamente, lista para entregar.</li>
        <li><strong>Entregado:</strong> El trabajo se ha entregado al cliente.</li>
      </ul>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Incidencias y Pausas</h4>
      <p>Si surge un problema en producción, puede registrar una <strong>Incidencia</strong> dentro de los detalles de la OT. Si la OT debe detenerse por un factor bloqueante, puede <strong>Pausarla</strong> indicando el motivo. Estas acciones aparecerán marcadas con alertas visuales (⚠️ y 🔒) en los listados.</p>
    </div>
  ),
  herramientas: (
    <div>
      <p>Módulo de análisis, exportación de datos y control de alertas.</p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Reportes</h4>
      <p>Visualice tasas de conversión, motivos de rechazo y tiempos de ciclo. Todos los gráficos se alimentan de los datos reales del sistema.</p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Exportar CSV</h4>
      <p>Descargue sus datos a Excel. Use los filtros de fechas y estatus para evitar generar archivos muy pesados si tiene gran volumen de registros.</p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Monitor Ticker</h4>
      <p>Envíe mensajes rotativos a la pantalla de TV del <strong>Monitor Kanban</strong> de Producción. Los mensajes "Urgentes" resaltarán en rojo intenso. Configure el tiempo de expiración para que desaparezcan automáticamente cuando ya no sean relevantes.</p>
    </div>
  ),
  ajustes: (
    <div>
      <p>Configuración general y administración del sistema. Exclusivo para el rol Administrador.</p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Gestión de Usuarios</h4>
      <p>Al crear un usuario, el sistema asigna una contraseña temporal. El usuario deberá <strong>cambiarla obligatoriamente</strong> en su primer inicio de sesión para habilitar su cuenta.</p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Roles y Permisos</h4>
      <p>Al apagar un interruptor en la matriz, el permiso se revoca en tiempo real para todos los usuarios de ese rol, restringiendo sus accesos al instante.</p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Log de Auditoría</h4>
      <p>Rastree de manera precisa quién, cuándo y qué acción se realizó en el sistema (cambios de estatus, creación de registros, eliminaciones, etc.).</p>

      <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '1rem', marginTop: '1.5rem', borderRadius: '4px' }}>
        <strong>NOTA:</strong> Configure los parámetros de KPIs Operativos (como las horas de advertencia por inactividad de una OT) para ajustar la sensibilidad con la que se disparan las notificaciones automáticas en el panel de Alertas.
      </div>
    </div>
  )
};
