import { describe, expect, it } from "vitest";
import { kit, product } from "@/data/store";
import { cartTotal, type CartItem } from "@/lib/cart";
import { FREE_SHIPPING_MIN, isFreeShippingEligible } from "@/lib/shipping";

// Regra do checkout: o frete grátis só vale a partir do preço dos 2 pares (R$ 267).
describe("frete grátis", () => {
  it("exige o preço de 2 pares", () => {
    expect(FREE_SHIPPING_MIN).toBe(267);
    expect(kit.price).toBe(267);
    expect(isFreeShippingEligible(197)).toBe(false);
    expect(isFreeShippingEligible(266)).toBe(false);
    expect(isFreeShippingEligible(267)).toBe(true);
  });

  it("a 2ª unidade custa só o que falta para os 2 pares", () => {
    const missing = FREE_SHIPPING_MIN - product.price;
    expect(missing).toBe(70);
    const kitItem: CartItem = {
      type: "kit",
      pairs: [
        { colorId: "preto", size: "39/40" },
        { colorId: "orewood", size: "39/40" },
      ],
      qty: 1,
    };
    // 1º par (197) + o que falta (70) = total do pedido 267, com frete grátis.
    expect(product.price + missing).toBe(cartTotal([kitItem]));
    expect(isFreeShippingEligible(cartTotal([kitItem]))).toBe(true);
  });
});
