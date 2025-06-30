import type { AppConfig } from '../types'

// Default configuration
export const defaultConfig: AppConfig = {
  organization: "",
  project: "",
  apiVersion: "7.1"
}

// Environment-based configuration
export const getConfig = (): AppConfig => {
  return {
    organization: import.meta.env.VITE_ORGANIZATION || defaultConfig.organization,
    project: import.meta.env.VITE_PROJECT || defaultConfig.project,
    apiVersion: import.meta.env.VITE_API_VERSION || defaultConfig.apiVersion
  }
}

// API endpoints
export const getApiEndpoints = (config: AppConfig) => ({
  testRuns: `https://dev.azure.com/${config.organization}/${config.project}/_apis/test/runs?api-version=${config.apiVersion}`,
  testResults: (testRunId: string | number) => 
    `https://dev.azure.com/${config.organization}/${config.project}/_apis/test/Runs/${testRunId}/results?api-version=${config.apiVersion}`,
  testCaseDetail: (testRunId: string | number, testCaseId: string | number) =>
    `https://dev.azure.com/${config.organization}/${config.project}/_apis/test/Runs/${testRunId}/results/${testCaseId}?api-version=${config.apiVersion}`,
  deleteTestRun: (testRunId: string | number) =>
    `https://dev.azure.com/${config.organization}/${config.project}/_apis/test/runs/${testRunId}?api-version=${config.apiVersion}`,
  testPlans: `https://dev.azure.com/${config.organization}/${config.project}/_apis/testplan/Plans?api-version=${config.apiVersion}`,
  testSuites: (planId: string | number) =>
    `https://dev.azure.com/${config.organization}/${config.project}/_apis/testplan/Plans/${planId}/suites?api-version=${config.apiVersion}`,
  testCases: (planId: string | number, suiteId: string | number, params: Record<string, any> = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        queryParams.append(key, value.toString())
      }
    })
    const queryString = queryParams.toString()
    return `https://dev.azure.com/${config.organization}/${config.project}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=${config.apiVersion}${queryString ? `&${queryString}` : ''}`
  }
})

// Validation constants
export const VALID_OUTCOMES = ['Passed', 'Failed', 'Blocked', 'NotApplicable', 'NotExecuted'] as const
export const VALID_STATES = ['Completed', 'InProgress', 'Aborted', 'NotStarted'] as const

// UI constants
export const UI_CONSTANTS = {
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  NOTIFICATION_DURATION: 6000, // 6 seconds
  TABLE_HEIGHT: 800,
  GRID_COLUMNS: {
    TEST_RUNS: '80px 1fr 120px 160px 160px 100px 120px',
    TEST_CASES: '3fr 1fr 1fr 0.5fr 1fr 1fr 0.5fr'
  }
} as const 