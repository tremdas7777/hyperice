import { colors, defaultColor, kit, product } from "@/data/store";

/** Um par: cor e numeração. */
export type Pair = { colorId: string; size: string };
/** Um par avulso: uma cor e um tamanho. */
export type SingleItem = { type: "single"; colorId: string; size: string; qty: number };
/** O kit: `kit.pairs` pares, cada um com a cor e a numeração escolhidas. */
export type KitItem = { type: "kit"; pairs: Pair[]; qty: number };
export type CartItem = SingleItem | KitItem;

export const colorById = (id: string) => colors.find((c) => c.id === id) ?? defaultColor;

/** Pares do item, um por par físico (o kit tem um por par; o avulso, um só). */
export const itemPairs = (item: CartItem): Pair[] =>
  item.type === "kit" ? item.pairs : [{ colorId: item.colorId, size: item.size }];

/** Identifica itens iguais na sacola (mesma oferta, cores e tamanhos). */
export const itemKey = (item: CartItem) =>
  item.type === "kit"
    ? `kit:${item.pairs.map((p) => `${p.colorId}-${p.size}`).join("|")}`
    : `single:${item.colorId}:${item.size}`;

export const unitPrice = (item: CartItem) => (item.type === "kit" ? kit.price : product.price);

export const itemTotal = (item: CartItem) => unitPrice(item) * item.qty;

export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + itemTotal(i), 0);

/** Economia do kit em relação a comprar os pares avulsos. */
export const kitSavings = product.price * kit.pairs - kit.price;

/** Variantes do item em texto, ex.: ["Preto · BR 41", "Orewood Brown · BR 39/40"]. */
export function describeItem(item: CartItem): string[] {
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
  return false;
}
