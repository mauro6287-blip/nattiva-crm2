-- Limpiar datos previos si es necesario
-- truncate table public.tenants cascade;

-- 1. Insertar Tenant Demo
INSERT INTO public.tenants (id, name, slug, status, timezone)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Sindicato Demo',
  'demo',
  'active',
  'America/Santiago'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Roles Básicos
INSERT INTO public.roles (tenant_id, code, name, description)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin', 'Administrador', 'Acceso total al sistema del sindicato'),
  ('11111111-1111-1111-1111-111111111111', 'operador', 'Operador', 'Acceso limitado para gestión diaria'),
  ('11111111-1111-1111-1111-111111111111', 'proveedor', 'Proveedor', 'Acceso para validación de convenios')
ON CONFLICT DO NOTHING;
