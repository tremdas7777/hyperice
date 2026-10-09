import { describe, expect, it } from "vitest";
import { kit, product } from "@/data/store";
import { cartTotal, type CartItem } from "@/lib/cart";
import { FREE_SHIPPING_MIN, isFreeShippingEligible } from "@/lib/shipping";

// Regra: 1 par R$ 127, 2 pares R$ 197; frete grátis a partir do preço dos 2 pares.
describe("frete grátis", () => {
  it("exige o preço de 2 pares", () => {
    expect(product.price).toBe(127);
    expect(kit.price).toBe(197);
    expect(FREE_SHIPPING_MIN).toBe(197);
    expect(isFreeShippingEligible(127)).toBe(false);
    expect(isFreeShippingEligible(196)).toBe(false);
    expect(isFreeShippingEligible(197)).toBe(true);
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
    expect(product.price + missing).toBe(cartTotal([kitItem]));
    expect(isFreeShippingEligible(cartTotal([kitItem]))).toBe(true);
  });
});
