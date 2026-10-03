import "./ProductsPage.css";
import ProductCard from "../../components/ProductCard";
import { useCallback, useEffect, useState } from "react";
import type { IProduct } from "../../types";
import { useCategoryStore } from "../../store/useCategoryStore";
import { useNavigate } from "react-router-dom";
import { _any } from "zod/v4/core";
import { XLg } from "react-bootstrap-icons";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
let MIN_LIMIT: number;
let MAX_LIMIT: number;
const ProductsPage = () => {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [allSortedProducts, setAllSortedProducts] = useState<IProduct[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<IProduct[]>([]);
  const category = useCategoryStore((state) => state.category);
  const itemsOnPage = 6;
  const totalPages = Math.ceil(allProducts.length / itemsOnPage);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    navigate(`/products/page${newPage}`);
    localStorage.setItem("currentPage", String(newPage));
    const index1 = Number(newPage) * itemsOnPage - itemsOnPage;
    const index2 = Number(newPage) * itemsOnPage;
    const productsForThisPage = allSortedProducts.slice(index1, index2);
    setVisibleProducts(productsForThisPage);
  };

  const handleSort = (e: string) => {
    const productsCopy = [...allProducts];
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
        setAllSortedProducts(productsCopy);
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
        setAllSortedProducts(productsCopy);
        break;
    }
    handlePage(1);
  };

  useEffect(() => {
    fetch(`http://localhost:5000/get_products_by_category?category=${category}`)
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        setAllProducts(response);
        //на самом деле тут продукты не отсортированы
        setAllSortedProducts(response);
        handlePage(Number(localStorage.getItem("currentPage")));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    setTimeout(() => {
      handlePage(Number(localStorage.getItem("currentPage")));
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSortedProducts]);

  MIN_LIMIT = Math.min(...allProducts.map((product) => product.price));
  MAX_LIMIT = Math.max(...allProducts.map((product) => product.price));
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    let newMin = value;
    if (newMin < MIN_LIMIT) newMin = MIN_LIMIT;
    if (newMin > range[1]) newMin = range[1];
    setRange([newMin, range[1]]);
    debouncedApplyFilter([newMin, range[1]]);
    handleChange([newMin, range[1]]);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(MIN_LIMIT, MAX_LIMIT);
    const value = Number(e.target.value);
    let newMax = value;
    if (newMax > MAX_LIMIT) newMax = MAX_LIMIT;
    if (newMax < range[0]) newMax = range[0];
    setRange([range[0], newMax]);
    debouncedApplyFilter([range[0], newMax]);
    handleChange([range[0], newMax]);
  };
  const [range, setRange] = useState<[number, number]>([MIN_LIMIT, MAX_LIMIT]);

  const handleApplyFilter = (finalRange: [number, number]) => {
    if (MIN_LIMIT > finalRange[0] || finalRange[0] > MAX_LIMIT) {
      finalRange[0] = MIN_LIMIT;
    }
    if (MAX_LIMIT < finalRange[1] || finalRange[1] < MIN_LIMIT) {
      finalRange[1] = MAX_LIMIT;
    }
    console.log("Отправляем запрос на сервер с диапазоном:", finalRange);
  };

  function debounce(fn: (...args: any[]) => void, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }
  const debouncedApplyFilter = useCallback(
    debounce((nextRange: [number, number]) => {
      handleApplyFilter(nextRange);
    }, 500),
    [],
  );
  const handleChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setRange(value as [number, number]);
      debouncedApplyFilter(value as [number, number]);
    }
  };

  return (
    <div className="product-page">
      {isFilterOpen === true ? (
        <div id="filterModal" className="filter-modal">
          qwe
          <XLg
            className="close-bnt"
            onClick={() => {
              filterToggleModal();
            }}
          />
        </div>
      ) : (
        ""
      )}
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
        <div className="product-page-top-item">
          <span className="filter-icon">FILTERS</span>
        </div>
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
      <div className="filter-container">
        <div className="filters">
          <div className="filter-price">
            Price range:
            <div style={{ width: 170, margin: "12px" }}>
              <Slider
                range
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                value={range}
                onChange={handleChange}
                trackStyle={[{ backgroundColor: "#007bff" }]}
                handleStyle={[
                  { borderColor: "#007bff", height: 20, width: 20 },
                  { borderColor: "#007bff", height: 20, width: 20 },
                ]}
              />
              <div className="price-inputs">
                <input
                  type="number"
                  value={range[0]}
                  onChange={(e) =>
                    handleChange([Number(e.target.value), range[1]])
                  }
                  onBlur={(e) => {
                    handleMinInputChange(e);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleMinInputChange(e)
                  }
                />{" "}
                —{" "}
                <input
                  type="number"
                  value={range[1]}
                  onChange={(e) =>
                    handleChange([range[0], Number(e.target.value)])
                  }
                  onBlur={(e) => {
                    handleMaxInputChange(e);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleMaxInputChange(e)
                  }
                />
              </div>
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
  );
};

export default ProductsPage;
