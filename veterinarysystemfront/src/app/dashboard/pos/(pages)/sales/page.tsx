import { redirect } from "next/navigation";

export default function PosIndexPage() {
  redirect("/dashboard/pos/new");
}
