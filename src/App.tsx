import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/layout/Shell";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Services } from "./pages/Services";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Resources } from "./pages/Resources";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { BtcCheckout } from "./pages/BtcCheckout";
import { PaymentCenter } from "./pages/PaymentCenter";
import { Policies } from "./pages/Policies";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payments" element={<PaymentCenter />} />
        <Route path="/checkout/btc" element={<BtcCheckout />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/btc" element={<Navigate to="/checkout" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}
