import React, { useState } from 'react'
import { Button, Box, Typography, TextField, Alert } from '@mui/material'
import axios from 'axios'
import { getPAT } from '../utils/auth'
import { getOrganization, getProject } from '../utils/config'

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [testRunId, setTestRunId] = useState<string>('')
  const [testCaseId, setTestCaseId] = useState<string>('')
  const [outcome, setOutcome] = useState<string>('Passed')
  const [deleteTestRunId, setDeleteTestRunId] = useState<string>('')

  const testApi = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const pat = getPAT()
      if (!pat) {
        setResult('Error: PAT not set')
        return
      }

      const authHeader = 'Basic ' + btoa(':' + pat)
      const organization = getOrganization() || ""
      const project = getProject() || ""

      // Test different API endpoints
      const endpoints = [
        `https://dev.azure.com/${organization}/${project}/_apis/test/runs?api-version=7.1`,
        `https://dev.azure.com/${organization}/${project}/_apis/test/Results?api-version=7.1`
      ]

      let allResults = ''

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json'
            }
          })
          allResults += `✅ ${endpoint}\nStatus: ${response.status}\nData: ${JSON.stringify(response.data, null, 2)}\n\n`
        } catch (error: any) {
          allResults += `❌ ${endpoint}\nError: ${error.response?.status} - ${error.response?.data?.message || error.message}\n\n`
        }
      }

      setResult(allResults)
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testOutcomeUpdate = async () => {
    if (!testRunId || !testCaseId) {
      setResult('Error: Please provide both Test Run ID and Test Case ID')
      return
    }

    setLoading(true)
    setResult('')
    
    try {
      const pat = getPAT()
      if (!pat) {
        setResult('Error: PAT not set')
        return
      }

      const authHeader = 'Basic ' + btoa(':' + pat)
      const organization = getOrganization() || ""
      const project = getProject() || ""
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/results?api-version=7.1`

      // Test outcome update
      const response = await axios.patch(
        url,
        [
          {
            id: parseInt(testCaseId),
            outcome: outcome,
            comment: "Updated via API test",
          }
        ],
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        }
      )

      setResult(`✅ Outcome Update Test Successful!\n\nStatus: ${response.status}\nResponse: ${JSON.stringify(response.data, null, 2)}`)
    } catch (error: any) {
      setResult(`❌ Outcome Update Test Failed!\n\nError: ${error.response?.status} - ${error.response?.data?.message || error.message}\n\nDetails: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testDeleteTestRun = async () => {
    if (!deleteTestRunId) {
      setResult('Error: Please provide a Test Run ID to delete')
      return
    }

    setLoading(true)
    setResult('')
    
    try {
      const pat = getPAT()
      if (!pat) {
        setResult('Error: PAT not set')
        return
      }

      const authHeader = 'Basic ' + btoa(':' + pat)
      const organization = getOrganization() || ""
      const project = getProject() || ""
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs/${deleteTestRunId}?api-version=7.1`

      // Test delete test run
      const response = await axios.delete(url, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        }
      })

      setResult(`✅ Delete Test Run Successful!\n\nStatus: ${response.status}\nResponse: ${JSON.stringify(response.data, null, 2)}`)
    } catch (error: any) {
      setResult(`❌ Delete Test Run Failed!\n\nError: ${error.response?.status} - ${error.response?.data?.message || error.message}\n\nDetails: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        API Test Component
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Outcome Update
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Test Run ID"
            value={testRunId}
            onChange={(e) => setTestRunId(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Test Case ID"
            value={testCaseId}
            onChange={(e) => setTestCaseId(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <TextField
            select
            label="Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Blocked">Blocked</option>
            <option value="NotApplicable">N/A</option>
            <option value="NotExecuted">Not Executed</option>
          </TextField>
          <Button 
            variant="contained" 
            onClick={testOutcomeUpdate} 
            disabled={loading || !testRunId || !testCaseId}
            size="small"
          >
            {loading ? 'Testing...' : 'Test Outcome Update'}
          </Button>
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Use this to test the outcome update API. Enter a valid Test Run ID and Test Case ID from your Azure DevOps project.
        </Alert>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Delete Test Run
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Test Run ID to Delete"
            value={deleteTestRunId}
            onChange={(e) => setDeleteTestRunId(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <Button 
            variant="contained" 
            color="error"
            onClick={testDeleteTestRun} 
            disabled={loading || !deleteTestRunId}
            size="small"
          >
            {loading ? 'Testing...' : 'Test Delete Test Run'}
          </Button>
        </Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ WARNING: This will permanently delete the test run. Use with caution and only with test data.
        </Alert>
      </Box>

      <Button 
        variant="contained" 
        onClick={testApi} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Testing...' : 'Test API Endpoints'}
      </Button>
      <TextField
        multiline
        rows={20}
        fullWidth
        value={result}
        InputProps={{ readOnly: true }}
        placeholder="Click 'Test API Endpoints' to see results..."
      />
    </Box>
  )
}

export default ApiTest 