import { Link } from "react-router-dom";
import { RetroPanel } from "../components/retro/RetroPanel";
import { useCart } from "../components/cart/CartProvider";
import { formatMoney, formatProductPrice } from "../lib/format";

/*
  Cart page.
  Quote-priced products can be collected here before the approved payment step.
*/
export function Cart() {
  const { items, totalCents, updateQuantity, removeItem, clearCart } = useCart();
  const hasQuoteItems = items.some((item) => item.product.pricingModel === "quote" || item.product.pricingModel === "tba" || item.product.priceCents === 0);

  return (
    <RetroPanel title="Cart System">
      <div className="section-intro">
        <h1>Cart</h1>
        <p>
          Review selected products, then continue to checkout. Quote-based items require an approved amount
          before payment can be processed.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link className="retro-button" to="/products">Open Catalog</Link>
        </div>
      ) : (
        <>
          <div className="cart-table">
            {items.map((item) => (
              <div className="cart-row" key={item.product.id}>
                <div>
                  <strong>{item.product.name}</strong>
                  <span>{formatProductPrice(item.product)} each</span>
                  <span>{item.product.description}</span>
                </div>

                <label>
                  Qty
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                  />
                </label>

                <strong>
                  {item.product.priceCents > 0 ? formatMoney(item.product.priceCents * item.quantity) : "Quoted"}
                </strong>

                <button className="text-button" type="button" onClick={() => removeItem(item.product.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {hasQuoteItems && (
            <p className="warning-note">
              Quote-based products require final approval before BTC or PayPal payment should be used.
            </p>
          )}

          <div className="cart-summary">
            <strong>Total: {totalCents > 0 ? formatMoney(totalCents) : "Quoted / approved amount required"}</strong>
            <div className="button-row">
              <Link className="retro-button" to="/checkout">Purchase / Payment UI</Link>
              <button className="retro-button secondary" type="button" onClick={clearCart}>
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </RetroPanel>
  );
}
