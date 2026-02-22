import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import ConceptsEditorView from "@/components/insights/ConceptsEditorView"

export default async function ConceptsEditPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/concepts")
  }

  return <ConceptsEditorView />
}
