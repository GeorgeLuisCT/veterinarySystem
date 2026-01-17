import { ComponentType } from "react"

/** Descriptor de acción genérica */
export type HeaderAction = {
  /** Identificador único: "search", "filter", "analytics", "export", etc. */
  key: string
  /** Icono (ej. Search de lucide-react): pásalo como componente, no como <Search/> */
  icon: ComponentType<{ className?: string }>
  /** Texto para tooltip/menú. Opcional en desktop, útil en móvil. */
  label?: string
  /** Tooltip en desktop */
  tooltip?: string
  /** Si deseas manejar el click directamente aquí; si no, se llamará onAction(key) */
  onClick?: () => void
  /** Mostrar en desktop (botones icon). Default: true */
  desktop?: boolean
  /** Mostrar dentro del menú móvil. Default: true */
  mobileMenu?: boolean
  /** Deshabilitar acción (UI) */
  disabled?: boolean
  /** title accesible (aria-label), si quieres sobreescribir */
  ariaLabel?: string
}
