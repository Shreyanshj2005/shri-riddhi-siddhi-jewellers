import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  metal?: string | null;
  purity?: string | null;

  // Ring size selected by customer
  selectedRingSize?: string | null;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;

  addToCart: (product: CartProduct) => void;

  removeFromCart: (
    productId: string,
    selectedRingSize?: string | null
  ) => void;

  increaseQuantity: (
    productId: string,
    selectedRingSize?: string | null
  ) => void;

  decreaseQuantity: (
    productId: string,
    selectedRingSize?: string | null
  ) => void;

  clearCart: () => void;

  isInCart: (
    productId: string,
    selectedRingSize?: string | null
  ) => boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "srsj-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [items, loaded]);

  /**
   * Check whether two cart items represent the same variant.
   *
   * For normal products:
   * product ID is enough.
   *
   * For rings:
   * product ID + selected ring size must match.
   */
  const isSameCartVariant = (
    item: CartItem,
    product: CartProduct
  ) => {
    return (
      item.product.id === product.id &&
      (item.product.selectedRingSize ?? null) ===
        (product.selectedRingSize ?? null)
    );
  };

  // Add product to cart
  const addToCart = (product: CartProduct) => {
    setItems((current) => {
      const existing = current.find((item) =>
        isSameCartVariant(item, product)
      );

      // Same product + same ring size
      // => increase quantity
      if (existing) {
        return current.map((item) =>
          isSameCartVariant(item, product)
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      // Same product + different ring size
      // => create separate cart item
      return [
        ...current,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  // Remove product variant from cart
  const removeFromCart = (
    productId: string,
    selectedRingSize?: string | null
  ) => {
    setItems((current) =>
      current.filter(
        (item) =>
          !(
            item.product.id === productId &&
            (item.product.selectedRingSize ?? null) ===
              (selectedRingSize ?? null)
          )
      )
    );
  };

  // Increase quantity of a specific product variant
  const increaseQuantity = (
    productId: string,
    selectedRingSize?: string | null
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId &&
        (item.product.selectedRingSize ?? null) ===
          (selectedRingSize ?? null)
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // Decrease quantity of a specific product variant
  const decreaseQuantity = (
    productId: string,
    selectedRingSize?: string | null
  ) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.id === productId &&
          (item.product.selectedRingSize ?? null) ===
            (selectedRingSize ?? null)
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
  };

  // Check whether a specific product variant is already in cart
  const isInCart = (
    productId: string,
    selectedRingSize?: string | null
  ) => {
    return items.some(
      (item) =>
        item.product.id === productId &&
        (item.product.selectedRingSize ?? null) ===
          (selectedRingSize ?? null)
    );
  };

  // Total quantity of products
  const cartCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [items]
  );

  // Total cart price
  const cartTotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Number(item.product.price) * item.quantity,
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      isInCart,
    }),
    [items, cartCount, cartTotal]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}