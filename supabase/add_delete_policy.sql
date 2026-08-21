-- =======================================================================
-- SCRIPT PARA HABILITAR EL BORRADO EN LA TABLA MONITOR_TICKER (SUPABASE)
-- =======================================================================
--
-- Por seguridad (RLS - Row Level Security), Supabase bloquea los borrados
-- si no existe una política explícita para la acción DELETE.
--
-- Ejecuta uno de los siguientes bloques en el SQL Editor de tu consola de Supabase:

-- Opcion A: Permitir que CUALQUIER usuario con acceso al sistema elimine mensajes (Recomendado para tu flujo de trabajo)
CREATE POLICY "Permitir eliminar mensajes a usuarios autenticados" 
ON public.monitor_ticker 
FOR DELETE 
TO authenticated 
USING (true);

-- Opcion B: Permitir que SOLO los usuarios con rol 'Admin' eliminen mensajes
-- CREATE POLICY "Permitir eliminar mensajes solo a administradores" 
-- ON public.monitor_ticker 
-- FOR DELETE 
-- TO authenticated 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles 
--     WHERE id = auth.uid() AND role = 'Admin'
--   )
-- );
