-- ==============================================================================
-- Script de Inicialización de Transacciones
-- Descripción: Elimina todos los registros de Cotizaciones y Órdenes de Trabajo,
-- dejando intactos los clientes, perfiles de usuario y configuraciones maestras.
-- ==============================================================================

-- ADVERTENCIA: Este script eliminará TODOS los registros de las tablas mencionadas.
-- Asegúrate de ejecutarlo solo en tu entorno de desarrollo o cuando estés seguro
-- de querer reiniciar la data transaccional.

BEGIN;

-- TRUNCATE vacía las tablas principales.
-- CASCADE elimina también los registros en tablas dependientes (ej: quote_items, 
-- work_order_logs, work_order_incidents) que tengan llaves foráneas.
-- RESTART IDENTITY reinicia los contadores autoincrementales a 1.

TRUNCATE TABLE 
    public.quotes, 
    public.work_orders,
    public.system_logs
RESTART IDENTITY CASCADE;

COMMIT;
