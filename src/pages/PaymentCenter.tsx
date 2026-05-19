import { Checkout } from "./Checkout";

/*
  Backward-compatible alias.
  /payments and /checkout now point at the finished checkout/payment UI.
*/
export function PaymentCenter() {
  return <Checkout />;
}
