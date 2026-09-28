import "./CartItem.css";
import type { ICartItem } from "../../types";
import { useCartStore } from "../../store/useCartStore";
import { Trash } from "react-bootstrap-icons";
import { useState } from "react";

const CartItem = (props: ICartItem) => {
  const changeCart = useCartStore((state) => state.changeCart);

  const handleQuantityChange = useCartStore(
    (state) => state.handleQuantityChange,
  );

  const deleteAllThisProductFromCart = useCartStore(
    (state) => state.deleteAllThisProductFromCart,
  );

  const isFetched = useCartStore((state) => state.isFetched);

  const onDeleteClick = () => {
    // const userAnswer = confirm("Are you sure?");
    // if (userAnswer) {
    //   deleteAllThisProductFromCart(props.id);
    // }
    deleteAllThisProductFromCart(props.id);
  };
  const discountedPrice = Math.round(props.price * (1 - props.discount / 100));

  return (
    <div className="cart-list">
      <div className="cart-list-img">
        <img src={props.imageUrl} alt={props.title} />
      </div>
      <div className="cart-list-info">
        <h3>{props.title}</h3>
        <div>
          <span>Price: $</span>
          <span>{discountedPrice}</span>
        </div>
        {/* <div>Items in stock: {props.countInStock}</div> */}
      </div>

      <div className="quantity">
        <button
          // onClick={(e) => {
          //   handleQuantityChange(-1, props.product_id);
          // }}
          onClick={() =>
            handleQuantityChange(
              -1,
              props.product_id,
              props.quantity,
              props.countInStock,
            )
          }
          disabled={isFetched || props.quantity <= 1}
          className="quantity-btn"
          type="button"
        >
          −
        </button>
        <div className="quantity-number">{props.quantity}</div>
        <button
          // onClick={(e) => {
          //   handleQuantityChange(+1, props.product_id);
          // }}
          onClick={() =>
            handleQuantityChange(
              1,
              props.product_id,
              props.quantity,
              props.countInStock,
            )
          }
          disabled={isFetched || props.quantity >= props.countInStock}
          className="quantity-btn"
          type="button"
        >
          +
        </button>
      </div>

      <div className="summary">Total: ${discountedPrice * props.quantity}</div>
      <div className="cart-list-delete-button">
        <div className="trash-button" onClick={onDeleteClick}>
          <Trash size={35} color="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default CartItem;
