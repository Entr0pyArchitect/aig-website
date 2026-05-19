import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CartProvider } from "./components/cart/CartProvider";
import "./styles/retro.css";
import "./styles/finished-checkout.css";
import "./styles/production-checkout.css";
import "./styles/paypal-smart-buttons.css";
import "./styles/aig-retro-polish.css";
import "./styles/aig-payment-visuals.css";
import "./styles/aig-responsive-device-fit.css";
import "./styles/aig-page-header-slimming.css";
import "./styles/aig-checkout-payment-hotfix.css";
import "./styles/aig-final-live-polish.css";
import "./styles/aig-mobile-specific-polish.css";

/*
  Frontend application bootstrap.
  The payment visuals stylesheet is imported last so the site underlay and
  payment icon styling apply cleanly without touching backend behavior.
*/
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
