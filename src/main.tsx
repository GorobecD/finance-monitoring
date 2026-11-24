import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/unbounded/400.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "./styles.css";
import App from "./App";
import { StoreProvider } from "./store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);
