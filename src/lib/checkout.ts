import { checkout, checkoutUrls, kit, kitCheckoutUrl, product, store } from "@/data/store";
import { cartTotal, describeItem, itemTotal, type CartItem } from "./cart";
import { formatBRL, pixPrice } from "./format";

export type CheckoutResult = { ok: true } | { ok: false; message: string };

function linkFor(item: CartItem): string | null {
  if (item.type === "kit") {
    if (!kitCheckoutUrl) return null;
    const params = new URLSearchParams(kit.colorIds.map((id) => [id, item.sizes[id] ?? ""]));
    return `${kitCheckoutUrl}${kitCheckoutUrl.includes("?") ? "&" : "?"}${params}`;
  }
  return checkoutUrls[item.colorId]?.[item.size] ?? null;
}

export function goToCheckout(items: CartItem[]): CheckoutResult {
  const [first] = items;
  if (!first) return { ok: false, message: "Sua sacola está vazia." };

  if (checkout.mode === "link") {
    // Checkouts externos costumam aceitar um item por link; usamos o primeiro.
    const url = linkFor(first);
    if (!url) {
      return {
        ok: false,
        message: "Checkout ainda não configurado para esta oferta (src/data/store.ts).",
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

  const total = cartTotal(items);
  const lines = items.map((i) => {
    const name = i.type === "kit" ? kit.name : product.name;
    return `• ${i.qty}x ${name} (${describeItem(i).join(" + ")}) — ${formatBRL(itemTotal(i))}`;
  });
  const message = [
    `Olá! Quero finalizar meu pedido${store.showLogo ? ` na ${store.name}` : ""}:`,
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
