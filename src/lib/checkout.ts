import { checkout, checkoutUrls, colors, product, store } from "@/data/store";
import type { CartItem } from "@/state/shop";
import { formatBRL, pixPrice } from "./format";

export type CheckoutResult = { ok: true } | { ok: false; message: string };

export function goToCheckout(items: CartItem[]): CheckoutResult {
  const [first] = items;
  if (!first) return { ok: false, message: "Sua sacola está vazia." };

  if (checkout.mode === "link") {
    // Checkouts externos costumam aceitar um item por link; usamos o primeiro.
    const url = checkoutUrls[first.colorId]?.[first.size];
    if (!url) {
      return {
        ok: false,
        message: "Checkout ainda não configurado para esta variante (src/data/store.ts).",
      };
    }
    window.location.href = url;
    return { ok: true };
  }

  if (!store.whatsapp) {
    return {
      ok: false,
      message: "Configure o WhatsApp da loja em src/data/store.ts para receber pedidos.",
    };
  }

  const total = items.reduce((sum, i) => sum + i.qty * product.price, 0);
  const lines = items.map((i) => {
    const color = colors.find((c) => c.id === i.colorId);
    return `• ${i.qty}x ${product.name} — ${color?.name ?? i.colorId} — BR ${i.size}`;
  });
  const message = [
    `Olá! Quero finalizar meu pedido na ${store.name}:`,
    "",
    ...lines,
    "",
    `Total: ${formatBRL(total)} (ou ${formatBRL(pixPrice(total))} no Pix)`,
  ].join("\n");

  window.open(
    `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener",
  );
  return { ok: true };
}
