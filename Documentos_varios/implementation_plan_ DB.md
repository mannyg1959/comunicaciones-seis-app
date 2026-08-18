# Plan de Implementación de la Base de Datos en Supabase (FlowLog)

Este documento detalla la estructura final propuesta para la base de datos de la aplicación **FlowLog** en Supabase (PostgreSQL), adaptada tras la resolución de definiciones clave.

## Ajustes y Respuestas Clave Incorporados

1. **Secuencia de Identificadores Continua**: Los IDs de Cotización (`COT-YYYY-XXXX`) y Órdenes de Trabajo (`OT-YYYY-XXXX`) utilizan una secuencia numérica autoincremental continua e infinita que no se reinicia con el cambio de año, aunque mantiene el año de creación en la cadena de texto del identificador.
2. **Asignación Única de Técnico**: La tabla `work_orders` cuenta con una clave foránea única `assigned_technician_id` apuntando a `profiles`, asegurando que una orden de trabajo esté a cargo de un único técnico líder.
3. **Sin Gestión de Inventario/Materiales**: Se ha omitido la tabla de consumibles o repuestos por el momento, simplificando la estructura para enfocarse 100% en el flujo operativo y de cotizaciones.
4. **Validación de Regla de Negocio (Eliminación)**: Se mantiene la restricción estricta vía trigger que impide la eliminación de cotizaciones a menos que su estado sea `'Borrador'` o `'Anulada'`.

---

## Estructura de Tablas Final

El script completo de creación ha sido estructurado en [schema.sql](file:///d:/Proyecto%20Comunicaciones%20SEIS%20App/supabase/schema.sql) y contiene las siguientes tablas:

* **`profiles`**: Almacena los perfiles de usuario y roles del sistema (`Admin`, `Ventas`, `Produccion`).
* **`clients`**: Registro de clientes con información comercial y operativa de contacto.
* **`quotes`**: Maestro de cotizaciones comerciales con sus montos, estados e identificador auto-generado.
* **`quote_items`**: Detalle de los servicios cotizados por línea de negocio (Impresión, Instalación, Corte, Diseño) con detalles técnicos dinámicos vía `JSONB`.
* **`work_orders`**: Órdenes de trabajo generadas a partir de cotizaciones aprobadas, asignadas a un técnico líder único.
* **`work_order_incidents`**: Registro de incidencias reportadas en el sitio de trabajo.
* **`work_order_logs`**: Historial y logs de auditoría de cada una de las OTs.

---

## Script SQL y Automatizaciones

El archivo de migración e inicialización [schema.sql](file:///d:/Proyecto%20Comunicaciones%20SEIS%20App/supabase/schema.sql) ya se encuentra creado y listo en tu workspace para que lo puedas copiar y pegar en la consola SQL de tu proyecto en Supabase.
