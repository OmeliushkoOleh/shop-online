import { useEffect, useRef, useState } from "react";
import { supabase } from "../../store/authStore";
import type { IProduct } from "../../types";
import "./AdminPage.css";

type ProductForm = {
  title: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  countInStock: number;
  image: File | null;
};

const initialForm: ProductForm = {
  title: "",
  description: "",
  price: 0,
  discount: 0,
  category: "",
  countInStock: 0,
  image: null,
};

const AdminPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "remove">("add");
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [categoryMode, setCategoryMode] = useState<"new" | "existing">("new");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/get_categories");
        if (!response.ok) {
          throw new Error("Не удалось загрузить категории");
        }

        const categories: string[] = await response.json();
        setExistingCategories(categories.filter(Boolean));
      } catch (error) {
        console.error("Ошибка загрузки категорий:", error);
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    if (!isOpen || (mode !== "remove" && mode !== "edit")) return;

    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch("http://localhost:5000/get_all_products");
        if (!response.ok) {
          throw new Error("Не удалось загрузить список товаров");
        }

        const data: IProduct[] = await response.json();
        if (!cancelled) setProducts(data);
      } catch (error) {
        if (!cancelled) {
          console.error("Ошибка загрузки товаров:", error);
          alert("Не удалось загрузить список товаров");
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode]);

  const handleInputChange = (
    field: keyof ProductForm,
    value: string | number | File | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openModal = (nextMode: "add" | "edit" | "remove") => {
    setMode(nextMode);
    setProductSearch("");
    setSelectedProduct(null);
    setForm(initialForm);
    setCategoryMode("new");
    setIsOpen(true);
  };

  const selectProductToEdit = (product: IProduct) => {
    const category = product.category ?? "";
    setSelectedProduct(product);
    setForm({
      title: product.title,
      description: product.description ?? "",
      price: product.price,
      discount: product.discount,
      category,
      countInStock: product.countInStock ?? 0,
      image: null,
    });
    setCategoryMode(existingCategories.includes(category) ? "existing" : "new");
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) return;
    handleInputChange("image", file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    handleFileSelection(file);
  };

  const getFinalCategory = () => {
    if (!form.category.trim()) {
      return "";
    }

    return form.category.trim();
  };

  const addNewProduct = async () => {
    const finalCategory = getFinalCategory();

    if (!form.title.trim()) {
      alert("Введите название товара");
      return;
    }

    if (!form.image) {
      alert("Загрузите картинку");
      return;
    }

    if (!finalCategory) {
      alert("Укажите категорию");
      return;
    }

    setLoading(true);

    try {
      const productData = new FormData();
      productData.append("title", form.title.trim());
      productData.append("description", form.description.trim());
      productData.append("price", String(form.price));
      productData.append("discount", String(form.discount));
      productData.append("category", finalCategory);
      productData.append("countInStock", String(form.countInStock));
      productData.append("image", form.image);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Войдите в аккаунт администратора");
      }

      const response = await fetch("http://localhost:5000/add_product", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: productData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Не удалось добавить товар");
      }

      alert("Товар успешно добавлен");
      setForm(initialForm);
      setCategoryMode("new");
      setIsOpen(false);
    } catch (error) {
      console.error("Ошибка при создании товара:", error);
      alert(
        error instanceof Error ? error.message : "Не удалось добавить товар",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async () => {
    if (!selectedProduct) return;

    const finalCategory = getFinalCategory();
    if (!form.title.trim() || !finalCategory) {
      alert("Введите название товара и укажите категорию");
      return;
    }

    setLoading(true);
    try {
      const productData = new FormData();
      productData.append("productId", String(selectedProduct.id));
      productData.append("title", form.title.trim());
      productData.append("description", form.description.trim());
      productData.append("price", String(form.price));
      productData.append("discount", String(form.discount));
      productData.append("category", finalCategory);
      productData.append("countInStock", String(form.countInStock));
      if (form.image) productData.append("image", form.image);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Войдите в аккаунт администратора");
      }

      const response = await fetch("http://localhost:5000/update_product", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: productData,
      });
      const updatedProduct: IProduct & { error?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(updatedProduct.error || "Не удалось сохранить товар");
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product,
        ),
      );
      setIsOpen(false);
      setSelectedProduct(null);
      setForm(initialForm);
      setCategoryMode("new");
    } catch (error) {
      console.error("Ошибка изменения товара:", error);
      alert(
        error instanceof Error ? error.message : "Не удалось сохранить товар",
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (product: IProduct) => {
    if (!window.confirm(`Удалить товар «${product.title}»?`)) return;

    setDeletingProductId(product.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Войдите в аккаунт администратора");
      }

      const response = await fetch("http://localhost:5000/delete_product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить товар");
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
    } catch (error) {
      console.error("Ошибка удаления товара:", error);
      alert(
        error instanceof Error ? error.message : "Не удалось удалить товар",
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title
      .toLocaleLowerCase()
      .includes(productSearch.trim().toLocaleLowerCase()),
  );

  const handleCategoryChange = (value: string) => {
    if (value === "add-new-category") {
      setCategoryMode("new");
      setForm((prev) => ({ ...prev, category: "" }));
      return;
    }

    setCategoryMode("existing");
    setForm((prev) => ({ ...prev, category: value }));
  };

  const handleModalClose = () => {
    setIsOpen(false);
    setLoading(false);
    setForm(initialForm);
    setCategoryMode("new");
    setSelectedProduct(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-top">
        <button onClick={() => openModal("add")}>Add Product</button>
        <button onClick={() => openModal("edit")}>Edit Product</button>
        <button onClick={() => openModal("remove")}>Remove Product</button>
      </div>

      {isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>
              {mode === "add"
                ? "Add Product"
                : mode === "edit"
                ? "Edit Product"
                : "Remove Product"}
            </h3>

            {mode === "remove" || (mode === "edit" && !selectedProduct) ? (
              <div className="admin-remove-content">
                <label htmlFor="product-search">
                  {mode === "edit"
                    ? "Choose a product to edit"
                    : "Search by product name"}
                </label>
                <input
                  id="product-search"
                  type="search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Product name"
                />

                <div className="admin-product-list">
                  {loadingProducts ? (
                    <p>Loading products...</p>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div className="admin-product-row" key={product.id}>
                        <img src={product.imageUrl} alt="" />
                        <div className="admin-product-details">
                          <strong>{product.title}</strong>
                          <span>{product.category}</span>
                        </div>
                        {mode === "edit" ? (
                          <button
                            className="admin-edit-button"
                            onClick={() => selectProductToEdit(product)}
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            className="admin-delete-button"
                            onClick={() => void deleteProduct(product)}
                            disabled={deletingProductId === product.id}
                          >
                            {deletingProductId === product.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No products found</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="admin-field">
                  <label htmlFor="product-title">Title</label>
                  <input
                    id="product-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="product-description">Description</label>
                  <textarea
                    id="product-description"
                    value={form.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="product-price">Price</label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      handleInputChange("price", Number(e.target.value))
                    }
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="product-discount">Discount %</label>
                  <input
                    id="product-discount"
                    type="number"
                    min="0"
                    value={form.discount}
                    onChange={(e) =>
                      handleInputChange("discount", Number(e.target.value))
                    }
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="product-count">Count in stock</label>
                  <input
                    id="product-count"
                    type="number"
                    min="0"
                    value={form.countInStock}
                    onChange={(e) =>
                      handleInputChange("countInStock", Number(e.target.value))
                    }
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="product-category">Category</label>
                  <select
                    id="product-category"
                    value={
                      categoryMode === "new"
                        ? "add-new-category"
                        : form.category
                    }
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="add-new-category">Add new category</option>
                    {existingCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  {categoryMode === "new" && (
                    <input
                      type="text"
                      placeholder="New category name"
                      value={form.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className="new-category-input"
                    />
                  )}
                </div>

                <div className="admin-field">
                  <label>Image</label>
                  <div
                    className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.image ? (
                      <span>{form.image.name}</span>
                    ) : (
                      <span>Drag and drop image here or click to select</span>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        handleFileSelection(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="admin-modal-actions">
              {mode === "edit" && selectedProduct && (
                <button
                  className="admin-back-button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setForm(initialForm);
                    setCategoryMode("new");
                  }}
                  disabled={loading}
                >
                  Back to list
                </button>
              )}
              {mode === "add" && (
                <button onClick={addNewProduct} disabled={loading}>
                  {loading ? "Uploading..." : "Save Product"}
                </button>
              )}
              {mode === "edit" && selectedProduct && (
                <button onClick={updateProduct} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button onClick={handleModalClose}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
