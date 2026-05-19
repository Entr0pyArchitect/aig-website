import { Link } from "react-router-dom";
import { RetroPanel } from "../components/retro/RetroPanel";

export function CheckoutSuccess() {
  return (
    <RetroPanel title="checkout success">
      <h2>Order flow complete.</h2>
      <p>
        For BTC MVP mode, orders remain pending until the transaction is manually verified by AIG.
      </p>
      <Link className="old-btn" to="/products">Return to catalog</Link>
    </RetroPanel>
  );
}
