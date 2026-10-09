import { describe, expect, it } from "vitest";
import { kit, product } from "@/data/store";
import { cartTotal, type CartItem } from "@/lib/cart";
import { FREE_SHIPPING_MIN, isFreeShippingEligible } from "@/lib/shipping";

// Regra: 1 par R$ 127, 2 pares R$ 197; frete grátis a partir de R$ 180.
describe("frete grátis", () => {
  it("libera o frete grátis a partir de R$ 180 em produtos", () => {
    expect(product.price).toBe(127);
    expect(kit.price).toBe(197);
    expect(FREE_SHIPPING_MIN).toBe(180);
    expect(isFreeShippingEligible(127)).toBe(false);
    expect(isFreeShippingEligible(179)).toBe(false);
    expect(isFreeShippingEligible(180)).toBe(true);
    expect(isFreeShippingEligible(kit.price)).toBe(true);
  });

  it("a 2ª unidade custa a diferença até o preço do kit de 2 pares", () => {
    // Faltam R$ 53 para o frete grátis, mas o 2º par sai por R$ 70 (kit = R$ 197).
    expect(FREE_SHIPPING_MIN - product.price).toBe(53);
    expect(kit.price - product.price).toBe(70);
    const kitItem: CartItem = {
      type: "kit",
      pairs: [
        { colorId: "preto", size: "39/40" },
        { colorId: "orewood", size: "39/40" },
      ],
      qty: 1,
    };
    expect(product.price + (kit.price - product.price)).toBe(cartTotal([kitItem]));
    expect(isFreeShippingEligible(cartTotal([kitItem]))).toBe(true);
  });
});
