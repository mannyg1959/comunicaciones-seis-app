-- =======================================================
-- SCRIPT DE BASE DE DATOS EN SUPABASE (FLOWLOG)
-- =======================================================

-- 1. SECUENCIAS PARA AUTO-GENERACIÓN DE IDS
CREATE SEQUENCE IF NOT EXISTS quote_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 5001;

-- 2. TABLAS PRINCIPALES

-- Tabla: profiles (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CONSTRAINT chk_role CHECK (role IN ('Admin', 'Ventas', 'Produccion')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: clients (Clientes)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: quotes (Cotizaciones)
CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY, -- Generado mediante trigger COT-YYYY-XXXX
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'Borrador' CONSTRAINT chk_quote_status CHECK (status IN ('Borrador', 'Pendiente', 'Enviada', 'En Negociación', 'Aprobada', 'Rechazada', 'Vencida', 'Anulada')),
    version INTEGER NOT NULL DEFAULT 1,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_terms TEXT,
    estimated_delivery_date DATE,
    approval_method TEXT CONSTRAINT chk_approval_method CHECK (approval_method IN ('Firma', 'Orden de Compra', 'Email')),
    purchase_order_number TEXT,
    purchase_order_doc_url TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: quote_items (Líneas / Ítems de la Cotización)
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id TEXT NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    line_of_business TEXT NOT NULL CONSTRAINT chk_line_of_business CHECK (line_of_business IN ('Impresión', 'Instalación', 'Corte', 'Diseño')),
    description TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    technical_details JSONB, -- Almacena detalles específicos de forma dinámica
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: work_orders (Órdenes de Trabajo)
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY, -- Generado mediante trigger OT-YYYY-XXXX
    quote_id TEXT REFERENCES public.quotes(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'Programación' CONSTRAINT chk_wo_status CHECK (status IN ('Programación', 'Producción', 'Revisión', 'Finalizado', 'Entregado')),
    priority TEXT NOT NULL DEFAULT 'Media' CONSTRAINT chk_wo_priority CHECK (priority IN ('Baja', 'Media', 'Alta', 'Crítica')),
    progress INTEGER NOT NULL DEFAULT 0 CONSTRAINT chk_wo_progress CHECK (progress BETWEEN 0 AND 100),
    department TEXT,
    assigned_technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Asignado a un único líder técnico
    planned_start TIMESTAMP WITH TIME ZONE,
    estimated_closure TIMESTAMP WITH TIME ZONE,
    real_start TIMESTAMP WITH TIME ZONE,
    real_closure TIMESTAMP WITH TIME ZONE,
    man_hours NUMERIC(6, 2),
    root_cause_diagnostic TEXT,
    work_report TEXT,
    pause_reason TEXT,
    direct_cost NUMERIC(12, 2),
    checklist JSONB,
    signature_url TEXT,
    service_rating INTEGER CONSTRAINT chk_wo_rating CHECK (service_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: work_order_incidents (Incidencias de la OT)
CREATE TABLE IF NOT EXISTS public.work_order_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: work_order_logs (Historial/Logs de cambios de la OT)
CREATE TABLE IF NOT EXISTS public.work_order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'status', 'incident', 'comment', 'creation'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TRIGGERS Y FUNCIONES DE NEGOCIO

-- A. Auto-generación de ID de Cotizaciones (COT-YYYY-XXXX)
CREATE OR REPLACE FUNCTION public.fn_generate_quote_id()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_val INTEGER;
BEGIN
    current_year := to_char(CURRENT_DATE, 'YYYY');
    next_val := nextval('public.quote_seq');
    NEW.id := 'COT-' || current_year || '-' || lpad(next_val::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER trg_generate_quote_id
BEFORE INSERT ON public.quotes
FOR EACH ROW
WHEN (NEW.id IS NULL)
EXECUTE FUNCTION public.fn_generate_quote_id();


-- B. Auto-generación de ID de Órdenes de Trabajo (OT-YYYY-XXXX)
CREATE OR REPLACE FUNCTION public.fn_generate_work_order_id()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_val INTEGER;
BEGIN
    current_year := to_char(CURRENT_DATE, 'YYYY');
    next_val := nextval('public.work_order_seq');
    NEW.id := 'OT-' || current_year || '-' || lpad(next_val::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_generate_work_order_id
BEFORE INSERT ON public.work_orders
FOR EACH ROW
WHEN (NEW.id IS NULL)
EXECUTE FUNCTION public.fn_generate_work_order_id();


-- C. Restricción de Eliminación de Cotizaciones (Solo 'Borrador' o 'Anulada')
CREATE OR REPLACE FUNCTION public.fn_check_quote_deletion_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status NOT IN ('Borrador', 'Anulada') THEN
        RAISE EXCEPTION 'Regla de Negocio: Solo se pueden eliminar cotizaciones cuyo estado sea BORRADOR o ANULADA. El estado actual de la cotización % es %', OLD.id, OLD.status;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_quote_deletion
BEFORE DELETE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_quote_deletion_status();


-- D. Actualización Automática de 'updated_at'
CREATE OR REPLACE FUNCTION public.fn_update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_quotes_modified
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_modified_column();

CREATE OR REPLACE TRIGGER trg_update_work_orders_modified
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_modified_column();


-- E. Validación de Estado Inicial de Cotizaciones (Solo 'Borrador' al insertar)
CREATE OR REPLACE FUNCTION public.fn_check_quote_insert_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM 'Borrador' THEN
        RAISE EXCEPTION 'Regla de Negocio: El estado inicial de una nueva cotización debe ser Borrador';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_quote_insert_status
BEFORE INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_quote_insert_status();

