/*
  Cloudflare Pages Function shared types/helpers.
  Keep secrets in Cloudflare variables/secrets or .dev.vars only.
*/

export type Env = {
  DB?: D1Database;
  PUBLIC_SITE_NAME?: string;
  PUBLIC_MOTTO?: string;

  BTC_NETWORK?: string;
  BTC_CONFIRMATIONS_REQUIRED?: string;
  BTC_RECEIVE_ADDRESS?: string;

  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENVIRONMENT?: "sandbox" | "live" | string;

  CASH_APP_PAYMENT_LINK?: string;
  PUBLIC_CASH_APP_PAYMENT_LINK?: string;
  CASH_APP_HANDLE?: string;

  ADMIN_SECRET?: string;
};

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...(init.headers || {})
    }
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  const raw = await request.text();

  if (raw.length > 64_000) {
    throw new Error("Request body is too large.");
  }

  return JSON.parse(raw || "{}") as T;
}

function timingSafeStringEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const max = Math.max(left.length, right.length, 1);
  let diff = left.length ^ right.length;

  for (let index = 0; index < max; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }

  return diff === 0;
}

export function requireAdmin(request: Request, env: Env): Response | null {
  if (!env.ADMIN_SECRET) {
    return json({ ok: false, error: "Admin service unavailable." }, { status: 503 });
  }

  const supplied = request.headers.get("x-admin-secret") || "";
  if (!timingSafeStringEqual(supplied, env.ADMIN_SECRET)) {
    return json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  return null;
}


export function cleanText(value: unknown, maxLength = 500) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(value: unknown) {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function normalizeTicketItems(items: unknown, maxItems = 25): TicketItemPayload[] {
  if (!Array.isArray(items)) return [];

  return items.slice(0, maxItems).map((item: any) => ({
    product_id: Number(item?.product_id || 0) || undefined,
    product_code: cleanText(item?.product_code, 40),
    name: cleanText(item?.name, 160) || "Product item",
    description: cleanText(item?.description, 500),
    quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
    unit_price_cents: Math.max(0, Math.min(10_000_000, Number(item?.unit_price_cents || 0)))
  }));
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function makeTicketNumber() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `AIG-${ymd}-${suffix}`;
}

export async function makeSequentialTicketNumber(env: Env) {
  if (!env.DB) return makeTicketNumber();

  try {
    const result = await env.DB.prepare(
      "INSERT INTO ticket_sequence DEFAULT VALUES RETURNING id"
    ).first<{ id: number }>();

    if (result?.id) {
      return `AIG-${String(result.id).padStart(6, "0")}`;
    }
  } catch {
    /*
      If the ticket_sequence table has not been migrated yet, keep checkout alive
      with the older date-based ticket format instead of blocking the customer.
    */
  }

  return makeTicketNumber();
}

export type TicketItemPayload = {
  product_id?: number;
  product_code?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unit_price_cents?: number;
};

export async function recordTicketItems(
  env: Env,
  ticketId: string,
  ticketNumber: string,
  items: TicketItemPayload[]
) {
  if (!env.DB || !items.length) return;

  for (const item of items) {
    const productId = Number(item.product_id || 0) || null;
    const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
    const productCode = item.product_code || (productId ? `P${String(productId).padStart(3, "0")}` : "MANUAL");
    const productName = item.name || "Manual product entry";
    const description = item.description || "";
    const unitPrice = Math.max(0, Number(item.unit_price_cents || 0));

    try {
      await env.DB.prepare(
        `INSERT INTO checkout_ticket_items
          (ticket_id, ticket_number, product_id, product_code, product_name,
           description, quantity, unit_price_cents, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        ticketId,
        ticketNumber,
        productId,
        productCode,
        productName,
        description,
        quantity,
        unitPrice
      ).run();
    } catch {
      /*
        If the checkout_ticket_items table is not migrated yet, continue using
        the existing items_json on checkout_tickets.
      */
    }
  }
}

export function safeAmountCents(value: unknown): number | null {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 0) return null;
  return amount;
}

export function isLikelyBtcTxHash(value: string) {
  return /^[a-fA-F0-9]{64}$/.test(value.trim());
}

export function paypalBaseUrl(env: Env) {
  return env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken(env: Env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are not configured.");
  }

  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);

  const response = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new Error("Unable to obtain PayPal access token.");
  }

  const payload = await response.json() as { access_token: string };
  return payload.access_token;
}
