import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/unbounded/400.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource/russo-one/400.css";
import "@fontsource/lora/400-italic.css";
import "@fontsource/lora/700.css";
import "./styles.css";
import "./themes.css";
import App from "./App";
import { StoreProvider } from "./store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);
