import { z } from "zod";
import { colors, kit, product, sizes } from "@/data/store";
import { cartTotal, colorById, describeItem, itemPairs, type CartItem } from "@/lib/cart";

const colorIds = colors.map((c) => c.id) as [string, ...string[]];
const sizeIds = sizes.map((s) => s.br) as [string, ...string[]];

export const colorSchema = z.enum(colorIds);
export const sizeSchema = z.enum(sizeIds);
const qtySchema = z.number().int().min(1).max(10);

/** Itens da sacola enviados pelo navegador. O preço é sempre recalculado no servidor. */
export const cartItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("single"), colorId: colorSchema, size: sizeSchema, qty: qtySchema }),
  z.object({
    type: z.literal("kit"),
    pairs: z.array(z.object({ colorId: colorSchema, size: sizeSchema })).length(kit.pairs),
    qty: qtySchema,
  }),
]);

export const cartSchema = z.array(cartItemSchema).min(1).max(10);

export type OrderLine = { title: string; detail: string; price: number; colorIds: string[] };

/** Resumo do pedido (servidor e telas): nome, linhas, itens para o envio e total dos produtos. */
export function orderSummary(items: CartItem[]) {
  const kinds = new Set(items.map((i) => i.type));
  const bundleId = kinds.size > 1 ? "mix" : items[0]?.type === "kit" ? "kit" : "single";
  const name = (i: CartItem) => (i.type === "kit" ? kit.name : product.name);
  const lines: OrderLine[] = items.map((i) => ({
    title: `${i.qty > 1 ? `${i.qty}x ` : ""}${name(i)}`,
    detail: describeItem(i).join(" + "),
    price: (i.type === "kit" ? kit.price : product.price) * i.qty,
    colorIds: itemPairs(i).map((p) => p.colorId),
  }));
  // Um item por par, como vai na caixa (para a transportadora/rastreio).
  const shipItems = items.flatMap((i) =>
    itemPairs(i).map((p) => ({
      name: `${product.name} — ${colorById(p.colorId).name} BR ${p.size}`,
      quantity: i.qty,
      price: i.type === "kit" ? kit.price / kit.pairs : product.price,
    })),
  );
  return {
    bundleId,
    bundleName: items
      .map((i) => `${i.qty}x ${name(i)} (${describeItem(i).join(" + ")})`)
      .join(" + "),
    lines,
    shipItems,
    pairs: shipItems.reduce((n, s) => n + s.quantity, 0),
    products: cartTotal(items),
  };
}
