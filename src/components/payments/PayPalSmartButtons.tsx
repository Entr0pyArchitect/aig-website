import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { TicketStatus } from "../../lib/types";

/*
  PayPal Smart Buttons integration.

  Stability notes:
  - The PayPal iframe must not be closed just because checkout status text changes.
  - onStatus/onApproved are kept in refs so React re-renders do not tear down the PayPal iframe.
  - The component only re-renders PayPal buttons when the order ID changes.
  - Hosted PayPal checkout remains available as the reliable fallback path.
*/

type PayPalClientConfig = {
  client_id: string;
  currency: string;
  intent: string;
  components: string;
  enable_funding?: string;
};

type PayPalSmartButtonsProps = {
  orderId: string;
  ticketNumber: string;
  onStatus: (message: string) => void;
  onApproved: (status: TicketStatus) => void;
};

type PayPalButtonActions = {
  restart: () => void;
};

type PayPalApproveData = {
  orderID: string;
};

type PayPalButtonsInstance = {
  render: (selector: string) => Promise<void>;
  close?: () => void;
  isEligible?: () => boolean;
};

type PayPalButtonsConfig = {
  style?: Record<string, string>;
  createOrder: () => string;
  onApprove: (data: PayPalApproveData, actions: PayPalButtonActions) => Promise<void>;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => PayPalButtonsInstance;
    };
  }
}

function sdkUrl(config: PayPalClientConfig) {
  const params = new URLSearchParams({
    "client-id": config.client_id,
    currency: config.currency || "USD",
    intent: config.intent || "capture",
    components: config.components || "buttons",
    commit: "true"
  });

  /*
    Leave funding eligibility mostly to PayPal. If the backend supplies optional
    funding hints, pass them through, but do not depend on them for rendering.
  */
  if (config.enable_funding) {
    params.set("enable-funding", config.enable_funding);
  }

  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

async function loadPayPalSdk(config: PayPalClientConfig) {
  if (window.paypal?.Buttons) return;

  const nextSrc = sdkUrl(config);
  const existing = document.querySelector<HTMLScriptElement>("script[data-aig-paypal-sdk='true']");

  if (existing) {
    if (existing.src === nextSrc && window.paypal?.Buttons) return;

    await new Promise<void>((resolve, reject) => {
      if (window.paypal?.Buttons) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load.")), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = nextSrc;
    script.async = true;
    script.dataset.aigPaypalSdk = "true";
    script.dataset.sdkIntegrationSource = "aig-website";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("PayPal SDK failed to load.")), { once: true });
    document.body.appendChild(script);
  });
}

export function PayPalSmartButtons({ orderId, ticketNumber, onStatus, onApproved }: PayPalSmartButtonsProps) {
  const containerId = `paypal-buttons-${orderId}`;
  const renderedOrder = useRef<string | null>(null);
  const buttonsRef = useRef<PayPalButtonsInstance | null>(null);
  const onStatusRef = useRef(onStatus);
  const onApprovedRef = useRef(onApproved);
  const [ready, setReady] = useState(false);
  const [renderIssue, setRenderIssue] = useState("");

  useEffect(() => {
    onStatusRef.current = onStatus;
    onApprovedRef.current = onApproved;
  }, [onStatus, onApproved]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!orderId) return;

      /*
        If the same order is already rendered and React merely re-rendered the
        parent, leave the PayPal iframe alone. This prevents the split-second
        display followed by disappearing buttons.
      */
      if (renderedOrder.current === orderId && buttonsRef.current) return;

      setReady(false);
      setRenderIssue("");
      onStatusRef.current("Loading secure PayPal checkout buttons...");

      const configResponse = await fetch("/api/payments/paypal/client-config");
      const configJson = await configResponse.json() as { ok: boolean; data?: PayPalClientConfig; error?: string };

      if (!configJson.ok || !configJson.data) {
        throw new Error(configJson.error || "Unable to load PayPal client configuration.");
      }

      await loadPayPalSdk(configJson.data);

      if (!window.paypal?.Buttons) {
        throw new Error("PayPal SDK did not initialize.");
      }

      if (cancelled) return;

      const target = document.getElementById(containerId);
      if (!target) {
        throw new Error("PayPal button container is not available.");
      }

      /*
        Only clear the container immediately before a real render for a new
        order. Do not clear it during unrelated checkout state changes.
      */
      target.innerHTML = "";

      const buttons = window.paypal.Buttons({
        style: {
          shape: "rect",
          layout: "vertical",
          color: "gold",
          label: "paypal"
        },
        createOrder() {
          onStatusRef.current(`PayPal order ready for ticket ${ticketNumber}.`);
          return orderId;
        },
        async onApprove(data, actions) {
          onStatusRef.current("PayPal approved by buyer. Capturing payment...");

          const result = await api.capturePayPalOrder(data.orderID);

          if (!result.ok) {
            const recoverable = String(result.error || "").includes("INSTRUMENT_DECLINED");
            if (recoverable) {
              onStatusRef.current("Payment instrument declined. Restarting PayPal approval.");
              return actions.restart();
            }

            onStatusRef.current(result.error || "PayPal capture denied or failed.");
            return;
          }

          const approvedStatus = (result.data?.status || "APPROVED") as TicketStatus;
          onApprovedRef.current(approvedStatus);
          onStatusRef.current(`PayPal capture complete. Ticket status: ${approvedStatus}.`);
        },
        onCancel() {
          onStatusRef.current("PayPal checkout cancelled by buyer. Ticket remains PROCESSING until completed or denied.");
        },
        onError(error) {
          console.error("PayPal button error", error);
          onStatusRef.current("PayPal checkout could not be completed. Use hosted PayPal checkout or try again.");
          setRenderIssue("PayPal reported a checkout rendering or payment error in this browser.");
        }
      });

      if (typeof buttons.isEligible === "function" && !buttons.isEligible()) {
        setReady(true);
        setRenderIssue("Embedded PayPal buttons are not eligible in this browser/session. Use hosted PayPal checkout.");
        onStatusRef.current("Embedded PayPal buttons are not eligible in this browser/session. Use hosted PayPal checkout.");
        return;
      }

      buttonsRef.current = buttons;
      await buttons.render(`#${containerId}`);
      renderedOrder.current = orderId;

      window.setTimeout(() => {
        if (cancelled) return;

        const renderedTarget = document.getElementById(containerId);
        const hasFrame = Boolean(renderedTarget?.querySelector("iframe"));
        const hasVisibleContent = Boolean(
          renderedTarget &&
          renderedTarget.getBoundingClientRect().height > 24 &&
          renderedTarget.children.length > 0
        );

        setReady(true);

        if (hasFrame || hasVisibleContent) {
          onStatusRef.current("PayPal buttons ready.");
          return;
        }

        setRenderIssue("Embedded PayPal buttons did not stay visible in this browser. Use hosted PayPal checkout.");
        onStatusRef.current("Embedded PayPal buttons did not stay visible in this browser. Use hosted PayPal checkout.");
      }, 1200);
    }

    setup().catch((error) => {
      console.error(error);
      setReady(true);
      setRenderIssue(error instanceof Error ? error.message : "PayPal buttons failed to load.");
      onStatusRef.current(error instanceof Error ? error.message : "PayPal buttons failed to load.");
    });

    return () => {
      cancelled = true;

      /*
        Cleanup runs on real unmount/order replacement. It should not run on
        plain status updates because this effect only depends on orderId/ticketNumber.
      */
      buttonsRef.current?.close?.();
      buttonsRef.current = null;
      renderedOrder.current = null;
    };
  }, [containerId, orderId, ticketNumber]);

  return (
    <div className="paypal-smart-buttons" data-paypal-order={orderId}>
      <div id={containerId} className="paypal-button-container" />
      {!ready && <p className="small-muted">Preparing PayPal, Pay Later, Venmo, and card options...</p>}
      {renderIssue && <p className="paypal-render-warning">{renderIssue}</p>}
    </div>
  );
}
