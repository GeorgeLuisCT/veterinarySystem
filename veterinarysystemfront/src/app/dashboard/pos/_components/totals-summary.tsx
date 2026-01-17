"use client";

interface TotalsSummaryProps {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
}

export default function TotalsSummary({ subtotal, taxTotal, grandTotal, paidAmount }: TotalsSummaryProps) {
  const pending = Math.max(grandTotal - paidAmount, 0);
  return (
    <div className="rounded-md border p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>S/ {subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Impuestos</span>
        <span>S/ {taxTotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>S/ {grandTotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Pagado</span>
        <span>S/ {paidAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Pendiente</span>
        <span>S/ {pending.toFixed(2)}</span>
      </div>
    </div>
  );
}
