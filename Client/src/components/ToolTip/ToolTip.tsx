import { useState, type ReactNode } from "react";
import "./Tooltip.css";

// Описываем, что принимает компонент
interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <div className="tooltip-tip">{text}</div>}
    </div>
  );
}
export default Tooltip;
