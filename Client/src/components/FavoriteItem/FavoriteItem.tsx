import "./FavoriteItem.css";
import type { IFavoriteItem, IProduct } from "../../types";
import { Trash } from "react-bootstrap-icons";
import { useCartStore } from "../../store/useCartStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { useNavigate, useLocation } from "react-router-dom";

const FavoriteItem = (props: IFavoriteItem) => {
  const navigate = useNavigate();
  const discountedPrice = Math.round(props.price * (1 - props.discount / 100));
  const deleteFromFavorite = useFavoriteStore(
    (state) => state.deleteFromFavorite,
  );
  const addNewProductToCart = useCartStore(
    (state) => state.addNewProductToCart,
  );
  const goToProductPage = (id: IProduct["id"]) => {
    localStorage.setItem("currentProductId", id.toString());
    navigate(`/product/${id}`);
  };

  return (
    <div
      className="favorite-item"
      onClick={() => {
        goToProductPage(props.product_id);
      }}
    >
      <div className="favorite-item-img">
        <img src={props.imageUrl} alt={props.title} />
      </div>
      <div className="favorite-item-info">
        <div>{props.title}</div>
        <div>{discountedPrice}</div>
      </div>

      <div className="favorite-item-buttons">
        {props.countInStock && props.countInStock > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addNewProductToCart(props.product_id);
            }}
          >
            Add to cart
          </button>
        ) : (
          <div>Out Of Stock</div>
        )}
        <div
          className="trash-button"
          onClick={(e) => {
            e.stopPropagation();
            deleteFromFavorite(props.id); // записать именно айди который первый
          }}
        >
          <Trash size={35} color="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default FavoriteItem;
