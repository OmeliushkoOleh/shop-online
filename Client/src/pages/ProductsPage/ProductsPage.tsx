import "./ProductsPage.css";
import ProductCard from "../../components/ProductCard";
import { useEffect, useMemo, useState } from "react";
import type { IProduct } from "../../types";
import { useCategoryStore } from "../../store/useCategoryStore";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const ProductsPage = () => {
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    localStorage.getItem("currentCategory") || "ALL",
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [sortType, setSortType] = useState<string>(
    localStorage.getItem("sortType") || "default",
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(localStorage.getItem("currentPage")) || 1,
  );
  const [minLimit, setMinLimit] = useState<number>(0);
  const [maxLimit, setMaxLimit] = useState<number>(10000);
  const [range, setRange] = useState<number[]>([minLimit, maxLimit]);
  const [filterRange, setFilterRange] = useState<number[]>([
    minLimit,
    maxLimit,
  ]);

  const itemsPerPage = 6;

  const handlePage = (page: number | string, arrow?: string) => {
    if (page === "...") {
      return;
    }
    let newPage;
    if (arrow === "prev") {
      if (Number(localStorage.getItem("currentPage")) - 1 === 0) {
        return;
      }
      newPage = Number(localStorage.getItem("currentPage")) - 1;
    } else if (arrow === "next") {
      if (Number(localStorage.getItem("currentPage")) + 1 > totalPages) {
        return;
      }
      newPage = Number(localStorage.getItem("currentPage")) + 1;
    } else {
      newPage = page;
    }
    setCurrentPage(Number(newPage));
    localStorage.setItem("currentPage", String(newPage));
  };

  useEffect(() => {
    fetch(`http://localhost:5000/get_all_products`)
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        setAllProducts(response);
        setAllCategories(
          Array.from(new Set(response.map((item: IProduct) => item.category))),
        );
      });
  }, []);

  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     setFilterRange(range);
  //     handlePage(1);
  //   }, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [range]);

  const createPagination = () => {
    const currentPage = Number(localStorage.getItem("currentPage")) || 1;
    const arr: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      arr.push(i);
    }
    if (5 <= currentPage) {
      arr.splice(1, currentPage - 3, "...");
    }
    if (currentPage <= totalPages - 4) {
      arr.splice(arr.indexOf(currentPage) + 2, totalPages, "...", totalPages);
    }
    const initialItems = arr.map((value) => ({
      id: crypto.randomUUID(),
      val: value,
    }));
    return initialItems;
  };

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = allProducts.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice =
        product.price * (1 - (product.discount || 0) / 100) >= filterRange[0] &&
        product.price * (1 - (product.discount || 0) / 100) <= filterRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });

    return [...filtered].sort((a, b) => {
      const priceWithDiscountA = a.price * (1 - (a.discount || 0) / 100);
      const priceWithDiscountB = b.price * (1 - (b.discount || 0) / 100);
      if (sortType === "price-asc") {
        localStorage.setItem("sortType", "price-asc");
        return priceWithDiscountA - priceWithDiscountB;
      }
      if (sortType === "price-desc") {
        localStorage.setItem("sortType", "price-desc");
        return priceWithDiscountB - priceWithDiscountA;
      }
      return 0;
    });
  }, [allProducts, searchQuery, selectedCategory, sortType, filterRange]);

  useEffect(() => {
    if (allProducts.length === 0) return;
    const prices = allProducts.map(
      (product) => product.price * (1 - (product.discount || 0) / 100),
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    setMinLimit(minPrice);
    setMaxLimit(maxPrice);
    const storedRange = localStorage.getItem("range");
    const rangeFromLocalStorage = storedRange
      ? JSON.parse(storedRange)
      : { min: 0, max: 10000 };

    const minStored = Number(rangeFromLocalStorage.min ?? 0);
    const maxStored = Number(rangeFromLocalStorage.max ?? 10000);

    setFilterRange([minStored, maxStored]);
    setRange([minStored, maxStored]);
  }, [allProducts]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handleChangePriceRange = (newRange: number | number[]): void => {
    if (Array.isArray(newRange)) {
      setRange(newRange);
      const rangeForLocalStorage = {
        min: newRange[0],
        max: newRange[1],
      };
      localStorage.setItem("range", JSON.stringify(rangeForLocalStorage));
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    handlePage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem("currentCategory", e.target.value);
    setSelectedCategory(e.target.value);
    handlePage(1);
  };

  return (
    <div className="product-page">
      <div className="product-page-left-bar">
        <div
          className="sort-button"
          onClick={() => {
            handlePage(1);
            setSortType("price-asc");
          }}
        >
          From cheap to expensive
        </div>
        <div
          className="sort-button"
          onClick={() => {
            handlePage(1);
            setSortType("price-desc");
          }}
        >
          From expensive to cheap
        </div>
        <div className="filter-price">
          <div style={{ width: 130, marginLeft: "15px" }}>
            <div className="price-spans">
              <span>{range[0]}</span>
              <span>-</span>
              <span>{range[1]}</span>
            </div>
            <Slider
              range
              min={minLimit}
              max={maxLimit}
              value={range}
              onChange={handleChangePriceRange}
              onChangeComplete={() => {
                setFilterRange(range);
              }}
            />
          </div>
        </div>
        <div className="filter-category">
          <label htmlFor="category">Category: </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="All">All</option>
            {allCategories?.map((category) => {
              return (
                <option key={crypto.randomUUID()} value={category}>
                  {category}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="products-container">
        <div className="product-card-container">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <ProductCard key={item.title} product={item} />
            ))
          ) : (
            <div></div>
          )}{" "}
        </div>
        {totalPages > 1 ? (
          <div className="pagination">
            <div
              className="pagination-arrow"
              onClick={() => {
                handlePage(0, "prev");
              }}
            >
              🢀
            </div>

            {createPagination().map((item) => {
              let className = "pagination-item";
              if (Number(localStorage.getItem("currentPage")) === item.val) {
                className = "pagination-item current-page";
              }
              return (
                <div
                  onClick={() => {
                    handlePage(item.val);
                  }}
                  className={className}
                  key={item.id}
                >
                  {item.val}
                </div>
              );
            })}
            <div
              className="pagination-arrow"
              onClick={() => {
                handlePage(0, "next");
              }}
            >
              🢂
            </div>
          </div>
        ) : (
          <div className="pagination"></div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
