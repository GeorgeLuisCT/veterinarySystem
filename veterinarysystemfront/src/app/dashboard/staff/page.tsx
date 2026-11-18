import { redirect } from "next/navigation";

/** Se movió a Configuración; la ruta se mantiene para enlaces y marcadores antiguos. */
export default function MovedPage() {
  redirect("/dashboard/settings/staff");
}
