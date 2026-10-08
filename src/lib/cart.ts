import { colors, defaultColor, kit, product } from "@/data/store";

/** Um par avulso: uma cor e um tamanho. */
export type SingleItem = { type: "single"; colorId: string; size: string; qty: number };
/** O kit: um par de cada cor de `kit.colorIds`, cada um com sua numeração. */
export type KitItem = { type: "kit"; sizes: Record<string, string>; qty: number };
export type CartItem = SingleItem | KitItem;

export const colorById = (id: string) => colors.find((c) => c.id === id) ?? defaultColor;

/** Identifica itens iguais na sacola (mesma oferta, cores e tamanhos). */
export const itemKey = (item: CartItem) =>
  item.type === "kit"
    ? `kit:${kit.colorIds.map((id) => item.sizes[id]).join("|")}`
    : `single:${item.colorId}:${item.size}`;

export const unitPrice = (item: CartItem) => (item.type === "kit" ? kit.price : product.price);

export const itemTotal = (item: CartItem) => unitPrice(item) * item.qty;

export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + itemTotal(i), 0);

/** Economia do kit em relação a comprar os pares avulsos. */
export const kitSavings = product.price * kit.colorIds.length - kit.price;

/** Variantes do item em texto, ex.: ["Preto · BR 41", "Orewood Brown · BR 39/40"]. */
export function describeItem(item: CartItem): string[] {
  if (item.type === "single") return [`${colorById(item.colorId).name} · BR ${item.size}`];
  return kit.colorIds.map((id) => `${colorById(id).name} · BR ${item.sizes[id] ?? "?"}`);
}

/** Valida itens lidos do armazenamento local (podem ser de uma versão antiga da loja). */
export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SingleItem> & Partial<KitItem>;
  if (typeof item.qty !== "number" || item.qty < 1) return false;
  if (item.type === "single") {
    return typeof item.size === "string" && colors.some((c) => c.id === item.colorId);
  }
  if (item.type === "kit") {
    const sizes = item.sizes;
    return !!sizes && kit.colorIds.every((id) => typeof sizes[id] === "string");
  }
  return false;
}
