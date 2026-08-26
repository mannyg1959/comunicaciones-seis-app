-- Añadir columna de validez (en días) a la tabla quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 15;
