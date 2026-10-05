import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { supabase } from "./supabaseClient";
import { IProduct } from "./types";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/get_categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("category", { head: false, count: "exact" });
    if (error) throw error;
    const uniqueCategories = [...new Set(data.map((item) => item.category))];
    res.json(uniqueCategories);
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    res.status(500).json({ error: "Не удалось получить категории" });
  }
});

app.get("/get_initial_products", async (req, res) => {
  try {
    const { data, error } = (await supabase
      .from("products")
      .select("*")
      .gt("discount", 0)) as { data: IProduct[] | null; error: any };
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    res.status(500).json({ error: "Не удалось получить категории" });
  }
});

app.get("/get_all_products", async (req, res) => {
  try {
    const { data, error } = (await supabase.from("products").select("*")) as {
      data: IProduct[] | null;
      error: any;
    };
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/get_product_info", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", req.query.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/delete_all_this_product_from_cart", async (req, res) => {
  try {
    const { cartProductId, userId } = req.body;

    {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartProductId);

      const { data: data, error: cartError } = await supabase
        .from("cart_items")
        .select(
          `
    id,
    quantity,
    product_id,
    products (
      title,
      price,
      discount,
      imageUrl,
      countInStock
    )
  `,
        )
        .eq("user_id", userId);
      const reformedData = data?.map(({ products, ...item }) => ({
        ...item,
        ...products,
      }));
      if (error) throw error;
      const fullCart = reformedData?.sort((q, w) => q.id - w.id);

      return res
        .status(201)
        .json({ message: "Товар удалён из корзины", data: fullCart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера при добавлении в корзину" });
  }
});

app.post("/add_to_cart", async (req, res) => {
  console.log(req.body);
  let newQuantity;

  try {
    const { productId, userId, quantity, newItem } = req.body;

    const { data: existingItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }
    if (existingItem) {
      if (newItem === "new") {
        newQuantity = existingItem.quantity;
      } else {
        newQuantity = existingItem.quantity + quantity;
      }
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id);

      const { data: data, error: cartError } = await supabase
        .from("cart_items")
        .select(
          `
    id,
    quantity,
    product_id,
    products (
      title,
      price,
      discount,
      imageUrl,
      countInStock
    )
  `,
        )
        .eq("user_id", userId);

      const reformedData = data?.map(({ products, ...item }) => ({
        ...item,
        ...products,
      }));
      if (error) throw error;
      const fullCart = reformedData?.sort((q, w) => q.id - w.id);

      return res
        .status(200)
        .json({ message: "Количество товара обновлено", data: fullCart });
    } else {
      // 3. Если товара еще нет в корзине, создаем новую запись (количество по дефолту 1)
      const { error } = await supabase
        .from("cart_items")
        .insert([{ user_id: userId, product_id: productId }]);

      const { data: data, error: cartError } = await supabase
        .from("cart_items")
        .select(
          `
    id,
    quantity,
    product_id,
    products (
      title,
      price,
      discount,
      imageUrl,
      countInStock

    )
  `,
        )
        .eq("user_id", userId);
      const reformedData = data?.map(({ products, ...item }) => ({
        ...item,
        ...products,
      }));

      if (error) throw error;
      const fullCart = reformedData?.sort((q, w) => q.id - w.id);

      return res
        .status(201)
        .json({ message: "Товар добавлен в корзину", data: fullCart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера при добавлении в корзину" });
  }
});

app.post("/add_to_favorite", async (req, res) => {
  try {
    const { productId, userId } = req.body;
    console.log(productId);
    console.log("user " + userId);
    const { data: existingItem, error: fetchError } = await supabase
      .from("favorites_items")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }
    if (existingItem) {
      const { data: data, error: cartError } = await supabase
        .from("favorites_items")
        .select(
          `
    id,
    product_id,
    products (
      title,
      price,
      discount,
      imageUrl,
      countInStock
    )
  `,
        )
        .eq("user_id", userId);
      const reformedData = data?.map(({ products, ...item }) => ({
        ...item,
        ...products,
      }));

      const fullFavorite = reformedData?.sort((q, w) => q.id - w.id);
      return res
        .status(200)
        .json({ message: "Количество товара обновлено", data: fullFavorite });
    } else {
      const { error } = await supabase
        .from("favorites_items")
        .insert([{ user_id: userId, product_id: productId }]);

      const { data: data, error: cartError } = await supabase
        .from("favorites_items")
        .select(
          `
    id,
    product_id,
    products (
      title,
      price,
      discount,
      imageUrl,
      countInStock
    )
  `,
        )
        .eq("user_id", userId);
      const reformedData = data?.map(({ products, ...item }) => ({
        ...item,
        ...products,
      }));

      if (error) throw error;
      const fullFavorite = reformedData?.sort((q, w) => q.id - w.id);

      return res
        .status(201)
        .json({ message: "Товар добавлен в корзину", data: fullFavorite });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ошибка сервера при добавлении в изобраное" });
  }
});

app.post("/delete_from_favorite", async (req, res) => {
  console.log(req.body);

  try {
    const { favoriteProductId, userId } = req.body;

    {
      const { error } = await supabase
        .from("favorites_items")
        .delete()
        .eq("id", favoriteProductId);

      const { data: data, error: cartError } = await supabase
        .from("favorites_items")
        .select(
          `
    id,
    product_id,
    products (
      title,
      price,
      discount,
      imageUrl,
      countInStock
    )
  `,
        )
        .eq("user_id", userId);
      const reformedData = data?.map(({ products, ...item }) => ({
        ...item,
        ...products,
      }));
      if (error) throw error;
      const fullCart = reformedData?.sort((q, w) => q.id - w.id);

      return res
        .status(201)
        .json({ message: "Товар удалён из корзины", data: fullCart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера при удалении из корзины" });
  }
});

app.listen(PORT, () => {
  console.log(
    `Сервер успешно запущен на http://localhost:${PORT}.....................................`,
  );
});
