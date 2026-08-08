-- =======================================================
-- SCRIPT DE SEMILLA (SEED) PARA USUARIOS DE PRUEBA
-- =======================================================

-- 1. Habilitar extensión para cifrado de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insertar usuarios en auth.users de Supabase
-- Nota: La contraseña para todos los usuarios creados a continuación será: FlowLog2026!

-- A. ADMINISTRADOR (admin@flowlog.com)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'aaaa1111-2222-3333-4444-555566667777',
    'authenticated',
    'authenticated',
    'admin@flowlog.com',
    crypt('FlowLog2026!', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- B. EJECUTIVO DE VENTAS (ventas@flowlog.com)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'bbbb1111-2222-3333-4444-555566667777',
    'authenticated',
    'authenticated',
    'ventas@flowlog.com',
    crypt('FlowLog2026!', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- C. JEFE DE PRODUCCIÓN (produccion@flowlog.com)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'cccc1111-2222-3333-4444-555566667777',
    'authenticated',
    'authenticated',
    'produccion@flowlog.com',
    crypt('FlowLog2026!', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    ''
) ON CONFLICT (id) DO NOTHING;


-- 3. Crear los perfiles correspondientes en public.profiles
-- Nota: La base de datos asocia estos perfiles de forma automática gracias al ID.

-- Perfil Administrador
INSERT INTO public.profiles (id, username, name, role)
VALUES (
    'aaaa1111-2222-3333-4444-555566667777',
    'admin',
    'Administrador Principal',
    'Admin'
) ON CONFLICT (id) DO NOTHING;

-- Perfil Ventas
INSERT INTO public.profiles (id, username, name, role)
VALUES (
    'bbbb1111-2222-3333-4444-555566667777',
    'ventas',
    'Ejecutivo de Ventas',
    'Ventas'
) ON CONFLICT (id) DO NOTHING;

-- Perfil Producción
INSERT INTO public.profiles (id, username, name, role)
VALUES (
    'cccc1111-2222-3333-4444-555566667777',
    'produccion',
    'Jefe de Producción',
    'Produccion'
) ON CONFLICT (id) DO NOTHING;
