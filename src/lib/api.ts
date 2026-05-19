import type {
  ApiResult,
  BtcPaymentInvoice,
  CheckoutItemPayload,
  CheckoutTicket,
  PaymentMethodId,
  PaymentMethodOption,
  PayPalOrderResult,
  PricingModel,
  Product,
  ProductPopularity,
  ProductType,
  QuoteRequestPayload
} from "./types";

/*
  API helper layer.
*/

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {})
      },
      ...init
    });

    const payload = (await response.json()) as ApiResult<T>;
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown API error"
    };
  }
}

type BackendProduct = {
  id: number;
  product_code?: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  price_label?: string;
  pricing_model?: PricingModel;
  inventory_count?: number;
  product_type: ProductType;
  image_url?: string | null;
  categories?: string;
  quote_prompt?: string;
  compliance_note?: string;
};

function normalizeProduct(product: Product | BackendProduct): Product {
  const frontend = product as Product;
  const backend = product as BackendProduct;

  const priceCents = frontend.priceCents ?? backend.price_cents ?? 0;
  const pricingModel = frontend.pricingModel ?? backend.pricing_model ?? (priceCents === 0 ? "quote" : "fixed");
  const categoryList = Array.isArray(frontend.categories)
    ? frontend.categories
    : backend.categories
      ? backend.categories.split("|").filter(Boolean)
      : [];

  return {
    id: product.id,
    productCode: frontend.productCode ?? backend.product_code ?? "AIG-CATALOG",
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceCents,
    priceLabel: frontend.priceLabel ?? backend.price_label,
    pricingModel,
    type: frontend.type ?? backend.product_type ?? "service",
    status: frontend.status ?? (pricingModel === "tba" ? "tba" : pricingModel === "quote" ? "quoted" : "available"),
    categories: categoryList,
    quoteCta: frontend.quoteCta,
    quotePrompt: frontend.quotePrompt ?? backend.quote_prompt,
    complianceNote: frontend.complianceNote ?? backend.compliance_note,
    features: frontend.features ?? [],
    price_cents: backend.price_cents,
    price_label: backend.price_label,
    pricing_model: backend.pricing_model,
    product_type: backend.product_type,
    inventory_count: backend.inventory_count,
    image_url: backend.image_url
  };
}

export const api = {
  async products(): Promise<ApiResult<Product[]>> {
    const result = await request<Array<Product | BackendProduct>>("/api/products");

    if (!result.ok || !result.data) {
      return { ok: false, error: result.error || "Unable to load products." };
    }

    return { ok: true, data: result.data.map(normalizeProduct) };
  },

  async productMetrics(): Promise<ApiResult<ProductPopularity[]>> {
    return request<ProductPopularity[]>("/api/products/metrics");
  },

  async paymentMethods(): Promise<ApiResult<PaymentMethodOption[]>> {
    return request<PaymentMethodOption[]>("/api/checkout/payment-methods");
  },

  async createBtcInvoice(payload: {
    customer_name: string;
    customer_email: string;
    amount_cents: number;
    items: CheckoutItemPayload[];
    order_description: string;
    notes?: string;
  }): Promise<ApiResult<BtcPaymentInvoice>> {
    return request<BtcPaymentInvoice>("/api/payments/btc/create-invoice", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async submitBtcTransaction(payment_id: string, tx_hash: string): Promise<ApiResult<{ payment_id: string; tx_hash: string; status: string }>> {
    return request("/api/payments/btc/submit-tx", {
      method: "POST",
      body: JSON.stringify({ payment_id, tx_hash })
    });
  },

  async createPayPalOrder(payload: {
    customer_name: string;
    customer_email: string;
    amount_cents: number;
    items: CheckoutItemPayload[];
    order_description: string;
    notes?: string;
  }): Promise<ApiResult<PayPalOrderResult>> {
    return request<PayPalOrderResult>("/api/payments/paypal/create-order", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async capturePayPalOrder(paypal_order_id: string): Promise<ApiResult<{ paypal_order_id: string; paypal_capture_id: string | null; status: string }>> {
    return request("/api/payments/paypal/capture-order", {
      method: "POST",
      body: JSON.stringify({ paypal_order_id })
    });
  },

  async createManualTicket(payload: {
    payment_method: PaymentMethodId;
    customer_name: string;
    customer_email: string;
    amount_cents: number;
    items: CheckoutItemPayload[];
    order_description: string;
  }): Promise<ApiResult<CheckoutTicket>> {
    return request<CheckoutTicket>("/api/payments/other/request", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async sendContactMessage(payload: QuoteRequestPayload): Promise<ApiResult<{ ticket_id: string; quote_request_id?: string }>> {
    return request("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
