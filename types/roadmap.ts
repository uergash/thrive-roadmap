export type UserRole = "VIEWER" | "ADMIN"

export interface RoadmapItem {
  id: string
  name: string
  description: string | null
  status: string
  risk: string | null
  blockerNotes: string | null
  sectionId: string
  order: number
  quarters: Quarter[]
  jiraLinks: JiraLink[]
  dependencies?: ItemDependency[]
  comments?: ItemComment[]
  changeLogs?: ItemChangeLog[]
}

export interface ItemDependency {
  id: string
  itemId: string
  dependsOnId: string
  dependsOn?: RoadmapItem
}

export interface ItemComment {
  id: string
  content: string
  authorId: string
  createdAt: string
}

export interface ItemChangeLog {
  id: string
  changeType: string
  oldValue: string | null
  newValue: string | null
  authorId: string | null
  createdAt: string
}

export interface Section {
  id: string
  name: string
  description: string | null
  order: number
  items: RoadmapItem[]
}

export interface Quarter {
  id: string
  quarter: number
  year: number
  itemId: string
}

export interface JiraLink {
  id: string
  jiraKey: string
  url: string | null
  itemId: string
}

export interface RoadmapColumn {
  id?: string
  name: string
  type: "quarter" | "custom"
  order: number
  quarter?: number
}

export interface Roadmap {
  id: string
  year: number
  published?: boolean
  columns?: RoadmapColumn[]
  sections: Section[]
}
