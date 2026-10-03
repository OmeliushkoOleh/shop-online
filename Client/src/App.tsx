import "./App.css";
import { Routes, Route } from "react-router-dom";
import { TopBar, Footer } from "./components";
import { useEffect } from "react";
import {
  HomePage,
  ProductsPage,
  ProductPage,
  FavoritePage,
  CartPage,
  LoginPage,
  ProfilePage,
  OrdersPage,
  NotFoundPage,
} from "./pages";
import "./i18n";
import { useAuthStore } from "./store/authStore";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, []);

  return (
    <div className="App">
      <TopBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:page" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/favorite" element={<FavoritePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
