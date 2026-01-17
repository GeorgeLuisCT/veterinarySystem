"use client";

import { PaymentMethodLabels, SalesDocumentTypeLabels } from "../_types/sale-enums";
import { SaleDetailResponse, SaleResponse } from "../_types/sale-response";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatCurrency = (value?: number | null) => currencyFormatter.format(value ?? 0);
const formatDateTime = (value?: string) => (value ? dateTimeFormatter.format(new Date(value)) : "");

const escapeHtml = (text?: string | number | null) =>
  `${text ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildItemRows = (details: SaleDetailResponse[]) =>
  details
    .map(
      (detail) => `
        <div class="ticket__item">
          <div class="ticket__item-title">
            <span>${escapeHtml(detail.description || "Item")}</span>
            <span>${formatCurrency(detail.lineSubtotal)}</span>
          </div>
          <p class="ticket__muted">
            ${detail.quantity.toFixed(2)} x ${formatCurrency(detail.unitPrice)}
          </p>
        </div>
      `
    )
    .join("");

const buildPaymentRows = (sale: SaleResponse) =>
  sale.payments
    .map(
      (payment) => `
        <div class="ticket__row">
          <span>${escapeHtml(PaymentMethodLabels[payment.method])}</span>
          <span>${formatCurrency(payment.amount)}</span>
        </div>
      `
    )
    .join("");

const buildTicketHtml = (sale: SaleResponse) => {
  const docLabel = SalesDocumentTypeLabels[sale.documentType] ?? sale.documentType;
  const paymentRows = sale.payments.length ? buildPaymentRows(sale) : "";
  const detailsSection =
    sale.details.length > 0
      ? buildItemRows(sale.details)
      : `<p class="ticket__muted">Sin ítems registrados.</p>`;

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Comprobante Venta #${sale.id}</title>
        <style>
          * {
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 24px 0;
            background: #f4f4f5;
            color: #0f172a;
          }
          .ticket {
            width: 320px;
            margin: 0 auto;
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
          }
          .ticket__header {
            text-align: center;
            margin-bottom: 16px;
          }
          .ticket__header h1 {
            font-size: 1.1rem;
            margin: 0 0 4px;
          }
          .ticket__header p {
            margin: 2px 0;
            font-size: 0.8rem;
            color: #475569;
          }
          .ticket__section {
            padding: 12px 0;
            border-top: 1px dashed #e2e8f0;
          }
          .ticket__section:first-of-type {
            border-top: none;
          }
          .ticket__row {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            margin-bottom: 4px;
          }
          .ticket__muted {
            color: #64748b;
            font-size: 0.75rem;
            margin: 0;
          }
          .ticket__item {
            padding: 6px 0;
          }
          .ticket__item-title {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .ticket__totals .ticket__row span:last-child {
            font-weight: 600;
          }
          .ticket__totals .ticket__row:last-child span:last-child {
            font-size: 1rem;
            color: #111827;
          }
          .ticket__footer {
            text-align: center;
            font-size: 0.75rem;
            color: #94a3b8;
            margin-top: 8px;
          }
          @media print {
            body {
              background: #fff;
            }
            .ticket {
              box-shadow: none;
              width: 72mm;
              margin: 0;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket__header">
            <h1>${escapeHtml(sale.branchName || "VeterinarySystem")}</h1>
            <p>${escapeHtml(docLabel)} ${escapeHtml(sale.documentNumber || "SN")}</p>
            <p>Venta #${sale.id}</p>
            <p>${escapeHtml(formatDateTime(sale.createdAt))}</p>
          </div>

          <div class="ticket__section">
            <div class="ticket__row">
              <span>Cliente</span>
              <span>${escapeHtml(sale.customerName || "Consumidor final")}</span>
            </div>
            <div class="ticket__row">
              <span>Vendedor</span>
              <span>${escapeHtml(sale.sellerName || "-")}</span>
            </div>
          </div>

          <div class="ticket__section">
            <p class="ticket__muted" style="text-transform: uppercase; letter-spacing: 0.05em;">Detalle</p>
            ${detailsSection}
          </div>

          <div class="ticket__section ticket__totals">
            <div class="ticket__row">
              <span>Subtotal</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            <div class="ticket__row">
              <span>IGV</span>
              <span>${formatCurrency(sale.taxTotal)}</span>
            </div>
            <div class="ticket__row">
              <span>Total</span>
              <span>${formatCurrency(sale.grandTotal)}</span>
            </div>
          </div>

          ${
            paymentRows
              ? `
          <div class="ticket__section">
            <p class="ticket__muted" style="text-transform: uppercase; letter-spacing: 0.05em;">Pagos</p>
            ${paymentRows}
          </div>
          `
              : ""
          }

          <div class="ticket__footer">
            Gracias por su compra
          </div>
        </div>
      </body>
    </html>
  `;
};

export const printSaleTicket = (sale: SaleResponse): boolean => {
  if (typeof window === "undefined") return false;

  const ticketHtml = buildTicketHtml(sale);
  const printWindow = window.open("about:blank", "_blank", "width=480,height=640");

  if (!printWindow) {
    return false;
  }

  printWindow.document.write(ticketHtml);
  printWindow.document.close();
  printWindow.focus();

  const timer = setInterval(() => {
    if (printWindow.document.readyState === "complete") {
      clearInterval(timer);
      try {
        printWindow.print();
      } catch {
        // Ignore print failures.
      }
      printWindow.close();
    }
  }, 150);

  return true;
};
