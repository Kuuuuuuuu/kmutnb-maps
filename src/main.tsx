import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";

createRoot(document.getElementById("app")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
