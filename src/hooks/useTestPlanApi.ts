import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { getPAT } from '../utils/auth'
import { getConfig, getApiEndpoints } from '../config'
import type { TestPlan, TestSuite, TestCase } from '../types'

// Fallback function to get test plans via work items API
async function fetchTestPlansViaWorkItems(organization: string, project: string, pat: string): Promise<TestPlan[]> {
  const authHeader = 'Basic ' + btoa(':' + pat)
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=7.1`
  
  try {
    // Query for test plans using WIQL (Work Item Query Language)
    const wiqlQuery = {
      query: "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.WorkItemType] = 'Test Plan' ORDER BY [System.CreatedDate] DESC"
    }
    
    const response = await axios.post(url, wiqlQuery, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    })
    
    if ((response.data as any).workItems && (response.data as any).workItems.length > 0) {
      // Get detailed information for each test plan
      const testPlanIds = (response.data as any).workItems.map((wi: any) => wi.id)
      const detailsUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workItems?ids=${testPlanIds.join(',')}&$expand=all&api-version=7.1`
      
      const detailsResponse = await axios.get(detailsUrl, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        }
      })
      
      return (detailsResponse.data as any).value.map((workItem: any) => ({
        id: workItem.id,
        name: workItem.fields['System.Title'] || `Test Plan ${workItem.id}`,
        description: workItem.fields['System.Description'] || '',
        startDate: workItem.fields['Microsoft.VSTS.Scheduling.StartDate'] || '',
        endDate: workItem.fields['Microsoft.VSTS.Scheduling.FinishDate'] || '',
        state: workItem.fields['System.State'] || 'Active',
        areaPath: workItem.fields['System.AreaPath'] || '',
        iteration: workItem.fields['System.IterationPath'] || ''
      }))
    }
    
    return []
  } catch (error: any) {
    throw new Error(`Failed to fetch test plans via work items API: ${error.message}`)
  }
}

export function useTestPlans(organization: string, project: string) {
  const config = getConfig()
  config.organization = organization
  config.project = project
  
  return useQuery({
    queryKey: ['testPlans', organization, project],
    queryFn: async () => {
      try {
        const pat = getPAT()
        if (!pat) throw new Error('PAT not set')
        const authHeader = 'Basic ' + btoa(':' + pat)
        
        // Try multiple API endpoints for test plans
        const endpoints = [
          `https://dev.azure.com/${organization}/${project}/_apis/testplan/Plans?api-version=7.1`,
          `https://dev.azure.com/${organization}/${project}/_apis/testplan/plans?api-version=7.1`,
          `https://dev.azure.com/${organization}/${project}/_apis/test/Plans?api-version=7.1`,
          `https://dev.azure.com/${organization}/${project}/_apis/test/plans?api-version=7.1`
        ]
        
        for (const endpoint of endpoints) {
          try {
            const response = await axios.get(endpoint, { 
              headers: { 
                Authorization: authHeader,
                'Content-Type': 'application/json'
              }
            })
            
            return (response.data as any).value as TestPlan[]
          } catch (endpointError: any) {
            // If this is the last endpoint, try the work items fallback
            if (endpoint === endpoints[endpoints.length - 1]) {
              return await fetchTestPlansViaWorkItems(organization, project, pat)
            }
            
            // Continue to next endpoint
            continue
          }
        }
        
        throw new Error('All test plans endpoints failed')
        
      } catch (error: any) {
        // Handle specific error codes
        if (error.response?.status === 400) {
          throw new Error('Bad request. Please check your organization and project settings.')
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your PAT token and ensure it has the required permissions.')
        }
        
        if (error.response?.status === 403) {
          throw new Error('Permission denied. Please ensure your PAT has the required permissions for test management.')
        }
        
        if (error.response?.status === 404) {
          throw new Error('Test plans API not found. This might indicate that test management is not enabled for this project.')
        }
        
        if (error.response?.status === 302) {
          throw new Error(`API redirect detected. Please check your PAT token and organization/project settings. Redirect location: ${error.response.headers?.location}`)
        }
        
        // Handle other HTTP errors
        if (error.response?.status) {
          throw new Error(`HTTP ${error.response.status}: ${error.response.data?.message || error.message || 'Unknown error'}`)
        }
        
        throw error
      }
    },
  })
}

export function useTestSuites(organization: string, project: string, planId: number) {
  const config = getConfig()
  config.organization = organization
  config.project = project
  
  return useQuery({
    queryKey: ['testSuites', organization, project, planId],
    queryFn: async () => {
      try {
        const pat = getPAT()
        if (!pat) throw new Error('PAT not set')
        const authHeader = 'Basic ' + btoa(':' + pat)
        
        const endpoints = getApiEndpoints(config)
        const url = endpoints.testSuites(planId)
        
        const response = await axios.get(url, { 
          headers: { 
            Authorization: authHeader,
            'Content-Type': 'application/json'
          } 
        })
        
        // Map the Azure DevOps API response to our TestSuite interface
        const testSuites = (response.data as any).value.map((suite: any) => ({
          id: suite.id,
          name: suite.name,
          testPlanId: suite.plan?.id || planId,
          parentSuite: suite.parentSuite || null,
          parentSuiteId: suite.parentSuite?.id,
          testCaseCount: suite.testCaseCount,
          state: suite.state || 'Active',
          hasChildren: suite.hasChildren || false,
          suiteType: suite.suiteType,
          inheritDefaultConfigurations: suite.inheritDefaultConfigurations,
          revision: suite.revision,
          lastUpdatedDate: suite.lastUpdatedDate
        }))
        
        return testSuites as TestSuite[]
      } catch (error: any) {
        throw error
      }
    },
    enabled: !!planId
  })
}

export function useTestCases(
  organization: string, 
  project: string, 
  planId: number, 
  suiteId: number,
  filters: Record<string, any> = {}
) {
  const config = getConfig()
  config.organization = organization
  config.project = project
  
  return useQuery({
    queryKey: ['testCases', organization, project, planId, suiteId, filters],
    queryFn: async () => {
      try {
        const pat = getPAT()
        if (!pat) throw new Error('PAT not set')
        const authHeader = 'Basic ' + btoa(':' + pat)
        
        const endpoints = getApiEndpoints(config)
        const url = endpoints.testCases(planId, suiteId, filters)
        
        const response = await axios.get(url, { 
          headers: { 
            Authorization: authHeader,
            'Content-Type': 'application/json'
          } 
        })
        
        // Map the Azure DevOps API response to our TestCase interface
        const testCases = (response.data as any).value.map((item: any) => {
          // Extract work item fields
          const workItemFields = item.workItem?.workItemFields || []
          const getFieldValue = (fieldName: string) => {
            const field = workItemFields.find((f: any) => Object.keys(f)[0] === fieldName)
            return field ? Object.values(field)[0] : null
          }
          
          // Extract priority from work item fields
          const priorityField = workItemFields.find((f: any) => Object.keys(f)[0] === 'Microsoft.VSTS.Common.Priority')
          const priority = priorityField ? Object.values(priorityField)[0] : 3
          
          // Extract state from work item fields
          const stateField = workItemFields.find((f: any) => Object.keys(f)[0] === 'System.State')
          const state = stateField ? Object.values(stateField)[0] : 'Unknown'
          
          // Extract automation status
          const automationField = workItemFields.find((f: any) => Object.keys(f)[0] === 'Microsoft.VSTS.TCM.AutomationStatus')
          const automationStatus = automationField ? Object.values(automationField)[0] : 'Not Automated'
          
          // Extract assigned to
          const assignedToField = workItemFields.find((f: any) => Object.keys(f)[0] === 'System.AssignedTo')
          const assignedTo = assignedToField ? Object.values(assignedToField)[0] : ''
          
          return {
            id: item.workItem?.id || 0,
            title: item.workItem?.name || 'Unknown Test Case',
            testCaseId: item.workItem?.id?.toString() || '',
            priority: priority,
            state: state,
            automatedTestName: automationStatus === 'Automated' ? 'Automated' : automationStatus === 'Planned' ? 'Planned' : null,
            workItemId: item.workItem?.id || null,
            testCaseRevision: getFieldValue('System.Rev'),
            lastUpdatedBy: assignedTo,
            lastUpdatedDate: getFieldValue('Microsoft.VSTS.Common.StateChangeDate'),
            testPlanId: item.testPlan?.id?.toString(),
            testSuiteId: item.testSuite?.id?.toString(),
            configurationId: item.pointAssignments?.[0]?.configurationId?.toString(),
            // Additional fields for display
            assignedTo: assignedTo,
            automationStatus: automationStatus,
            order: item.order || 0
          }
        })
        
        return testCases as TestCase[]
      } catch (error: any) {
        throw error
      }
    },
    enabled: !!planId && !!suiteId
  })
}