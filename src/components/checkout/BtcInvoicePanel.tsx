import type { BtcInvoice } from "../../lib/types";
import { formatBtc, formatMoney } from "../../lib/format";

/*
  Reusable BTC invoice panel.
  This displays data only and does not interact with wallet secrets.
*/
export function BtcInvoicePanel({ invoice }: { invoice: BtcInvoice }) {
  const btcValue = invoice.btc_amount ?? invoice.btc_estimate;

  return (
    <section className="invoice-box">
      <h3>BTC Invoice</h3>

      <div className="invoice-line">
        <strong>Order ID:</strong>
        <span>{invoice.order_id}</span>
      </div>

      <div className="invoice-line">
        <strong>Total:</strong>
        <span>{formatMoney(invoice.total_cents)}</span>
      </div>

      <div className="invoice-line">
        <strong>BTC:</strong>
        <span>{formatBtc(btcValue)}</span>
      </div>

      <div className="invoice-line stacked">
        <strong>Receive Address:</strong>
        <code>{invoice.btc_address}</code>
      </div>

      <div className="invoice-line stacked">
        <strong>Instructions:</strong>
        <ul>
          {invoice.instructions.map((line: string) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
