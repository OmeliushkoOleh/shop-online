import "./ProductsPage.css";
import ProductCard from "../../components/ProductCard";
import { useEffect, useState } from "react";
import type { IProduct } from "../../types";
import { useCategoryStore } from "../../store/useCategoryStore";

const ProductsPage = () => {
  const [visibleProducts, setVisibleProducts] = useState<IProduct[]>([]);
  const category = useCategoryStore((state) => state.category);

  const handleSort = (e: string) => {
    const productsCopy = [...visibleProducts];
    switch (e) {
      case "1-100":
        productsCopy.sort((a, b) => {
          const actualPriceA = a.discount
            ? a.price * (1 - a.discount / 100)
            : a.price;
          const actualPriceB = b.discount
            ? b.price * (1 - b.discount / 100)
            : b.price;
          return actualPriceA - actualPriceB;
        });
        setVisibleProducts(productsCopy);
        break;

      case "100-1":
        productsCopy.sort((a, b) => {
          const actualPriceA = a.discount
            ? a.price * (1 - a.discount / 100)
            : a.price;
          const actualPriceB = b.discount
            ? b.price * (1 - b.discount / 100)
            : b.price;
          return actualPriceB - actualPriceA;
        });
        setVisibleProducts(productsCopy);
        break;
    }
  };
  useEffect(() => {
    fetch(`http://localhost:5000/get_products_by_category?category=${category}`)
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        setVisibleProducts(response);
      });
  }, [category]);

  return (
    <div className="product-page">
      <div className="product-page-top">
        <div className="product-page-top-item">
          {category !== "allProducts" ? (
            <div>
              CATEGORY <span style={{ margin: "0 10px" }}>&gt;</span>{" "}
              {category.toUpperCase()}
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="product-page-top-item">filters</div>
        <div className="product-page-top-item">
          <div
            className="sort-button"
            onClick={() => {
              handleSort("1-100");
            }}
          >
            From cheap to expensive
          </div>
          <div
            className="sort-button"
            onClick={() => {
              handleSort("100-1");
            }}
          >
            From expensive to cheap
          </div>
        </div>
      </div>
      <div className="product-card-container">
        {visibleProducts.length > 0 ? (
          visibleProducts.map((item) => (
            <ProductCard key={item.title} product={item} />
          ))
        ) : (
          <div></div>
        )}{" "}
      </div>
    </div>
  );
};

export default ProductsPage;
