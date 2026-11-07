import { Badge } from "@/components/ui/badge";

const DAY = 24 * 60 * 60 * 1000;

/** Fecha de vencimiento con estado: vencido (rojo), por vencer ≤ 90 días (ámbar) o normal. */
export function ExpirationBadge({ date }: { date?: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return <span className="text-muted-foreground">—</span>;
  const label = parsed.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const days = Math.floor((parsed.getTime() - Date.now()) / DAY);
  if (days < 0) return <Badge variant="danger">{label} · vencido</Badge>;
  if (days <= 90) return <Badge variant="warning">{label} · {days} d</Badge>;
  return <span className="tabular-nums">{label}</span>;
}
