/**
 * Tonos semánticos de estado. Única fuente de verdad para colorear
 * estados (badges, acentos de tarjetas). No usar colores a mano.
 */
export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

/** Acento lateral de tarjeta (usar junto a `border border-l-4`). */
export const toneBorderLeft: Record<StatusTone, string> = {
  success: "border-l-success",
  warning: "border-l-warning",
  info: "border-l-info",
  danger: "border-l-destructive",
  neutral: "border-l-muted-foreground/40",
};

/** Punto de color para leyendas/listas. */
export const toneDot: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground/50",
};
