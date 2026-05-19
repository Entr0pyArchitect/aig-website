import { json, readJson, requireAdmin, type Env } from "../../../types";

/*
  Internal/admin checkout ticket status control.

  This endpoint is intentionally admin-only. It updates checkout ticket status
  and keeps the linked payment record aligned where possible.
*/

type TicketStatus = "PENDING" | "PROCESSING" | "DENIED" | "APPROVED";
type PaymentStatus = "pending" | "submitted" | "validated" | "failed";

type StatusUpdateBody = {
  ticket_id?: string;
  ticket_number?: string;
  status?: TicketStatus;
  denial_reason?: string;
  admin_note?: string;
};

type ExistingTicket = {
  id: string;
  ticket_number: string;
  payment_record_id: string | null;
  status: TicketStatus;
};

const allowedStatuses = new Set<TicketStatus>(["PENDING", "PROCESSING", "DENIED", "APPROVED"]);

function paymentStatusForTicket(status: TicketStatus): PaymentStatus {
  if (status === "APPROVED") return "validated";
  if (status === "DENIED") return "failed";
  if (status === "PROCESSING") return "submitted";
  return "pending";
}

function clean(value: unknown) {
  return String(value || "").trim();
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.DB) {
    return json({ ok: false, error: "Database unavailable." }, { status: 503 });
  }

  const body = await readJson<StatusUpdateBody>(request);
  const status = clean(body.status).toUpperCase() as TicketStatus;
  const ticketId = clean(body.ticket_id);
  const ticketNumber = clean(body.ticket_number);
  const denialReason = clean(body.denial_reason);
  const adminNote = clean(body.admin_note);

  if (!allowedStatuses.has(status)) {
    return json({ ok: false, error: "Invalid ticket status." }, { status: 400 });
  }

  if (!ticketId && !ticketNumber) {
    return json({ ok: false, error: "ticket_id or ticket_number is required." }, { status: 400 });
  }

  if (status === "DENIED" && !denialReason) {
    return json({ ok: false, error: "denial_reason is required when denying a ticket." }, { status: 400 });
  }

  const ticket = ticketId
    ? await env.DB.prepare(
        `SELECT id, ticket_number, payment_record_id, status
         FROM checkout_tickets
         WHERE id = ?`
      ).bind(ticketId).first<ExistingTicket>()
    : await env.DB.prepare(
        `SELECT id, ticket_number, payment_record_id, status
         FROM checkout_tickets
         WHERE ticket_number = ?`
      ).bind(ticketNumber).first<ExistingTicket>();

  if (!ticket) {
    return json({ ok: false, error: "Ticket not found." }, { status: 404 });
  }

  const reasonForDb = status === "DENIED" ? denialReason : null;
  const notePrefix = adminNote ? `Admin note: ${adminNote}` : "";
  const paymentStatus = paymentStatusForTicket(status);

  await env.DB.prepare(
    `UPDATE checkout_tickets
     SET status = ?,
         denial_reason = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).bind(status, reasonForDb, ticket.id).run();

  if (ticket.payment_record_id) {
    await env.DB.prepare(
      `UPDATE payment_records
       SET status = ?,
           notes = CASE
             WHEN ? = '' THEN notes
             WHEN notes IS NULL OR notes = '' THEN ?
             ELSE notes || char(10) || ?
           END,
           updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      paymentStatus,
      notePrefix,
      notePrefix,
      notePrefix,
      ticket.payment_record_id
    ).run();
  }

  return json({
    ok: true,
    data: {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      previous_status: ticket.status,
      status,
      payment_record_id: ticket.payment_record_id,
      payment_status: ticket.payment_record_id ? paymentStatus : null,
      denial_reason: reasonForDb,
      updated_at: new Date().toISOString()
    }
  });
};
