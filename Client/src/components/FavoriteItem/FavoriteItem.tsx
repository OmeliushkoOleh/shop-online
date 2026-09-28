import "./FavoriteItem.css";
import type { IFavoriteItem } from "../../types";
import { Trash } from "react-bootstrap-icons";
import { useCartStore } from "../../store/useCartStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";

const FavoriteItem = (props: IFavoriteItem) => {
  const discountedPrice = Math.round(props.price * (1 - props.discount / 100));
  const deleteFromFavorite = useFavoriteStore(
    (state) => state.deleteFromFavorite,
  );
  const addNewProductToCart = useCartStore(
    (state) => state.addNewProductToCart,
  );

  return (
    <div className="favorite-item">
      <div className="favorite-item-img">
        <img src={props.imageUrl} alt={props.title} />
      </div>
      <div className="favorite-item-info">
        <div>{props.title}</div>
        <div>{discountedPrice}</div>
      </div>

      <div className="favorite-item-buttons">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addNewProductToCart(props.product_id);
          }}
        >
          Add to cart
        </button>
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
