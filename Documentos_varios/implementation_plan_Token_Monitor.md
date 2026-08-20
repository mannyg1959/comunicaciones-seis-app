# Implementación de Enlace Seguro para Monitor TV

Este plan detalla los pasos para migrar el acceso del Monitor (actualmente público y sin seguridad) a un sistema de "Enlace Seguro por Token", ideal para pantallas desatendidas (Smart TVs).

## User Review Required

> [!IMPORTANT]
> Revisa este plan y presiona **Proceed (Proceder)** si estás de acuerdo. Al implementarlo, la URL antigua dejará de funcionar y solo se podrá acceder mediante el enlace generado en Ajustes.

## Cambios Propuestos

### 1. Panel de Ajustes (Ajustes.jsx)
- **Generador de Enlaces**: Agregaré una nueva sección en el panel de Configuración que permitirá generar, visualizar y copiar el enlace seguro del monitor.
- **Base de Datos**: El token del enlace se guardará en la tabla `system_settings` (donde actualmente se guardan los KPIs globales) bajo la llave `monitor_tv_token`.
- **Botón Revocar**: Incluiré un botón para regenerar el token, lo cual invalidará instantáneamente cualquier enlace anterior (por si alguna vez necesitas bloquear el acceso a un TV antiguo).

### 2. Enrutador Principal (App.jsx)
- **Ruta Protegida por URL**: Modificaré la ruta pública de `/monitor-kanban` a `/monitor-kanban/:token` para que la página solo cargue si recibe un parámetro en la URL.

### 3. Pantalla del Monitor (MonitorKanban.jsx)
- **Validación Estricta**: Al abrir la página, el sistema verificará el `token` de la URL contra la base de datos antes de descargar ninguna información confidencial de las órdenes o clientes.
- **Acceso Denegado**: Si alguien intenta entrar a `/monitor-kanban` sin token, o con un token revocado, verá una pantalla de "Acceso Denegado" sin menús ni opciones para hackear el sistema.

## Verification Plan

### Automated Tests
- No aplican pruebas unitarias automatizadas para este módulo.

### Manual Verification
- Te pediré que entres a la sección de Ajustes como Administrador.
- Generarás un enlace nuevo.
- Verificaremos que el enlace abre el Monitor correctamente en una nueva pestaña (simulando un Smart TV).
- Regenerarás el enlace y verificaremos que el enlace viejo muestra "Acceso Denegado".
