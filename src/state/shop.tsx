import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { colors, defaultColor } from "@/data/store";

export type CartItem = { colorId: string; size: string; qty: number };

type ShopState = {
  colorId: string;
  setColorId: (id: string) => void;
  size: string | null;
  setSize: (size: string | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (colorId: string, size: string, qty: number) => void;
  removeFromCart: (colorId: string, size: string) => void;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
};

const ShopContext = createContext<ShopState | null>(null);
const CART_KEY = "hyperslide-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return parsed.filter((i) => colors.some((c) => c.id === i.colorId));
  } catch {
    return [];
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [colorId, setColorId] = useState(defaultColor.id);
  const [size, setSize] = useState<string | null>(null);
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

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((i) => i.colorId === item.colorId && i.size === item.size);
      if (found) {
        return prev.map((i) => (i === found ? { ...i, qty: Math.min(10, i.qty + item.qty) } : i));
      }
      return [...prev, item];
    });
  }, []);

  const updateQty = useCallback((cId: string, s: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.colorId === cId && i.size === s ? { ...i, qty: Math.max(0, Math.min(10, qty)) } : i,
        )
        .filter((i) => i.qty > 0),
    );
  }, []);

  const removeFromCart = useCallback((cId: string, s: string) => {
    setCart((prev) => prev.filter((i) => !(i.colorId === cId && i.size === s)));
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      colorId,
      setColorId,
      size,
      setSize,
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
    [colorId, size, cart, addToCart, updateQty, removeFromCart, cartOpen, toast],
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
