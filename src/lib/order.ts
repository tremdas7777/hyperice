import { z } from "zod";
import { colors, kit, mindSlide, product, sizes } from "@/data/store";
import {
  cartTotal,
  colorById,
  describeItem,
  itemName,
  itemPairs,
  itemThumbs,
  mindColorById,
  unitPrice,
  type CartItem,
} from "@/lib/cart";

const colorIds = colors.map((c) => c.id) as [string, ...string[]];
const sizeIds = sizes.map((s) => s.br) as [string, ...string[]];
const mindColorIds = mindSlide.colors.map((c) => c.id) as [string, ...string[]];
const mindSizes = mindSlide.sizes as [string, ...string[]];

export const colorSchema = z.enum(colorIds);
export const sizeSchema = z.enum(sizeIds);
const qtySchema = z.number().int().min(1).max(10);

/** Itens do pedido enviados pelo navegador. O preço é sempre recalculado no servidor. */
export const cartItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("single"), colorId: colorSchema, size: sizeSchema, qty: qtySchema }),
  z.object({
    type: z.literal("kit"),
    pairs: z.array(z.object({ colorId: colorSchema, size: sizeSchema })).length(kit.pairs),
    qty: qtySchema,
  }),
  z.object({
    type: z.literal("mind"),
    pairs: z
      .array(z.object({ colorId: z.enum(mindColorIds), size: z.enum(mindSizes) }))
      .min(1)
      .max(Math.max(...mindSlide.offers.map((o) => o.pairs))),
    qty: z.literal(1),
  }),
]);

export const cartSchema = z
  .array(cartItemSchema)
  .min(1)
  .max(10)
  // A oferta do Nike Mind só vale junto com o Hyperslide, uma vez por pedido.
  .refine((items) => items.some((i) => i.type !== "mind"), "Escolha o seu Hyperslide")
  .refine(
    (items) => items.filter((i) => i.type === "mind").length <= 1,
    "Oferta limitada a 1 por pedido",
  );

export type OrderLine = { title: string; detail: string; price: number; thumbs: string[] };

/** Resumo do pedido (servidor e telas): nome, linhas, itens para o envio e total dos produtos. */
export function orderSummary(items: CartItem[]) {
  const main = items.filter((i) => i.type !== "mind");
  const kinds = new Set(main.map((i) => i.type));
  const mainId = kinds.size > 1 ? "mix" : main[0]?.type === "kit" ? "kit" : "single";
  const withMind = items.some((i) => i.type === "mind");
  const lines: OrderLine[] = items.map((i) => ({
    title: `${i.qty > 1 ? `${i.qty}x ` : ""}${itemName(i)}${i.type === "mind" ? " (oferta)" : ""}`,
    detail: describeItem(i).join(" + "),
    price: unitPrice(i) * i.qty,
    thumbs: itemThumbs(i),
  }));
  // Um item por par, como vai na caixa (para a transportadora/rastreio).
  const shipItems = items.flatMap((i) =>
    i.type === "mind"
      ? i.pairs.map((p) => ({
          name: `${mindSlide.name} — ${mindColorById(p.colorId).name} BR ${p.size}`,
          quantity: 1,
          price: unitPrice(i) / i.pairs.length,
        }))
      : itemPairs(i).map((p) => ({
          name: `${product.name} — ${colorById(p.colorId).name} BR ${p.size}`,
          quantity: i.qty,
          price: i.type === "kit" ? kit.price / kit.pairs : unitPrice(i),
        })),
  );
  return {
    bundleId: `${mainId}${withMind ? "+mind" : ""}`,
    bundleName: items
      .map((i) => `${i.qty}x ${itemName(i)} (${describeItem(i).join(" + ")})`)
      .join(" + "),
    lines,
    shipItems,
    pairs: shipItems.reduce((n, s) => n + s.quantity, 0),
    products: cartTotal(items),
  };
}
