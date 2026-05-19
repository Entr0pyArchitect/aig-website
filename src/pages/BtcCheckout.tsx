import { Checkout } from "./Checkout";

/*
  Legacy BTC checkout route.
  The finished checkout system now handles BTC, PayPal, card roadmap options,
  Apple Pay roadmap, and Cash App roadmap from one unified payment UI.

  Keeping this file prevents old /checkout/btc links from breaking.
*/
export function BtcCheckout() {
  return <Checkout />;
}
