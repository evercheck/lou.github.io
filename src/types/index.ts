// Azure DevOps API Types
export interface TestRun {
  id: number
  name: string
  state: string
  createdDate: string
  completedDate?: string
  passedTests?: number
  totalTests?: number
}

export interface TestCase {
  id: number
  title: string
  testCaseId: string
  priority: number
  state: string
  automatedTestName?: string
  workItemId?: string
  testCaseRevision?: number
  lastUpdatedBy?: string
  lastUpdatedDate?: string
  testPlanId?: string
  testSuiteId?: string
  configurationId?: string
  // Additional fields from Azure DevOps API
  assignedTo?: string
  automationStatus?: string
  order?: number
}

export interface TestPlan {
  id: number
  name: string
  description?: string
  startDate?: string
  endDate?: string
  state: string
  areaPath?: string
  iteration?: string
}

export interface TestSuite {
  id: number
  name: string
  testPlanId: number
  parentSuiteId?: number
  parentSuite?: {
    id: number
    name: string
  }
  testCaseCount?: number
  state: string
  hasChildren?: boolean
  suiteType?: string
  inheritDefaultConfigurations?: boolean
  revision?: number
  lastUpdatedDate?: string
}

export interface TestCaseResult {
  id: number
  testCaseTitle: string
  testCaseId: string
  outcome: string
  state: string
  priority: number
  startedDate: string
  completedDate: string
  durationInMs: string
  runBy: string
  owner: string
  testPlanId: string
  configurationId: string
  automatedTestName: string
  testCaseReferenceId: string
  comment: string
  errorMessage?: string
  stackTrace?: string
  attachments?: any[]
  workItemId?: string
  testCaseRevision?: number
  lastUpdatedBy?: string
  lastUpdatedDate?: string
}

export interface TestCaseDetail {
  id: number
  testCaseTitle: string
  testCaseId: string
  outcome: string
  state: string
  priority: number
  startedDate: string
  completedDate: string
  durationInMs: string
  runBy: string
  owner: string
  testPlanId: string
  configurationId: string
  automatedTestName: string
  testCaseReferenceId: string
  comment: string
  errorMessage?: string
  stackTrace?: string
  attachments?: any[]
  workItemId?: string
  testCaseRevision?: number
  lastUpdatedBy?: string
  lastUpdatedDate?: string
}

// Test Case Attachments Types
export interface TestCaseAttachment {
  id: number
  fileName: string
  comment: string
  size: number
  url: string
  createdDate: string
}

export interface TestCaseAttachmentsResponse {
  count: number
  value: TestCaseAttachment[]
}

// UI State Types
export interface NotificationState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

export interface DeleteDialogState {
  open: boolean
  testRunId: number | null
  testRunName: string
}

export interface FilterState {
  state: string
  name: string
}

// API Response Types
export interface ApiResponse<T> {
  value: T[]
  count: number
}

export interface TestRunApiResponse extends ApiResponse<TestRun> {}
export interface TestCaseApiResponse extends ApiResponse<TestCaseResult> {}

// Configuration Types
export interface AppConfig {
  organization: string
  project: string
  apiVersion: string
}

// Component Props Types
export interface TestRunListProps {
  organization: string
  project: string
  onTestRunSelect: (runId: number) => void
}

export interface TestRunDetailsProps {
  testRunId: number
  debugMode: boolean
}

export interface ApiTestProps {
  organization?: string
  project?: string
} 