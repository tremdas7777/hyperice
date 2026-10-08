import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { colors, defaultColor, kit } from "@/data/store";
import { isCartItem, itemKey, type CartItem } from "@/lib/cart";

export type { CartItem } from "@/lib/cart";

export type Offer = "single" | "kit";
type KitSizes = Record<string, string | null>;

type ShopState = {
  offer: Offer;
  setOffer: (offer: Offer) => void;
  colorId: string;
  setColorId: (id: string) => void;
  size: string | null;
  setSize: (size: string | null) => void;
  kitSizes: KitSizes;
  setKitSize: (colorId: string, size: string | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
};

const ShopContext = createContext<ShopState | null>(null);
const CART_KEY = "hyperslide-cart-v2";
const emptyKitSizes = (): KitSizes => Object.fromEntries(kit.colorIds.map((id) => [id, null]));

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [offer, setOffer] = useState<Offer>("single");
  const [colorId, setColorId] = useState(defaultColor.id);
  const [size, setSize] = useState<string | null>(null);
  const [kitSizes, setKitSizes] = useState<KitSizes>(emptyKitSizes);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // A página é renderizada no servidor: a sacola salva só é lida depois de montar.
  useEffect(() => {
    setCart(loadCart());
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* armazenamento indisponível */
    }
  }, [cart, cartLoaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const setKitSize = useCallback((cId: string, s: string | null) => {
    setKitSizes((prev) => ({ ...prev, [cId]: s }));
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const key = itemKey(item);
      const found = prev.find((i) => itemKey(i) === key);
      if (found) {
        return prev.map((i) => (i === found ? { ...i, qty: Math.min(10, i.qty + item.qty) } : i));
      }
      return [...prev, item];
    });
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) => (itemKey(i) === key ? { ...i, qty: Math.max(0, Math.min(10, qty)) } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => itemKey(i) !== key));
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      offer,
      setOffer,
      colorId,
      setColorId,
      size,
      setSize,
      kitSizes,
      setKitSize,
      cart,
      addToCart,
      updateQty,
      removeFromCart,
      cartCount: cart.reduce((n, i) => n + i.qty, 0),
      cartOpen,
      setCartOpen,
      toast,
      showToast: setToast,
    }),
    [
      offer,
      colorId,
      size,
      kitSizes,
      setKitSize,
      cart,
      addToCart,
      updateQty,
      removeFromCart,
      cartOpen,
      toast,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop precisa estar dentro de <ShopProvider>");
  return ctx;
}

export function useSelectedColor() {
  const { colorId } = useShop();
  return colors.find((c) => c.id === colorId) ?? defaultColor;
}

/** Item pronto para ir à sacola com a seleção atual, ou null se faltar tamanho. */
export function useCurrentSelection(qty = 1): CartItem | null {
  const { offer, colorId, size, kitSizes } = useShop();
  if (offer === "kit") {
    const sizes: Record<string, string> = {};
    for (const id of kit.colorIds) {
      const s = kitSizes[id];
      if (!s) return null;
      sizes[id] = s;
    }
    return { type: "kit", sizes, qty };
  }
  return size ? { type: "single", colorId, size, qty } : null;
}
