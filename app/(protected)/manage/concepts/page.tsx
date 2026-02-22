import { redirect } from "next/navigation"

export default function LegacyManageConceptsPage() {
  redirect("/concepts/edit")
}
