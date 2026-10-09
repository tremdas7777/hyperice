import { createFileRoute } from "@tanstack/react-router";

// Notificação da PixGate e da Umbrella (Pix) e da HyperCash (cartão). O corpo não é confiável: usamos só o id
// e sempre confirmamos o status na API autenticada antes de reportar a venda.
export const Route = createFileRoute("/api/public/pix-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resposta do gateway/banco sem tipo
        const body = (await request.json().catch(() => null)) as any;
        const gw = new URL(request.url).searchParams.get("gw");
        // Umbrella notifica com ?gw=um e manda o id da transação em "objectId"; o pedido é salvo com prefixo "um_".
        const isUmbrella = gw === "um";
        const rawId =
          (isUmbrella ? (body?.objectId ?? body?.data?.id ?? body?.id) : undefined) ??
          body?.transaction_id ??
          body?.id ??
          body?.transaction?.id ??
          body?.body?.transaction?.id ??
          body?.data?.id;
        // HyperCash (cartão) notifica nesta mesma rota com ?gw=hc; o pedido é salvo com prefixo "hc_".
        const isCard = gw === "hc";
        const prefix = isCard ? "hc_" : isUmbrella ? "um_" : "";
        const id = rawId == null ? "" : `${prefix}${String(rawId)}`;
        console.log("pix-webhook", body?.event, id);
        if (!/^[\w-]{1,64}$/.test(id)) return Response.json({ ok: true });
        try {
          const { fetchGatewayStatus, reportPaidOnce, isPaidStatus } =
            await import("@/lib/pix-orders.server");
          const { status, amount } = await fetchGatewayStatus(id);
          if (isPaidStatus(status)) await reportPaidOnce(id, amount);
        } catch (e) {
          console.error("pix-webhook failed", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
