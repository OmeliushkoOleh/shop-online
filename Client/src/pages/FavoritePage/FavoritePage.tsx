import "./FavoritePage.css";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import FavoriteItem from "../../components/FavoriteItem";

const FavoritePage = () => {
  const favoriteArr = useFavoriteStore((state) => state.favorite);

  return (
    <div className="favorite-page">
      {favoriteArr.length !== 0 ? (
        favoriteArr.map((e) => {
          return <FavoriteItem key={e.id} {...e} />;
        })
      ) : (
        <div>
          <h2 style={{ marginTop: "50px" }}>
            Your Favorite is currently empty.
          </h2>
        </div>
      )}
    </div>
  );
};

export default FavoritePage;
