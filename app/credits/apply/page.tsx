import { redirect } from "next/navigation";

/** The previous duplicate intake is retired; use the short customer entry. */
export default function CreditApplicationPage() {
  redirect("/solicitar");
}
