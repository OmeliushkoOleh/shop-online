import "./CartPage.css";
import { useEffect, useState } from "react";
import CartItem from "../../components/CartItem";
import type { ICartItem } from "../../types";
import { useCartStore } from "../../store/useCartStore";

const CartPage = () => {
  const cart = useCartStore((state) => state.cartItems);
  const [arrToDraw, setArrToDraw] = useState<ICartItem[]>(cart);
  const [total, setTotal] = useState(0);

  const countTotal = () => {
    let res = 0;
    cart.forEach((e) => {
      const priceForOne = Math.round(e.price * (1 - e.discount / 100));
      res = res + priceForOne * e.quantity;
    });
    setTotal(res);
  };
  const buyFunction = () => {
    console.log("buyFunction");
  };
  useEffect(() => {
    setArrToDraw(cart);
    countTotal();
  }, [cart]);

  return (
    <div className="cart-page">
      <div className="cart-page-top">
        {cart.length !== 0 ? (
          <div className="cart-top">
            <h2>Total: ${total}</h2>
            <div>
              <button onClick={buyFunction}>Buy</button>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
      <div className="cart-item-container">
        {arrToDraw.length > 0 ? (
          arrToDraw.map((item) => <CartItem key={item.id} {...item} />)
        ) : (
          <div>
            <h2>Your cart is currently empty.</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
