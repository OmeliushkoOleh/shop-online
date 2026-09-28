import "./CustomDropdown.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategoryStore } from "../../store/useCategoryStore";

export const CustomDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const changeCategory = useCategoryStore((state) => state.changeCategory);

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleCategoryClick = (cat: string) => {
    changeCategory(cat);
    setSelectedCategory(cat);
    navigate("/products");
    setIsOpen(false);
  };

  useEffect(() => {
    fetch("http://localhost:5000/get_categories")
      .then((response) => {
        if (!response.ok) throw new Error("Ошибка сети");
        return response.json();
      })
      .then((res) => {
        setCategories(res);
      })
      .catch((error) => console.error("Ошибка загрузки категорий:", error));
  }, []);
  return (
    <div
      className="drop-down-container"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="category-button">Categories</button>

      {isOpen && (
        <ul>
          <li onClick={() => handleCategoryClick("allProducts")}>
            {"All Products"}
          </li>
          {categories.map((cat) => (
            <li key={cat} onClick={() => handleCategoryClick(cat)}>
              {cat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default CustomDropdown;
