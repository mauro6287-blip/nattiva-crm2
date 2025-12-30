INSERT INTO public.content_items (
    id,
    tenant_id,
    provider_id,
    title,
    summary,
    content_html,
    status,
    thumbnail_url,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111', -- Tu Tenant ID
    '9ae1c5d0-d230-408f-be2d-322a04a8ece8', -- Tu User ID Real
    '¡Noticia Inyectada por SQL!',
    'Si lees esto, el Hito 4 es un éxito total.',
    '<p>Esta noticia confirma que el Backend y la API funcionan perfectamente.</p>',
    'publicado', -- Estado directo a publicado
    'https://placehold.co/600x400',
    now(),
    now()
);
