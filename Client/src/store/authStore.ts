import { create } from "zustand";
import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type UserData = User;

type AuthState = {
  user: UserData | null;
  role: string;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    phone: string,
    name: string,
  ) => Promise<{
    user: User | null;
    session: Session | null;
    [key: string]: unknown;
  }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    user: User | null;
    session: Session | null;
    [key: string]: unknown;
  }>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  changeName: (newName: string) => Promise<UserData>;
  changePhone: (newPhone: string) => Promise<UserData>;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const syncProfile = async (
  userId: string,
  profileData: {
    name?: string;
    phone?: string;
    role?: string;
  },
) => {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    throw selectError;
  }

  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("profiles").insert([
    {
      id: userId,
      updated_at: new Date().toISOString(),
      ...profileData,
    },
  ]);

  if (error) {
    throw error;
  }
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  role: "user",
  loading: true,
  error: null,

  signUp: async (
    email: string,
    password: string,
    phone: string,
    name: string,
  ) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
      },
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    if (!data.user) {
      set({ error: "Пользователь не создан", loading: false });
      throw new Error("Пользователь не создан");
    }

    try {
      await syncProfile(data.user.id, {
        name,
        phone,
        role: "user",
      });
    } catch (profileError) {
      set({
        error:
          profileError instanceof Error
            ? profileError.message
            : "Не удалось обновить профиль",
        loading: false,
      });
      throw profileError;
    }

    set({ user: data.user, loading: false });
    localStorage.setItem("userId", data.user.id);
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

    if (!data.user) {
      set({ error: "Пользователь не найден", loading: false });
      throw new Error("Пользователь не найден");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    set({
      user: data.user,
      role: profile?.role ?? "user",
      loading: false,
    });

    localStorage.setItem("userId", data.user.id);
    return data;
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ user: null, role: "user", loading: false });
    localStorage.setItem("userId", "null");
    localStorage.setItem("shopping-cart-storage", "null");
    localStorage.setItem("currentFavorite", "null");
  },

  initializeAuth: async () => {
    set({ loading: true });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;

    if (currentUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      set({
        user: currentUser,
        role: profile?.role ?? "user",
        loading: false,
      });
    } else {
      set({ user: null, role: "user", loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const userChange = session?.user ?? null;

      if (userChange) {
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

  changeName: async (newName: string) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("Пользователь не авторизован");
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.updateUser({
      data: { name: newName },
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    if (!data.user) {
      set({ error: "Профиль пользователя не найден", loading: false });
      throw new Error("Профиль пользователя не найден");
    }

    try {
      await syncProfile(data.user.id, {
        name: newName,
        phone:
          (data.user.user_metadata.phone as string | undefined) ??
          currentUser.user_metadata?.phone,
        role: get().role ?? "user",
      });
    } catch (profileError) {
      set({
        error:
          profileError instanceof Error
            ? profileError.message
            : "Не удалось обновить профиль",
        loading: false,
      });
      throw profileError;
    }

    set({ user: data.user, loading: false });
    return data.user;
  },

  changePhone: async (newPhone: string) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("Пользователь не авторизован");
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.updateUser({
      data: { phone: newPhone },
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    if (!data.user) {
      set({ error: "Профиль пользователя не найден", loading: false });
      throw new Error("Профиль пользователя не найден");
    }

    try {
      await syncProfile(data.user.id, {
        name:
          (data.user.user_metadata.name as string | undefined) ??
          currentUser.user_metadata?.name,
        phone: newPhone,
        role: get().role ?? "user",
      });
    } catch (profileError) {
      set({
        error:
          profileError instanceof Error
            ? profileError.message
            : "Не удалось обновить профиль",
        loading: false,
      });
      throw profileError;
    }

    set({ user: data.user, loading: false });
    return data.user;
  },
}));
