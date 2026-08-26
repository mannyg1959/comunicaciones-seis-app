-- Crear tabla de contactos de cliente
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- Crear políticas para client_contacts (Permisos básicos)
CREATE POLICY "Permitir select a client_contacts" ON public.client_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir insert a client_contacts" ON public.client_contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir update a client_contacts" ON public.client_contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir delete a client_contacts" ON public.client_contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Migrar datos existentes desde clients
INSERT INTO public.client_contacts (client_id, contact_name, contact_phone, contact_email)
SELECT id, contact_name, contact_phone, contact_email
FROM public.clients
WHERE contact_name IS NOT NULL AND contact_name != '';

-- Agregar columna contact_id a la tabla de cotizaciones (quotes)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL;
