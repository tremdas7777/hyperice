/** Opções de frete do checkout. Preços usados no servidor — o cliente só exibe. */
export const FRETES = [
  { id: "gratis", name: "Frete Grátis", eta: "7 a 10 dias úteis", price: 0 },
  { id: "padrao", name: "Frete Padrão", eta: "5 dias úteis", price: 20 },
  { id: "express", name: "Frete Express", eta: "1 a 2 dias úteis", price: 37.53 },
] as const;

export type FreteId = (typeof FRETES)[number]["id"];

export const getFrete = (id: FreteId) => FRETES.find((f) => f.id === id) ?? FRETES[0];

/** Valor mínimo (produtos, sem frete) para liberar o frete grátis. 0 = grátis em qualquer pedido. */
export const FREE_SHIPPING_MIN = 200;

export const isFreeShippingEligible = (subtotal: number) => subtotal >= FREE_SHIPPING_MIN;

/** Chamada curta para a loja, ex.: "Frete grátis acima de R$ 200". */
export const FREE_SHIPPING_TEXT =
  FREE_SHIPPING_MIN > 0 ? `Frete grátis acima de R$ ${FREE_SHIPPING_MIN}` : "Frete grátis";
