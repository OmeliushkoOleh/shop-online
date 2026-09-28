import "./HomePage.css";
import ProductCard from "../../components/ProductCard";
import { useEffect, useState } from "react";
import type { IProduct } from "../../types";

const HomePage = () => {
  const [initialProducts, setInitialProducts] = useState<IProduct[]>([]);
  useEffect(() => {
    fetch(`http://localhost:5000/get_initial_products`)
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        setInitialProducts(response);
      });
  }, []);

  return (
    <div className="HomePage">
      <div>
        <h1>Aboute us</h1> lorem Lorem ipsum dolor sit amet, consectetur
        adipisicing elit. Adipisci harum quia aspernatur laborum assumenda
        expedita ullam nemo, quae eius modi, ipsa ratione dolorem dicta eligendi
        eaque unde omnis sequi quis. Lorem, ipsum dolor sit amet consectetur
        adipisicing elit. Fugiat qui dolores repudiandae nulla, nam facere quasi
        corporis beatae alias aut ratione rem eius quod deleniti voluptatum,
        excepturi placeat impedit consectetur.
      </div>
      <div>
        <h1>Some info</h1> lorem Lorem ipsum dolor sit amet, consectetur
        adipisicing elit. Adipisci harum quia aspernatur laborum assumenda
        expedita ullam nemo, quae eius modi, ipsa ratione dolorem dicta eligendi
        eaque unde omnis sequi quis. Lorem, ipsum dolor sit amet consectetur
        adipisicing elit. Fugiat qui dolores repudiandae nulla, nam facere quasi
        corporis beatae alias aut ratione rem eius quod deleniti voluptatum,
        excepturi placeat impedit consectetur.
      </div>
      <div>
        <h1>Other info</h1> lorem Lorem ipsum dolor sit amet, consectetur
        adipisicing elit. Adipisci harum quia aspernatur laborum assumenda
        expedita ullam nemo, quae eius modi, ipsa ratione dolorem dicta eligendi
        eaque unde omnis sequi quis. Lorem, ipsum dolor sit amet consectetur
        adipisicing elit. Fugiat qui dolores repudiandae nulla, nam facere quasi
        corporis beatae alias aut ratione rem eius quod deleniti voluptatum,
        excepturi placeat impedit consectetur.
      </div>
      <div className="recomended-products">
        {initialProducts.length > 0 ? <h2>Discount Products</h2> : ""}
        <div className="initial-products-container">
          {initialProducts.length > 0 ? (
            initialProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))
          ) : (
            <div>
              <h1>Loading...</h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
