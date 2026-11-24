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
import "@fontsource/oswald/700.css";
import "@fontsource/exo-2/400.css";
import "@fontsource/exo-2/600.css";
import "@fontsource/exo-2/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/800.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/700-italic.css";
import "@fontsource/pangolin/400.css";
import "@fontsource/rubik-wet-paint/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/900.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/600.css";
import "./styles.css";
import "./themes.css";
import "./themes2.css";
import "./themes3.css";
import App from "./App";
import { StoreProvider } from "./store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);
