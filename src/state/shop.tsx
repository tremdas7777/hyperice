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
import { isCartItem, type CartItem, type Pair } from "@/lib/cart";

export type { CartItem } from "@/lib/cart";

export type Offer = "single" | "kit";
/** Escolha de cada par do kit (o tamanho fica vazio até o cliente escolher). */
export type KitPairChoice = { colorId: string; size: string | null };

type ShopState = {
  offer: Offer;
  setOffer: (offer: Offer) => void;
  colorId: string;
  setColorId: (id: string) => void;
  size: string | null;
  setSize: (size: string | null) => void;
  kitPairs: KitPairChoice[];
  setKitPair: (index: number, pair: Partial<KitPairChoice>) => void;
  /** Pedido em andamento: o item escolhido na loja + a oferta do Nike Mind (sem sacola). */
  cart: CartItem[];
  /** O pedido salvo já foi lido do navegador (ele só existe no cliente). */
  cartLoaded: boolean;
  /** Começa a compra com o item escolhido (substitui o pedido anterior). */
  startPurchase: (item: CartItem) => void;
  /** Acrescenta um item ao pedido em andamento (ex.: 2ª unidade no checkout). */
  addItem: (item: CartItem) => void;
  /** Coloca (ou troca) a oferta do Nike Mind no pedido. */
  setMindItem: (item: CartItem) => void;
  clearCart: () => void;
  /** Popup da oferta (Nike Mind) aberto antes de ir para o checkout. */
  mindOfferOpen: boolean;
  setMindOfferOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
};

const ShopContext = createContext<ShopState | null>(null);
const CART_KEY = "hyperslide-cart-v2";
const emptyKitPairs = (): KitPairChoice[] =>
  Array.from({ length: kit.pairs }, () => ({ colorId: defaultColor.id, size: null }));

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
  const [kitPairs, setKitPairs] = useState<KitPairChoice[]>(emptyKitPairs);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [mindOfferOpen, setMindOfferOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // A página é renderizada no servidor: o pedido salvo só é lido depois de montar.
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

  const setKitPair = useCallback((index: number, pair: Partial<KitPairChoice>) => {
    setKitPairs((prev) => prev.map((p, i) => (i === index ? { ...p, ...pair } : p)));
  }, []);

  const startPurchase = useCallback((item: CartItem) => setCart([item]), []);

  const addItem = useCallback((item: CartItem) => setCart((prev) => [...prev, item]), []);

  const setMindItem = useCallback((item: CartItem) => {
    // Uma oferta por pedido: troca a escolha anterior, se houver.
    setCart((prev) => [...prev.filter((i) => i.type !== "mind"), item]);
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo<ShopState>(
    () => ({
      offer,
      setOffer,
      colorId,
      setColorId,
      size,
      setSize,
      kitPairs,
      setKitPair,
      cart,
      cartLoaded,
      startPurchase,
      addItem,
      setMindItem,
      clearCart,
      mindOfferOpen,
      setMindOfferOpen,
      toast,
      showToast: setToast,
    }),
    [
      offer,
      colorId,
      size,
      kitPairs,
      setKitPair,
      cart,
      cartLoaded,
      startPurchase,
      setMindItem,
      clearCart,
      mindOfferOpen,
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

/** Item da seleção atual pronto para a compra, ou null se faltar tamanho. */
export function useCurrentSelection(qty = 1): CartItem | null {
  const { offer, colorId, size, kitPairs } = useShop();
  if (offer === "kit") {
    const pairs: Pair[] = [];
    for (const p of kitPairs) {
      if (!p.size) return null;
      pairs.push({ colorId: p.colorId, size: p.size });
    }
    return { type: "kit", pairs, qty };
  }
  return size ? { type: "single", colorId, size, qty } : null;
}
