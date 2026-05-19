import { json, type Env } from "../../../types";

/*
  Public PayPal browser config.

  PAYPAL_CLIENT_ID is intentionally returned to the frontend because the
  PayPal JavaScript SDK requires the client ID in the browser script URL.
  PAYPAL_CLIENT_SECRET is never returned here.
*/
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const clientId = env.PAYPAL_CLIENT_ID;
  const environment = env.PAYPAL_ENVIRONMENT || "live";

  if (!clientId) {
    return json({
      ok: false,
      error: "PayPal checkout is temporarily unavailable."
    }, { status: 503 });
  }

  return json({
    ok: true,
    data: {
      client_id: clientId,
      environment,
      currency: "USD",
      intent: "capture",
      components: "buttons",
      enable_funding: "venmo,paylater,card"
    }
  });
};
