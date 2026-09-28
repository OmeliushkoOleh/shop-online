import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  ua: {
    translation: {
      welcome: "Вітаю!",
      home: "Home",
      cart: "Cart",
      favorite: "Favorite",
      theme: "Change Theme",
      toggleLang: "Change Language",
      profile: "Profile",
      logIn: "Login",
      logOut: "Log Out",
    },
  },
  en: {
    translation: {
      welcome: "Вітаю!",
      home: "Додому",
      cart: "Корзина",
      favorite: "Обране",
      theme: "Змінити тему",
      toggleLang: "Змінити Мову",
      profile: "Профіль",
      logIn: "Увійти у Профіль",
      logOut: "Вийти З Профілю",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language || "en";

export default i18n;
