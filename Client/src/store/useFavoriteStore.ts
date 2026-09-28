import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IFavoriteItem } from "../types";

interface IFavoriteState {
  favorite: IFavoriteItem[];
  isFetched: boolean;
  changeFavorite: (favoriteArr: IFavoriteItem[]) => void;
  addToFavorite: (productId: IFavoriteItem["product_id"]) => Promise<void>;
  deleteFromFavorite: (favoriteId: IFavoriteItem["id"]) => Promise<void>;
}

export const useFavoriteStore = create<IFavoriteState>()(
  persist(
    (set, get) => ({
      favorite: [],
      isFetched: false,

      changeFavorite: (favoriteArr) => {
        set({ favorite: favoriteArr });
      },

      addToFavorite: async (productId) => {
        const { isFetched } = get();
        if (isFetched) return;

        set({ isFetched: true });

        try {
          const response = await fetch(
            `http://localhost:5000/add_to_favorite`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: productId,
                userId: localStorage.getItem("userId"),
              }),
            },
          );

          if (!response.ok)
            throw new Error("Ошибка при добавлении в избранное");

          const result = await response.json();
          set({ favorite: result.data });
        } catch (error) {
          console.error("Ошибка addToFavorite:", error);
        } finally {
          set({ isFetched: false });
        }
      },

      deleteFromFavorite: async (favoriteId) => {
        const { isFetched } = get();
        if (isFetched) return;

        set({ isFetched: true });

        try {
          const response = await fetch(
            `http://localhost:5000/delete_from_favorite`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                favoriteProductId: favoriteId,
                userId: localStorage.getItem("userId"),
              }),
            },
          );

          if (!response.ok)
            throw new Error("Ошибка при удалении из избранного");

          const result = await response.json();
          set({ favorite: result.data });
        } catch (error) {
          console.error("Ошибка deleteFromFavorite:", error);
        } finally {
          set({ isFetched: false });
        }
      },
    }),
    {
      name: "currentFavorite",
      partialize: (state) => ({ favorite: state.favorite }),
    },
  ),
);
