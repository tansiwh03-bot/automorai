import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Force dark mode
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);