import { json, type Env } from "../../types";

/*
  Public payment method discovery.
  This lets the frontend show what is configured without exposing secrets.
*/
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json({
    ok: true,
    data: {
      btc: {
        enabled: Boolean(env.BTC_RECEIVE_ADDRESS),
        network: env.BTC_NETWORK || "Bitcoin mainnet",
        confirmations_required: Number(env.BTC_CONFIRMATIONS_REQUIRED || "1")
      },
      paypal: {
        enabled: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
        environment: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) ? (env.PAYPAL_ENVIRONMENT || "live") : "unavailable"
      }
    }
  });
};
