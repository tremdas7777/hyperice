-- Backend da loja: funil, configurações, pedidos (Pix/cartão) e rastreio.
-- Mesmo esquema das outras lojas, começando sem dados de outras contas.

-- Funil de visitas e etapas do checkout (admin + checkouts abandonados)
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT,
  bundle_id TEXT,
  bundle_name TEXT,
  value NUMERIC,
  referrer TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at DESC);
CREATE INDEX idx_funnel_events_session ON public.funnel_events (session_id);
CREATE INDEX idx_funnel_events_type ON public.funnel_events (event_type);

GRANT INSERT ON public.funnel_events TO anon, authenticated;
GRANT ALL ON public.funnel_events TO service_role;

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
ON public.funnel_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
ALTER TABLE public.funnel_events REPLICA IDENTITY FULL;

-- Configurações públicas da loja (liga/desliga e IDs públicos de pixels)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

-- WhatsApp e cartão começam desligados (ativação pelo /admin).
INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_enabled', 'false'::jsonb),
  ('card_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Rastreio por CPF
CREATE TABLE public.rastreios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido TEXT NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  codigo_rastreio TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pedido_recebido',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rastreios_codigo ON public.rastreios(codigo_rastreio);
CREATE INDEX idx_rastreios_status ON public.rastreios(status);
CREATE INDEX idx_rastreios_criacao ON public.rastreios(data_criacao);

GRANT SELECT ON public.rastreios TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rastreios TO authenticated;
GRANT ALL ON public.rastreios TO service_role;

ALTER TABLE public.rastreios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rastreios"
ON public.rastreios FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated can manage rastreios"
ON public.rastreios FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Chaves e tokens das integrações (só o servidor lê: service role)
CREATE TABLE public.private_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.private_settings TO service_role;
ALTER TABLE public.private_settings ENABLE ROW LEVEL SECURITY;

-- Pedidos (Pix e cartão), usados para reportar a venda mesmo sem o cliente na página
CREATE TABLE public.pix_orders (
  id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'waiting_payment',
  amount_cents integer NOT NULL,
  customer jsonb NOT NULL,
  bundle_id text NOT NULL,
  bundle_name text NOT NULL,
  utm jsonb,
  fbp text,
  fbc text,
  ip text,
  ua text,
  url text,
  paid_reported_at timestamptz,
  report_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pix_orders TO service_role;
ALTER TABLE public.pix_orders ENABLE ROW LEVEL SECURITY;
