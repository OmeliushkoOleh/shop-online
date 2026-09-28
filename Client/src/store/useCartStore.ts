import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ICartItem } from "../types";

interface ICartState {
  cartItems: ICartItem[];
  isFetched: boolean;
  addNewProductToCart: (id: ICartItem["product_id"]) => Promise<void>;
  changeCart: (newData: ICartItem[] | undefined) => void;

  handleQuantityChange: (
    action: number,
    id: ICartItem["product_id"],
    currentQuantity: number,
    countInStock: number,
  ) => Promise<void>;
  deleteAllThisProductFromCart: (id: ICartItem["id"]) => Promise<void>;
}

export const useCartStore = create<ICartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      isFetched: false,

      changeCart: (newData) => set({ cartItems: newData }),

      addNewProductToCart: async (id) => {
        const { isFetched } = get();
        if (isFetched) return;

        set({ isFetched: true });
        try {
          const response = await fetch(`http://localhost:5000/add_to_cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: id,
              userId: JSON.stringify(localStorage.getItem("userId")),
              quantity: 1,
              newItem: "new",
            }),
          });

          if (!response.ok) throw new Error("Ошибка при добавлении в корзину");

          const result = await response.json();
          get().changeCart(result.data);
        } catch (error) {
          console.error(error);
        } finally {
          set({ isFetched: false });
        }
      },

      handleQuantityChange: async (
        action,
        id,
        currentQuantity,
        countInStock,
      ) => {
        const { isFetched } = get();

        if (
          action + currentQuantity < 1 ||
          action + currentQuantity > countInStock ||
          isFetched
        ) {
          return;
        }

        set({ isFetched: true });

        try {
          const response = await fetch(`http://localhost:5000/add_to_cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: id,
              userId: JSON.stringify(localStorage.getItem("userId")),
              quantity: action,
            }),
          });

          if (!response.ok) throw new Error("Ошибка при добавлении в корзину");

          const result = await response.json();
          get().changeCart(result.data);
        } catch (error) {
          console.error(error);
        } finally {
          set({ isFetched: false });
        }
      },

      deleteAllThisProductFromCart: async (id) => {
        const { isFetched } = get();
        if (isFetched) return;

        set({ isFetched: true });

        try {
          const response = await fetch(
            `http://localhost:5000/delete_all_this_product_from_cart`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cartProductId: id,
                userId: JSON.stringify(localStorage.getItem("userId")),
              }),
            },
          );

          if (!response.ok) throw new Error("Ошибка при удалении из корзины");

          const result = await response.json();
          get().changeCart(result.data);
        } catch (error) {
          console.error(error);
        } finally {
          set({ isFetched: false });
        }
      },
    }),
    {
      name: "shopping-cart-storage",
      partialize: (state) => ({ cartItems: state.cartItems }),
    },
  ),
);
