-- Rastreios: só o servidor (service role) lê e escreve.
-- A página /rastreio consulta a tabela por uma função de servidor, que usa a chave
-- privilegiada; nenhuma tela do navegador lê a tabela direto.
DROP POLICY IF EXISTS "Anyone can read rastreios" ON public.rastreios;
DROP POLICY IF EXISTS "Authenticated can manage rastreios" ON public.rastreios;

REVOKE ALL ON public.rastreios FROM anon;
REVOKE ALL ON public.rastreios FROM authenticated;
GRANT ALL ON public.rastreios TO service_role;