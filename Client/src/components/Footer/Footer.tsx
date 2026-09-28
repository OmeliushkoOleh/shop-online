import "./Footer.css";
import {
  Telegram,
  Whatsapp,
  Facebook,
  Instagram,
  Youtube,
} from "react-bootstrap-icons";
const Footer = () => {
  const BootsTrapIconSize = 30;
  const currentColor = "grey";
  return (
    <div className="footer">
      <div className="footer-item">example@gmail.com</div>
      <div className="footer-item phone">
        <div>+380 96 771 96 77</div>
        <div>+380 97 222 58 42</div>
        <div>+380 98 333 83 21</div>
      </div>
      <div className="footer-item">
        <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
          <Youtube size={BootsTrapIconSize} color="currentColor" />
        </a>
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
          <Instagram size={BootsTrapIconSize} color="currentColor" />
        </a>
        <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
          <Facebook size={BootsTrapIconSize} color="currentColor" />
        </a>
      </div>
      <div className="footer-item adress">
        <div>Work time: 08:00-17:00</div>
        <div>City street house №</div>
      </div>
    </div>
  );
};

export default Footer;
