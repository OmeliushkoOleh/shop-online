import { useEffect, useState } from "react";
import "./ProductPage.css";
import { useParams } from "react-router-dom";
import type { IProduct } from "../../types";
import { useCartStore } from "../../store/useCartStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";

const ProductPage = () => {
  const addToFavorite = useFavoriteStore((state) => state.addToFavorite);
  const addNewProductToCart = useCartStore(
    (state) => state.addNewProductToCart,
  );
  const [productInfo, setProductInfo] = useState<IProduct>();
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    fetch(`http://localhost:5000/get_product_info?id=${id}`)
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        setProductInfo(response[0]);
      });
  }, []);

  return (
    <>
      {productInfo ? (
        <div className="full-product-page">
          <h1>{productInfo.title}</h1>
          <div className="img-info">
            <div>
              <img src={productInfo.imageUrl}></img>
            </div>
            <div className="info">
              <div className="description">
                <h2>{productInfo.description}</h2>
              </div>
              <div className="info-price">
                {productInfo.discount == 0 ? (
                  <span className="price-span">${productInfo.price}</span>
                ) : (
                  <span className="price-span">
                    <span className="price-discount-span">
                      ${productInfo.price}
                    </span>
                    &nbsp; $
                    {Math.round(
                      productInfo.price -
                        productInfo.price * productInfo.discount * 0.01,
                    ).toFixed(0)}
                  </span>
                )}
              </div>
              <div className="buttons">
                {productInfo.countInStock && productInfo.countInStock > 0 ? (
                  <button
                    onClick={() => {
                      addNewProductToCart(productInfo.id);
                    }}
                  >
                    To Cart
                  </button>
                ) : (
                  ""
                )}
                <button
                  onClick={(e) => {
                    addToFavorite(productInfo.id);
                  }}
                >
                  To favorite
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default ProductPage;
