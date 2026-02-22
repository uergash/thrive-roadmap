export type FeedbackSource = "SLACK" | "INTERVIEW" | "SUPPORT" | "SALES" | "OTHER"
export type FeedbackWorkflowStatus = "NOT_STARTED" | "TRIAGED" | "IN_PROGRESS" | "ADDRESSED"
export type ExternalFeedbackSource = "MANUAL" | "NOTION" | "SLACK"

export interface FeedbackTheme {
  id: string
  name: string
  description: string | null
  order: number
}

export interface LinkedRoadmapItem {
  itemId: string
  item: {
    id: string
    name: string
    sectionId: string
  }
}

export interface FeedbackComment {
  id: string
  feedbackId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    email: string
  }
}

export interface FeedbackEntry {
  id: string
  title: string
  summary: string
  externalSource: ExternalFeedbackSource
  externalId: string | null
  rawSourceUrl?: string | null
  lastSyncedAt?: string | null
  submittedBy: string | null
  source: FeedbackSource
  sourceRef: string | null
  customerSegment: string | null
  isBeingAddressed: boolean
  workflowStatus: FeedbackWorkflowStatus
  jiraUrl: string | null
  urgency: number
  receivedAt: string
  published: boolean
  theme: FeedbackTheme | null
  roadmapLinks: LinkedRoadmapItem[]
  comments: FeedbackComment[]
  commentCount?: number
  voteScore?: number
  userVote?: -1 | 0 | 1
}

export type ConceptStage = "EXPLORING" | "VALIDATING" | "PLANNED"
export type ConceptArtifactType = "MOCKUP" | "PROTOTYPE" | "DOC"

export interface Concept {
  id: string
  title: string
  summary: string
  problem: string
  howItWorks: string
  whyValuable: string
  validationPlan: string
  hypothesis: string
  stage: ConceptStage
  artifactType: ConceptArtifactType
  artifactUrl: string
  artifactLabel: string | null
  owner: string | null
  decisionDate: string | null
  published: boolean
  roadmapLinks: LinkedRoadmapItem[]
}
