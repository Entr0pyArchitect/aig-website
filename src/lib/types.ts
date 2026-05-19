/*
  Shared TypeScript types for frontend data and backend API responses.
*/

export type ProductType = "hardware" | "software" | "service" | "subscription";
export type PricingModel = "fixed" | "quote" | "tba";
export type ProductStatus = "available" | "quoted" | "tba" | "pilot";

export type ProductCategory =
  | "Embedded systems"
  | "Industrial equipment"
  | "Manufacturing equipment"
  | "Software solutions"
  | "Cybersecurity solutions";

export type Product = {
  id: number;
  productCode?: string;
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  priceCents: number;
  priceLabel?: string;
  pricingModel?: PricingModel;
  type: ProductType;
  status: ProductStatus | string;
  categories: string[];
  quoteCta?: string;
  quotePrompt?: string;
  complianceNote?: string;
  features: string[];
  price_cents?: number;
  price_label?: string;
  pricing_model?: PricingModel;
  product_type?: ProductType;
  inventory_count?: number;
  image_url?: string | null;
  popularity?: ProductPopularity;
};

export type ProductPopularity = {
  product_id: number;
  product_code?: string | null;
  product_name?: string | null;
  approved_count: number;
  approved_quantity: number;
  request_count: number;
  popularity_percent: number;
  label: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  details?: unknown;
};

export type PaymentMethodId = "BTC" | "PAYPAL" | "CARD" | "APPLE_PAY" | "CASH_APP" | "MANUAL";
export type TicketStatus = "PENDING" | "PROCESSING" | "DENIED" | "APPROVED";

export type PaymentMethodOption = {
  id: PaymentMethodId;
  label: string;
  enabled: boolean;
  processor: string;
  status: string;
  note: string;
};

export type CheckoutItemPayload = {
  product_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit_price_cents?: number;
  product_code?: string;
};

export type CheckoutTicket = {
  id: string;
  ticket_id?: string;
  ticket_number: string;
  status: TicketStatus;
  payment_method: PaymentMethodId;
  amount_cents: number;
  currency: string;
  order_description: string;
};

export type BtcPaymentInvoice = {
  id: string;
  payment_id: string;
  ticket_id: string;
  ticket_number: string;
  payment_method: "BTC";
  status: TicketStatus;
  amount_cents: number;
  currency: "USD";
  btc_address: string;
  network: string;
  confirmations_required: number;
  order_description: string;
  instructions: string[];
};

export type PayPalOrderResult = {
  payment_id: string;
  ticket_id: string;
  ticket_number: string;
  paypal_order_id: string;
  approval_url: string | null;
  status: string;
  ticket_status: TicketStatus;
  amount_cents: number;
  currency: "USD";
  links: Array<{ href: string; rel: string; method: string }>;
};

export type QuoteRequestPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
  product_slug?: string;
  product_name?: string;
};

export type BtcInvoice = {
  order_id: string;
  invoice_id: string;
  payment_method: "BTC" | string;
  status: string;
  total_cents: number;
  currency: "USD" | string;
  btc_address: string;
  btc_estimate?: number | string | null;
  btc_amount?: number | string | null;
  network: string;
  confirmations_required: number;
  instructions: string[];
};
