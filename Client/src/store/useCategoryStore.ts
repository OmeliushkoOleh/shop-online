import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CategoryState {
  category: string;
  changeCategory: (category: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      category: "allProducts",
      changeCategory: (category) => {
        set({ category: category });
      },
    }),
    {
      name: "currentCategory",
    },
  ),
);
