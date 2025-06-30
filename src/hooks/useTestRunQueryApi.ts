import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { getPAT } from '../utils/auth'

export interface TestRunRow {
  id: number
  name: string
  state: string
  createdDate: string
  completedDate?: string
  passedTests?: number
  totalTests?: number
  // Add fields as needed
}



export function useTestRuns(organization: string, project: string, filters: Record<string, any> = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: ['testRuns', organization, project, filters],
    enabled: enabled, // Only execute when enabled is true
    queryFn: async () => {
      try {
        const pat = getPAT()
        if (!pat) throw new Error('PAT not set')
        
        // Removed connectivity test to avoid calling _apis/projects
        
        const authHeader = 'Basic ' + btoa(':' + pat)
        
        // Try multiple API endpoints
        const endpoints = [
          `https://dev.azure.com/${organization}/${project}/_apis/test/runs?api-version=7.1`,
          `https://dev.azure.com/${organization}/${project}/_apis/test/Runs?api-version=7.1`
        ]
        
        for (const endpoint of endpoints) {
          try {
            // Build query parameters based on filters
            const params = new URLSearchParams()
            if (filters.state) params.append('state', filters.state)
            if (filters.name) params.append('name', filters.name)
            

            
            const response = await axios.get(endpoint, {
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json'
              }
            })
            
            // The response contains test runs in the value property
            return (response.data as any).value as TestRunRow[]
          } catch (endpointError: any) {

            
            // If this is the last endpoint, throw the error
            if (endpoint === endpoints[endpoints.length - 1]) {
              throw endpointError
            }
            
            // Continue to next endpoint
            continue
          }
        }
        
        // If all endpoints fail, try the test results API as fallback
        return await fetchTestRunsViaResults(organization, project, pat, filters)
        
      } catch (error: any) {
        // Handle 302 redirects
        if (error.response?.status === 302) {
          throw new Error(`API redirect detected. This might indicate an authentication issue or incorrect organization/project. Please check your PAT token and organization/project settings. Redirect location: ${error.response.headers?.location}`)
        }
        
        // Handle 401 unauthorized
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your PAT token and ensure it has the required permissions.')
        }
        
        // Handle 403 forbidden
        if (error.response?.status === 403) {
          throw new Error('Permission denied. Please ensure your PAT has the required permissions for this organization/project.')
        }
        
        // Handle 404 not found
        if (error.response?.status === 404) {
          return await fetchTestRunsViaResults(organization, project, getPAT()!, filters)
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

export function useTestCases(organization: string, project: string, testRunId: string | number) {
  return useQuery({
    queryKey: ['testCases', organization, project, testRunId],
    enabled: !!testRunId && testRunId !== "",
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: false, // Don't refetch when reconnecting to network
    queryFn: async () => {
      const pat = getPAT()
      if (!pat) {
        throw new Error("PAT not set")
      }
      
      // Don't make API call if testRunId is empty
      if (!testRunId || testRunId === "") {
        throw new Error("Test run ID is required")
      }
      
      const authHeader = 'Basic ' + btoa(':' + pat)
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/results?api-version=7.1`
      
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
        })
        // Return value: response.data.value is the result array
        return (response.data as any).value
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error("Authentication failed. Please check your PAT token and ensure it has 'Test Management' permissions.")
        }
        throw error
      }
    }
  })
}

export function useTestCaseDetail(organization: string, project: string, testRunId: string | number, testCaseResultId: string | number) {
  return useQuery({
    queryKey: ['testCaseDetail', organization, project, testRunId, testCaseResultId],
    enabled: !!testRunId && !!testCaseResultId && testRunId !== "" && testCaseResultId !== "",
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const pat = getPAT()
      if (!pat) {
        throw new Error("PAT not set")
      }
      
      if (!testRunId || testRunId === "" || !testCaseResultId || testCaseResultId === "") {
        throw new Error("Test run ID and test case result ID are required")
      }
      
      const authHeader = 'Basic ' + btoa(':' + pat)
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/results/${testCaseResultId}?api-version=7.1`
      
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
        })
        return response.data
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error("Authentication failed. Please check your PAT token and ensure it has 'Test Management' permissions.")
        }
        if (error.response?.status === 404) {
          throw new Error("Test case result not found. It may have been deleted or moved.")
        }
        throw error
      }
    }
  })
}

export function useUpdateTestCaseResult(organization: string, project: string, testRunId: string | number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      testCaseResultId,
      outcome,
      comment,
    }: { testCaseResultId: number|string, outcome: string, comment?: string }) => {
      const pat = getPAT()
      if (!pat) throw new Error("PAT not set")
      
      // Don't make API call if testRunId is empty
      if (!testRunId || testRunId === "") {
        throw new Error("Test run ID is required")
      }
      
      // Validate outcome value
      const validOutcomes = ['Passed', 'Failed', 'Blocked', 'NotApplicable', 'NotExecuted']
      if (!validOutcomes.includes(outcome)) {
        throw new Error(`Invalid outcome: ${outcome}. Must be one of: ${validOutcomes.join(', ')}`)
      }
      
      const authHeader = 'Basic ' + btoa(':' + pat)
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/results?api-version=7.1`
      
      try {
        // Azure DevOps API expects PATCH with array of results to update
        const response = await axios.patch(
          url,
          [
            {
              id: testCaseResultId,
              outcome,
              comment: comment || "",
            }
          ],
          { 
            headers: { 
              Authorization: authHeader,
              'Content-Type': 'application/json'
            } 
          }
        )
        
        // Validate response
        if (response.status !== 200) {
          throw new Error(`Failed to update test case result. Status: ${response.status}`)
        }
        
        return response.data
      } catch (error: any) {

        if (error.response?.status === 401) {
          throw new Error("Authentication failed. Please check your PAT token and ensure it has 'Test Management' permissions.")
        }
        if (error.response?.status === 403) {
          throw new Error("Permission denied. Please ensure your PAT has 'Test Management' permissions.")
        }
        if (error.response?.status === 404) {
          throw new Error("Test case result not found. It may have been deleted or moved.")
        }
        if (error.response?.status === 400) {
          throw new Error("Invalid request. Please check the outcome value and try again.")
        }
        
        // Re-throw the original error if it's not a response error
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the test cases query to show updated data
      queryClient.invalidateQueries({
        queryKey: ['testCases', organization, project, testRunId]
      })
    },
    onError: () => {
      // Error handling is done by the component
    }
  })
}

export function useDeleteTestRun(organization: string, project: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (testRunId: number) => {
      const pat = getPAT()
      if (!pat) throw new Error('PAT not set')
      
      const authHeader = 'Basic ' + btoa(':' + pat)
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs/${testRunId}?api-version=7.1`
      
      try {
        const response = await axios.delete(url, {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        })
        
        return response.data
      } catch (error: any) {

        
        if (error.response?.status === 401) {
          throw new Error("Authentication failed. Please check your PAT token and ensure it has 'Test Management' permissions.")
        }
        if (error.response?.status === 403) {
          throw new Error("Permission denied. Please ensure your PAT has 'Test Management' delete permissions.")
        }
        if (error.response?.status === 404) {
          const errorMessage = error.response?.data?.message || "Test run not found. It may have been already deleted."
          throw new Error(errorMessage)
        }
        if (error.response?.status === 409) {
          throw new Error("Cannot delete test run. It may be in progress or have active test results.")
        }
        
        // Handle other specific error types
        if (error.response?.data?.typeName === 'Microsoft.TeamFoundation.TestManagement.WebApi.TestObjectNotFoundException') {
          const errorMessage = error.response?.data?.message || "Test run not found. It may have been deleted."
          throw new Error(errorMessage)
        }
        
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the test runs query to update the list
      queryClient.invalidateQueries({
        queryKey: ['testRuns', organization, project]
      })
    },
    onError: () => {
      // Error handling is done by the component
    }
  })
}

// Fallback function to get test runs via test results API
async function fetchTestRunsViaResults(organization: string, project: string, pat: string, _filters: Record<string, any>) {
  const authHeader = 'Basic ' + btoa(':' + pat)
  const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Results?api-version=7.1`
  
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    })
    
    // Extract unique test runs from test results
    const testRuns = new Map()
    if ((response.data as any).value) {
      (response.data as any).value.forEach((result: any) => {
        if (result.testRun && !testRuns.has(result.testRun.id)) {
          testRuns.set(result.testRun.id, {
            id: result.testRun.id,
            name: result.testRun.name || `Test Run ${result.testRun.id}`,
            state: result.testRun.state || 'Unknown',
            createdDate: result.testRun.createdDate || '',
            completedDate: result.testRun.completedDate || '',
            passedTests: result.testRun.passedTests || 0,
            totalTests: result.testRun.totalTests || 0
          })
        }
      })
    }
    
    const testRunsArray = Array.from(testRuns.values()) as TestRunRow[]
    
    return testRunsArray
  } catch (error: any) {
    if (error.response?.status === 302) {
      throw new Error(`Test results API also returned 302 redirect. Please check your PAT token and organization/project settings. Redirect location: ${error.response.headers?.location}`)
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed for test results API. Please check your PAT token.')
    }
    
    if (error.response?.status === 403) {
      throw new Error('Permission denied for test results API. Please ensure your PAT has the required permissions.')
    }
    
    if (error.response?.status === 404) {
      throw new Error('Test results API not found. This might indicate that test management is not enabled for this project or the API endpoint is incorrect.')
    }
    
    throw new Error(`Failed to fetch test runs via test results API: ${error.message}`)
  }
}