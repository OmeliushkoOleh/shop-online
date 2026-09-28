import { create } from "zustand";

interface ThemeState {
  theme: string;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem("theme") || "light",
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light";

      localStorage.setItem("theme", nextTheme);
      document.body.classList.remove("light", "dark");
      document.body.classList.add(nextTheme);
      return { theme: nextTheme };
    });
  },
}));
