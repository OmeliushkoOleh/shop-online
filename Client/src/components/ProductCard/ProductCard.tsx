import "./ProductCard.css";
import type { IProduct } from "../../types.ts";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { Heart, Cart, Trash } from "react-bootstrap-icons";
import { useFavoriteStore } from "../../store/useFavoriteStore";
interface IMyComponentProps {
  product: IProduct;
}
const ProductCard: React.FC<IMyComponentProps> = ({ product }) => {
  const location = useLocation();
  const addToFavorite = useFavoriteStore((state) => state.addToFavorite);
  const deleteFromFavorite = useFavoriteStore(
    (state) => state.deleteFromFavorite,
  );

  const BootsTrapButtonIconSize = 27;
  const addNewProductToCart = useCartStore(
    (state) => state.addNewProductToCart,
  );
  const cart = useCartStore((state) => state.cartItems);
  let colorForCart = "grey";
  cart.forEach((e) => {
    if (e.product_id === product.id) {
      colorForCart = "green";
    }
  });

  const favorite = useFavoriteStore((state) => state.favorite);
  let colorForFavorite = "grey";
  favorite.forEach((e) => {
    if (e.product_id === product.id) {
      colorForFavorite = "green";
    }
  });
  const navigate = useNavigate();

  const goToProductPage = (id: IProduct["id"]) => {
    localStorage.setItem("currentProductId", id.toString());
    navigate(`/product/${id}`);
  };

  return (
    <div
      className="product-card"
      onClick={() => {
        goToProductPage(product.id);
      }}
    >
      <div className="product-img">
        <img src={product.imageUrl}></img>

        <div className="button-container">
          {product.countInStock && product.countInStock > 0 ? (
            <button
              className="product-card-button"
              onClick={(e) => {
                e.stopPropagation();
                addNewProductToCart(product.id);
              }}
            >
              <Cart
                size={BootsTrapButtonIconSize}
                style={{ stroke: colorForCart, strokeWidth: 0.7 }}
                color={colorForCart}
              />
            </button>
          ) : (
            <div className="out-of-stock"> Out Of Stock</div>
          )}

          <button
            className="product-card-button"
            onClick={(e) => {
              e.stopPropagation();
              addToFavorite(product.id);
            }}
          >
            <Heart
              size={BootsTrapButtonIconSize}
              style={{ stroke: colorForFavorite, strokeWidth: 0.8 }}
              color={colorForFavorite}
            />
          </button>
        </div>
      </div>
      <div className="product-card-info">
        <div className="info-title">{product.title}</div>
        <div className="info-price">
          {product.discount == 0 ? (
            <span className="price-span">${product.price}</span>
          ) : (
            <span className="price-span">
              <span className="price-discount-span">${product.price}</span>$
              {(
                product.price -
                product.price * product.discount * 0.01
              ).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
