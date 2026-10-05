import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";
import { supabase } from "./supabaseClient";
import { IProduct } from "./types";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Файл должен быть изображением"));
      return;
    }
    callback(null, true);
  },
});
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

app.post(
  "/add_product",
  uploadProductImage.single("image"),
  async (req, res) => {
    const authorization = req.header("Authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!accessToken) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Недействительная сессия" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return res.status(403).json({ error: "Недостаточно прав" });
    }

    const { title, description, price, discount, category, countInStock } =
      req.body;
    const image = req.file;

    if (!title?.trim() || !category?.trim() || !image) {
      return res
        .status(400)
        .json({ error: "Заполните обязательные поля и выберите изображение" });
    }

    const extension = path.extname(image.originalname).toLowerCase();
    const imagePath = `products/${randomUUID()}${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("products_img")
        .upload(imagePath, image.buffer, {
          contentType: image.mimetype,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("products_img").getPublicUrl(imagePath);

      const { data, error: insertError } = await supabase
        .from("products")
        .insert({
          title: title.trim(),
          description: description?.trim() ?? "",
          price: Number(price),
          discount: Number(discount),
          category: category.trim(),
          countInStock: Number(countInStock),
          imageUrl: publicUrl,
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from("products_img").remove([imagePath]);
        throw insertError;
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error("Ошибка при создании товара:", error);
      return res.status(500).json({ error: "Не удалось добавить товар" });
    }
  },
);

app.put(
  "/update_product",
  uploadProductImage.single("image"),
  async (req, res) => {
    const authorization = req.header("Authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!accessToken) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Недействительная сессия" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return res.status(403).json({ error: "Недостаточно прав" });
    }

    const productId = Number(req.body.productId);
    const { title, description, price, discount, category, countInStock } =
      req.body;

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !title?.trim() ||
      !category?.trim()
    ) {
      return res.status(400).json({ error: "Проверьте данные товара" });
    }

    let newImagePath: string | null = null;

    try {
      const { data: currentProduct, error: currentProductError } =
        await supabase
          .from("products")
          .select("id, imageUrl")
          .eq("id", productId)
          .maybeSingle();

      if (currentProductError) throw currentProductError;
      if (!currentProduct) {
        return res.status(404).json({ error: "Товар не найден" });
      }

      let imageUrl = currentProduct.imageUrl;
      if (req.file) {
        const extension = path.extname(req.file.originalname).toLowerCase();
        newImagePath = `products/${randomUUID()}${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("products_img")
          .upload(newImagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) throw uploadError;

        imageUrl = supabase.storage
          .from("products_img")
          .getPublicUrl(newImagePath).data.publicUrl;
      }

      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({
          title: title.trim(),
          description: description?.trim() ?? "",
          price: Number(price),
          discount: Number(discount),
          category: category.trim(),
          countInStock: Number(countInStock),
          imageUrl,
        })
        .eq("id", productId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (newImagePath) {
        const storageMarker = "/storage/v1/object/public/products_img/";
        const markerIndex = currentProduct.imageUrl.indexOf(storageMarker);
        if (markerIndex >= 0) {
          const oldImagePath = decodeURIComponent(
            currentProduct.imageUrl.slice(markerIndex + storageMarker.length),
          );
          const { error: removeError } = await supabase.storage
            .from("products_img")
            .remove([oldImagePath]);
          if (removeError) {
            console.error(
              "Не удалось удалить старое изображение:",
              removeError,
            );
          }
        }
      }

      return res.json(updatedProduct);
    } catch (error) {
      if (newImagePath) {
        await supabase.storage.from("products_img").remove([newImagePath]);
      }
      console.error("Ошибка изменения товара:", error);
      return res.status(500).json({ error: "Не удалось сохранить товар" });
    }
  },
);

app.post("/delete_product", async (req, res) => {
  const authorization = req.header("Authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const { data: authData, error: authError } =
    await supabase.auth.getUser(accessToken);

  if (authError || !authData.user) {
    return res.status(401).json({ error: "Недействительная сессия" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return res.status(403).json({ error: "Недостаточно прав" });
  }

  const productId = Number(req.body.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: "Некорректный ID товара" });
  }

  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, imageUrl")
      .eq("id", productId)
      .maybeSingle();

    if (productError) throw productError;
    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    const { error: cartError } = await supabase
      .from("cart_items")
      .delete()
      .eq("product_id", productId);
    if (cartError) throw cartError;

    const { error: favoritesError } = await supabase
      .from("favorites_items")
      .delete()
      .eq("product_id", productId);
    if (favoritesError) throw favoritesError;

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (deleteError) throw deleteError;

    const storageMarker = "/storage/v1/object/public/products_img/";
    const markerIndex = product.imageUrl.indexOf(storageMarker);
    if (markerIndex >= 0) {
      const imagePath = decodeURIComponent(
        product.imageUrl.slice(markerIndex + storageMarker.length),
      );
      const { error: storageError } = await supabase.storage
        .from("products_img")
        .remove([imagePath]);
      if (storageError) {
        console.error("Не удалось удалить изображение товара:", storageError);
      }
    }

    return res.json({ message: "Товар удалён" });
  } catch (error) {
    console.error("Ошибка удаления товара:", error);
    return res.status(500).json({ error: "Не удалось удалить товар" });
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
