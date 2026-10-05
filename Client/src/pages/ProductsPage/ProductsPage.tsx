import "./ProductsPage.css";
import ProductCard from "../../components/ProductCard";
import { useEffect, useMemo, useState } from "react";
import type { IProduct } from "../../types";
import { useCategoryStore } from "../../store/useCategoryStore";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const getDiscountedPrice = (price: number, discount: number) => {
  const priceInCents = Math.round(price * 100);
  const discountedPriceInCents = Math.round(
    (priceInCents * (100 - discount)) / 100,
  );
  return discountedPriceInCents / 100;
};

const getInitialPage = () => {
  const storedPage = localStorage.getItem("currentPage");
  const page = Number(storedPage);
  return storedPage &&
    storedPage !== "null" &&
    Number.isInteger(page) &&
    page > 0
    ? page
    : 1;
};

const ProductsPage = () => {
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    localStorage.getItem("currentCategory") &&
      localStorage.getItem("currentCategory") !== "null"
      ? localStorage.getItem("currentCategory")!
      : "All",
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [sortType, setSortType] = useState<string>(
    localStorage.getItem("sortType") &&
      localStorage.getItem("sortType") !== "null"
      ? localStorage.getItem("sortType")!
      : "default",
  );
  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
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
      if (currentPage <= 1) return;
      newPage = currentPage - 1;
    } else if (arrow === "next") {
      if (currentPage >= totalPages) return;
      newPage = currentPage + 1;
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
      const discountedPrice = getDiscountedPrice(
        product.price,
        product.discount || 0,
      );
      const matchesPrice =
        discountedPrice >= filterRange[0] && discountedPrice <= filterRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });

    return [...filtered].sort((a, b) => {
      const priceWithDiscountA = getDiscountedPrice(a.price, a.discount || 0);
      const priceWithDiscountB = getDiscountedPrice(b.price, b.discount || 0);
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
    const prices = allProducts.map((product) =>
      getDiscountedPrice(product.price, product.discount || 0),
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinLimit(minPrice);
    setMaxLimit(maxPrice);
    const storedRange = localStorage.getItem("range");
    let rangeFromLocalStorage: { min?: number; max?: number } | null = null;
    if (storedRange && storedRange !== "null") {
      try {
        rangeFromLocalStorage = JSON.parse(storedRange);
      } catch {
        rangeFromLocalStorage = null;
      }
    }

    const minStored = rangeFromLocalStorage
      ? Math.max(
          minPrice,
          Math.min(
            maxPrice,
            roundToCents(Number(rangeFromLocalStorage.min ?? minPrice)),
          ),
        )
      : minPrice;
    const maxStored = rangeFromLocalStorage
      ? Math.max(
          minStored,
          Math.min(
            maxPrice,
            roundToCents(Number(rangeFromLocalStorage.max ?? maxPrice)),
          ),
        )
      : maxPrice;

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
      const normalizedRange = newRange.map(roundToCents);
      setRange(normalizedRange);
      const rangeForLocalStorage = {
        min: normalizedRange[0],
        max: normalizedRange[1],
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

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortType("default");
    setCurrentPage(1);
    setRange([minLimit, maxLimit]);
    setFilterRange([minLimit, maxLimit]);

    localStorage.setItem("currentCategory", "null");
    localStorage.setItem("sortType", "null");
    localStorage.setItem("currentPage", "null");
    localStorage.setItem("range", "null");
  };

  return (
    <div className="product-page">
      <div className="product-page-left-bar">
        <button
          type="button"
          className="sort-button"
          onClick={() => {
            handlePage(1);
            setSortType("price-asc");
          }}
        >
          From cheap to expensive
        </button>
        <button
          type="button"
          className="sort-button"
          onClick={() => {
            handlePage(1);
            setSortType("price-desc");
          }}
        >
          From expensive to cheap
        </button>
        <div className="filter-price">
          <div className="price-range-control">
            <label className="sidebar-filter-label">Price range</label>
            <div className="price-spans">
              <span>{Math.round(range[0])}</span>
              <span>-</span>
              <span>{Math.round(range[1])}</span>
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
          <label className="sidebar-filter-label" htmlFor="category">
            Category
          </label>
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
        <input
          className="product-search-input"
          id="product-search-input"
          type="search"
          placeholder="Search products"
          aria-label="Search products"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button className="clear-filters-button" onClick={clearAllFilters}>
          Clear all filters
        </button>
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
              if (currentPage === item.val) {
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
