import { json, type Env } from "../../types";

/*
  Public payment method discovery.
  Keep response customer-facing: no secret names, provider internals, or implementation details.
  Apple Pay is not shown as a separate lane because eligible wallet options may appear through PayPal.
*/
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const paypalEnabled = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
  const btcEnabled = Boolean(env.BTC_RECEIVE_ADDRESS);

  return json({
    ok: true,
    data: [
      {
        id: "BTC",
        label: "Bitcoin",
        enabled: btcEnabled,
        processor: "manual_validation",
        status: btcEnabled ? "ready" : "temporarily_unavailable",
        note: btcEnabled
          ? "Creates a Bitcoin invoice and requires transaction-hash submission plus manual validation."
          : "Bitcoin checkout is temporarily unavailable."
      },
      {
        id: "PAYPAL",
        label: "PayPal",
        enabled: paypalEnabled,
        processor: "secure_provider_checkout",
        status: paypalEnabled ? "ready" : "temporarily_unavailable",
        note: paypalEnabled
          ? "Secure PayPal checkout with buyer approval and payment capture."
          : "PayPal checkout is temporarily unavailable."
      },
      {
        id: "CARD",
        label: "Credit / Debit Card",
        enabled: paypalEnabled,
        processor: "secure_provider_card_checkout",
        status: paypalEnabled ? "ready" : "temporarily_unavailable",
        note: paypalEnabled
          ? "Credit and debit cards are handled through secure PayPal checkout. AIG does not collect card numbers."
          : "Card checkout is temporarily unavailable."
      },
      {
        id: "CASH_APP",
        label: "Cash App",
        enabled: true,
        processor: "manual_validation",
        status: "manual_validation_required",
        note: "Creates a pending Cash App ticket for manual instructions and validation. Do not send payment until AIG confirms the quote and payment reference."
      }
    ]
  });
};
