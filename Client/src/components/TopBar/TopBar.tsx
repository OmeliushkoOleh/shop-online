import "./TopBar.css";
import { useThemeStore } from "../../store/useThemeStore";
import { Link } from "react-router-dom";
import {
  House,
  BoxArrowInRight,
  BoxArrowRight,
  Person,
  Translate,
  BrightnessHigh,
  Moon,
  Heart,
  Cart,
  XLg,
  PersonLock,
} from "react-bootstrap-icons";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import { useAuthStore } from "../../store/authStore";
import { CartPage } from "../../pages";
import { useCartStore } from "../../store/useCartStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";

const TopBar = () => {
  const role = useAuthStore((state) => state.role);

  const cart = useCartStore((state) => state.cartItems);
  const favorite = useFavoriteStore((state) => state.favorite);
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("modal-open");
  };

  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);

  const BootsTrapIconSize = 30;
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith("en") ? "ua" : "en";
    i18n.changeLanguage(nextLang);
  };

  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const theme = useThemeStore(
    (state) => state.theme || localStorage.getItem("theme"),
  );

  const logOut = () => {
    signOut();
  };

  return (
    <div className="top-bar">
      {isOpen === true ? (
        <div id="cartModal" className="cart-modal">
          <CartPage />
          <XLg
            className="close-bnt"
            onClick={() => {
              toggleModal();
            }}
          />
        </div>
      ) : (
        ""
      )}

      <div className="top-bar-item">
        <div className="tooltip-wrapper">
          <Link className="link" to="/">
            <House size={BootsTrapIconSize} color="currentColor" />
          </Link>
          <div className="my-tooltip">{t("home")}</div>
        </div>
        {role === "admin" || role === "superAdmin" ? (
          <div className="tooltip-wrapper">
            <Link className="link" to="/admin">
              <PersonLock size={BootsTrapIconSize} color="currentColor" />
            </Link>
            <div className="my-tooltip">{t("Admin Panel")}</div>
          </div>
        ) : (
          ""
        )}
      </div>
      <div className="top-bar-item">
        <div className="tooltip-wrapper">
          {/* <Link className="link" to="/cart">
            <Cart size={BootsTrapIconSize} color="currentColor" />
          </Link> */}
          <Cart
            onClick={() => {
              toggleModal();
            }}
            size={BootsTrapIconSize}
            color="currentColor"
          />
          {cart.length === 0 ? (
            ""
          ) : (
            <span key={cart.length} className="cart-quantity">
              {cart.length}
            </span>
          )}

          <div className="my-tooltip">{t("cart")}</div>
        </div>
        <div className="tooltip-wrapper">
          <Link className="link" to="/favorite">
            <Heart size={BootsTrapIconSize} color="currentColor" />
            {favorite.length === 0 ? (
              ""
            ) : (
              <span key={favorite.length} className="cart-quantity">
                {favorite.length}
              </span>
            )}
          </Link>
          <div className="my-tooltip">{t("favorite")}</div>
        </div>
      </div>
      <div className="top-bar-item">
        <div>
          <Link className="link" to="/products">
            Go To Products
          </Link>
        </div>

        <div></div>
      </div>
      <div className="top-bar-item">
        <div className="tooltip-wrapper">
          <div className="theme-button" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Moon size={BootsTrapIconSize} color="currentColor" />
            ) : (
              <BrightnessHigh size={BootsTrapIconSize} color="currentColor" />
            )}
          </div>
          <div className="my-tooltip">{t("theme")}</div>
        </div>
        <div className="tooltip-wrapper">
          <Translate
            onClick={toggleLanguage}
            size={BootsTrapIconSize}
            color="currentColor"
          />

          <div className="my-tooltip">{t("toggleLang")}</div>
        </div>
      </div>
      <div className="top-bar-item">
        {user !== null ? (
          <div className="profile_logOut">
            <div className="tooltip-wrapper">
              <Link className="link" to="/profile">
                <Person size={BootsTrapIconSize} color="currentColor" />
              </Link>
              <div className="my-tooltip">{t("profile")}</div>
            </div>
            <div className="tooltip-wrapper">
              <BoxArrowRight
                onClick={logOut}
                size={BootsTrapIconSize}
                color="currentColor"
              />

              <div className="my-tooltip">{t("logOut")}</div>
            </div>
          </div>
        ) : (
          <div className="tooltip-wrapper">
            <Link className="link" to="/login">
              <BoxArrowInRight size={BootsTrapIconSize} color="currentColor" />
            </Link>
            <div className="my-tooltip">{t("logIn")}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
