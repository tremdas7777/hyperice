import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/site-settings.functions";

/** Configurações públicas da loja (cartão ativo, WhatsApp). Enquanto carrega, tudo desligado. */
export function useStoreSettings() {
  const fetchSettings = useServerFn(getSiteSettings);
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });
  return {
    cardEnabled: data?.cardEnabled ?? false,
    whatsappEnabled: data?.whatsappEnabled ?? false,
  };
}
