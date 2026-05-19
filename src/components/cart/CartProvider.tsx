import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "../../lib/types";

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  totalCents: number;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "aig_cart_v1";
const MAX_CART_ITEM_QUANTITY = 10;
const CartContext = createContext<CartContextValue | null>(null);

/*
  Frontend cart state.
  Uses localStorage for MVP persistence until backend order sessions are added.
*/
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCents = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

    return {
      items,
      totalQuantity,
      totalCents,
      addItem(product) {
        let addedQuantity = 1;

        setItems((current) => {
          const existing = current.find((item) => item.product.id === product.id);

          if (existing) {
            const nextQuantity = Math.min(existing.quantity + 1, MAX_CART_ITEM_QUANTITY);
            addedQuantity = nextQuantity;

            return current.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: nextQuantity }
                : item
            );
          }

          return [...current, { product, quantity: 1 }];
        });

        window.dispatchEvent(new CustomEvent("aig-cart-pulse", {
          detail: {
            productId: product.id,
            productName: product.name,
            quantity: addedQuantity,
            maxQuantity: MAX_CART_ITEM_QUANTITY
          }
        }));
      },
      removeItem(productId) {
        setItems((current) => current.filter((item) => item.product.id !== productId));
      },
      updateQuantity(productId, quantity) {
        const safeQuantity = Math.max(1, Math.min(MAX_CART_ITEM_QUANTITY, Number(quantity) || 1));
        setItems((current) =>
          current.map((item) =>
            item.product.id === productId ? { ...item, quantity: safeQuantity } : item
          )
        );
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
