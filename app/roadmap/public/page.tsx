import { redirect } from "next/navigation"

export default function LegacyPublicRoadmapPage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const year = searchParams?.year
  redirect(year ? `/roadmap?year=${year}` : "/roadmap")
}
