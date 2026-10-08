import { colors, defaultColor, kit, mindSlide, product } from "@/data/store";

/** Um par: cor e numeração. */
export type Pair = { colorId: string; size: string };
/** Um par avulso: uma cor e um tamanho. */
export type SingleItem = { type: "single"; colorId: string; size: string; qty: number };
/** O kit: `kit.pairs` pares, cada um com a cor e a numeração escolhidas. */
export type KitItem = { type: "kit"; pairs: Pair[]; qty: number };
/** Oferta do popup: Nike Mind 001 Slide, 1 ou 2 pares (cores de `mindSlide.colors`). */
export type MindItem = { type: "mind"; pairs: Pair[]; qty: 1 };
export type CartItem = SingleItem | KitItem | MindItem;

export const colorById = (id: string) => colors.find((c) => c.id === id) ?? defaultColor;

export const mindColorById = (id: string) =>
  mindSlide.colors.find((c) => c.id === id) ?? mindSlide.colors[0]!;

/** Preço da oferta do Nike Mind para a quantidade de pares (1 ou 2). */
export const mindOfferPrice = (pairs: number) =>
  mindSlide.offers.find((o) => o.pairs === pairs)?.price ?? mindSlide.offers[0]!.price;

/** Pares do Hyperslide no item (o kit tem um por par; o avulso, um só; a oferta Mind, nenhum). */
export const itemPairs = (item: CartItem): Pair[] =>
  item.type === "kit"
    ? item.pairs
    : item.type === "single"
      ? [{ colorId: item.colorId, size: item.size }]
      : [];

/** Fotos do item (uma por par) para miniaturas no checkout. */
export const itemThumbs = (item: CartItem): string[] =>
  item.type === "mind"
    ? item.pairs.map((p) => mindColorById(p.colorId).image)
    : itemPairs(item).map((p) => colorById(p.colorId).images[0].thumb);

export const itemName = (item: CartItem) =>
  item.type === "kit"
    ? kit.name
    : item.type === "mind"
      ? `${mindSlide.name}${item.pairs.length > 1 ? ` · ${item.pairs.length} pares` : ""}`
      : product.name;

/** Identifica itens iguais (mesma oferta, cores e tamanhos). */
export const itemKey = (item: CartItem) =>
  item.type === "single"
    ? `single:${item.colorId}:${item.size}`
    : `${item.type}:${item.pairs.map((p) => `${p.colorId}-${p.size}`).join("|")}`;

export const unitPrice = (item: CartItem) =>
  item.type === "kit"
    ? kit.price
    : item.type === "mind"
      ? mindOfferPrice(item.pairs.length)
      : product.price;

export const itemTotal = (item: CartItem) => unitPrice(item) * item.qty;

export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + itemTotal(i), 0);

/** Economia do kit em relação a comprar os pares avulsos. */
export const kitSavings = product.price * kit.pairs - kit.price;

/** O pedido já tem o slide da oferta? */
export const hasMind = (items: CartItem[]) => items.some((i) => i.type === "mind");

/** Variantes do item em texto, ex.: ["Preto · BR 41", "Orewood Brown · BR 39/40"]. */
export function describeItem(item: CartItem): string[] {
  if (item.type === "mind") {
    return item.pairs.map((p) => `${mindColorById(p.colorId).name} · BR ${p.size}`);
  }
  return itemPairs(item).map((p) => `${colorById(p.colorId).name} · BR ${p.size}`);
}

/** Valida itens lidos do armazenamento local (podem ser de uma versão antiga da loja). */
export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SingleItem> & Partial<KitItem>;
  if (typeof item.qty !== "number" || item.qty < 1) return false;
  const validPair = (p: { colorId?: string | undefined; size?: string | undefined } | undefined) =>
    !!p && typeof p.size === "string" && colors.some((c) => c.id === p.colorId);
  if (item.type === "single") return validPair({ colorId: item.colorId, size: item.size });
  if (item.type === "kit") {
    return (
      Array.isArray(item.pairs) && item.pairs.length === kit.pairs && item.pairs.every(validPair)
    );
  }
  if ((item as { type?: string }).type === "mind") {
    const pairs = (value as Partial<MindItem>).pairs;
    return (
      Array.isArray(pairs) &&
      mindSlide.offers.some((o) => o.pairs === pairs.length) &&
      pairs.every(
        (p) =>
          mindSlide.colors.some((c) => c.id === p?.colorId) && mindSlide.sizes.includes(p?.size),
      )
    );
  }
  return false;
}
