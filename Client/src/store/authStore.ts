import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  signUp: async (
    email: string,
    password: string,
    phone: number,
    name: string,
  ) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          phone: phone,
        },
      },
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    set({ user: data.user, loading: false });
    localStorage.setItem("userId", data?.user!.id);
    return data;
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    // Сразу после успешного входа берём роль юзера из таблицы profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    // Сохраняем в Zustand и пользователя, и его кастомную роль
    set({
      user: data.user,
      role: profile?.role ?? "user",
      loading: false,
    });
    // ----------------------------
    localStorage.setItem("userId", data?.user!.id);
    return data; // Возвращаем данные для компонента формы
  },

  // Метод для выхода
  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ user: null, loading: false });
    localStorage.setItem("userId", "null");
    localStorage.setItem("shopping-cart-storage", "null");
    localStorage.setItem("currentFavorite", "null");
  },

  // Инициализация слушателя сессии (вызывается один раз при старте приложения)
  initializeAuth: async () => {
    set({ loading: true });

    // 1. Проверяем, есть ли уже сохраненная сессия в браузере
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;

    if (currentUser) {
      // ЕСЛИ ПОЛЬЗОВАТЕЛЬ ЕСТЬ -> запрашиваем его роль из таблицы profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      set({
        user: currentUser,
        role: profile?.role ?? "user", // сохраняем роль в Zustand
        loading: false,
      });
    } else {
      // Если сессии нет, сбрасываем всё в дефолт
      set({ user: null, role: "user", loading: false });
    }

    // 2. Подписываемся на любые изменения (вход, выход, авто-обновление токена)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const userChange = session?.user ?? null;

      if (userChange) {
        // Каждый раз, когда состояние меняется (например, авто-обновление токена через полгода)
        // мы снова подтягиваем актуальную роль из базы данных
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userChange.id)
          .single();

        set({
          user: userChange,
          role: profile?.role ?? "user",
          loading: false,
        });
      } else {
        set({ user: null, role: "user", loading: false });
      }
    });
  },
}));
