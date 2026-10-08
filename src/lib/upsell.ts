import { caps, socks } from "@/data/store";

/**
 * Ofertas da tela pós-compra (Pix e cartão): meias (branca e/ou preta), bonés (preto e/ou branco),
 * seguro e envio expresso.
 */
export const UPSELL_PRODUCTS = [
  "meia-branca",
  "meia-preta",
  "bone-preto",
  "bone-branco",
  "seguro",
  "expresso",
] as const;
export type UpsellProduct = (typeof UPSELL_PRODUCTS)[number];

export const SOCK_SIZES = socks.sizes.map((s) => s.id) as [string, ...string[]];

/** Oferta de meia de cada cor (id da oferta → cor). */
export const SOCK_OFFERS = socks.colors.map((c) => ({
  product: `meia-${c.id}` as UpsellProduct,
  color: c,
}));

/** Oferta de boné de cada cor (id da oferta → cor). Tamanho único. */
export const CAP_OFFERS = caps.colors.map((c) => ({
  product: `bone-${c.id}` as UpsellProduct,
  color: c,
}));

export const isSock = (p: string) => p.startsWith("meia-");
const isCap = (p: string) => p.startsWith("bone-");

/** Foto da oferta (meia ou boné) para as miniaturas do pedido. */
export const offerImage = (p: UpsellProduct) =>
  [...SOCK_OFFERS, ...CAP_OFFERS].find((o) => o.product === p)?.color.image;

/** Tamanho da meia sugerido pela numeração BR do chinelo (ex.: "41" ou "39/40" → M). */
export function sockSizeFor(brSize: string | null | undefined): string {
  const n = Number.parseInt(brSize ?? "", 10);
  if (!Number.isFinite(n)) return "M";
  const first = socks.sizes[0]!;
  if (n < first.from) return first.id;
  return (socks.sizes.find((s) => n >= s.from && n < s.to) ?? socks.sizes.at(-1)!).id;
}

/** Seguro de entrega (pós-compra): reenvio ou reembolso em caso de extravio ou dano no transporte. */
export const SHIPPING_INSURANCE = {
  name: "Seguro de entrega",
  fullName: "Seguro de entrega — reenvio ou reembolso",
  /** Nome enviado ao gateway. */
  gatewayName: "Seguro de entrega",
  price: 29.9,
} as const;

/** Envio expresso: página própria depois da tela de ofertas (cobrança separada). */
export const EXPRESS_SHIPPING = {
  name: "Envio expresso",
  /** Nome enviado ao gateway. */
  gatewayName: "Envio expresso",
  price: 19.9,
} as const;

/**
 * O que o cliente escolheu na tela pós-compra, numa cobrança só (preços do servidor).
 * Itens repetidos ou desconhecidos são ignorados; a ordem segue UPSELL_PRODUCTS.
 * As meias precisam do tamanho; sem ele, ficam de fora.
 */
export function upsellSelection(chosen: readonly string[], sockSize?: string | null) {
  const products = UPSELL_PRODUCTS.filter(
    (p) => chosen.includes(p) && (!isSock(p) || (!!sockSize && SOCK_SIZES.includes(sockSize))),
  );
  const items = products.map((p) => {
    if (isSock(p)) {
      const color = SOCK_OFFERS.find((o) => o.product === p)!.color;
      return {
        product: p,
        title: socks.gatewayName,
        price: socks.price,
        label: `${socks.name} ${color.name} · ${sockSize}`,
      };
    }
    if (isCap(p)) {
      const color = CAP_OFFERS.find((o) => o.product === p)!.color;
      return {
        product: p,
        title: caps.gatewayName,
        price: caps.price,
        label: `${caps.name} ${color.name}`,
      };
    }
    const o = p === "seguro" ? SHIPPING_INSURANCE : EXPRESS_SHIPPING;
    return { product: p, title: o.gatewayName, price: o.price, label: o.name };
  });
  const total = Math.round(items.reduce((s, i) => s + i.price * 100, 0)) / 100;
  return { products, items, total, label: items.map((i) => i.label).join(" + ") };
}
