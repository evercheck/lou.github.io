import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { setPAT, getPAT, clearPAT, hasEnvPAT } from './utils/auth'
import { getOrganization, getProject, setOrganization, setProject, hasEnvConfig, hasEnvOrganization, hasEnvProject } from './utils/config'
import TestRunDetails from './components/TestRunDetails'
import TestRunList from './components/TestRunList'
import TestCaseList from './components/TestCaseList'
import CreateTestCase from './components/CreateTestCase'
import ApiTest from './components/ApiTest'
import CombinedInput from './components/CombinedInput'
import Navigation from './components/Navigation'
import { Box, Typography, AppBar, Toolbar, IconButton, Switch, FormControlLabel, Chip, Alert } from '@mui/material'
import { Logout, BugReport, Security, Settings } from '@mui/icons-material'

const App: React.FC = () => {
  const [pat, setPatState] = useState<string>(getPAT() || '')
  const [organization, setOrganizationState] = useState<string>(getOrganization() || '')
  const [project, setProjectState] = useState<string>(getProject() || '')
  const [isLoading, setIsLoading] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('test-runs') // Track active tab
  
  const handleCombinedSubmit = async (newPat: string, newOrganization: string, newProject: string) => {
    setIsLoading(true)
    
    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setPAT(newPat)
    setOrganization(newOrganization)
    setProject(newProject)
    setPatState(newPat)
    setOrganizationState(newOrganization)
    setProjectState(newProject)
    setIsLoading(false)
  }

  const handleLogout = () => {
    clearPAT()
    setPatState('')
  }

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName)
  }

  // Check if we have all required values (either from environment or user input)
  const hasPAT = !!pat || hasEnvPAT()
  const hasOrganization = !!organization || hasEnvOrganization()
  const hasProject = !!project || hasEnvProject()
  const isUsingEnvPAT = hasEnvPAT()
  const isUsingEnvConfig = hasEnvConfig()

  // Get organization and project from environment or user input
  const currentOrganization = organization || getOrganization() || ""
  const currentProject = project || getProject() || ""

  // Show combined input if any required value is missing
  if (!hasPAT || !hasOrganization || !hasProject) {
    return <CombinedInput onSubmit={handleCombinedSubmit} isLoading={isLoading} />
  }

  // Ensure we have valid organization and project values
  if (!currentOrganization || !currentProject) {
    return <CombinedInput onSubmit={handleCombinedSubmit} isLoading={isLoading} />
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Azure DevOps Test Management
          </Typography>
          
          {isUsingEnvPAT && (
            <Chip
              icon={<Security />}
              label="Env PAT"
              size="small"
              color="success"
              sx={{ mr: 2 }}
            />
          )}
          
          {isUsingEnvConfig && (
            <Chip
              icon={<Settings />}
              label="Env Config"
              size="small"
              color="success"
              sx={{ mr: 2 }}
            />
          )}
          
          <FormControlLabel
            control={
              <Switch
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BugReport sx={{ fontSize: 16 }} />
                <span style={{ fontSize: '0.875rem' }}>Debug</span>
              </Box>
            }
            sx={{ 
              color: 'white',
              '& .MuiFormControlLabel-label': { color: 'white' },
              mr: 1
            }}
          />
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            title="Logout"
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Navigation organization={organization} project={project} onTabChange={handleTabChange} />
      
      <Routes>
        <Route path="/" element={<Navigate to="/test-runs" replace />} />
        <Route path="/test-runs" element={<TestRunListRoute organization={currentOrganization} project={currentProject} debugMode={debugMode} activeTab={activeTab} onTabChange={handleTabChange} />} />
        <Route path="/test-run/:testRunId" element={<TestRunDetailRoute debugMode={debugMode} onTabChange={handleTabChange} />} />
        <Route path="/test-cases" element={<TestCaseListRoute organization={currentOrganization} project={currentProject} debugMode={debugMode} activeTab={activeTab} />} />
        <Route path="/create-test-case/:planId/:suiteId" element={<CreateTestCaseRoute organization={currentOrganization} project={currentProject} />} />
        <Route path="/api-test" element={<ApiTestRoute />} />
      </Routes>
    </Box>
  )
}

// Component for the test runs list route
const TestRunListRoute: React.FC<{ organization: string; project: string; debugMode: boolean; activeTab: string; onTabChange?: (tabName: string) => void }> = ({ organization, project, debugMode, activeTab, onTabChange }) => {
  const navigate = useNavigate()

  const handleTestRunSelect = (runId: number) => {
    // Update active tab to test-runs when navigating to a test run detail
    onTabChange?.('test-runs')
    navigate(`/test-run/${runId}`)
  }

  // Only render TestRunList when the test-runs tab is active
  if (activeTab !== 'test-runs') {
    return null
  }
  return (
    <Box>
      <TestRunList 
        organization={organization}
        project={project}
        onTestRunSelect={handleTestRunSelect}
        debugMode={debugMode}
        activeTab={activeTab}
      />
    </Box>
  )
}

// Component for the test cases list route
const TestCaseListRoute: React.FC<{ organization: string; project: string; debugMode: boolean; activeTab: string }> = ({ organization, project, debugMode, activeTab }) => {
  // Only render TestCaseList when the test-cases tab is active
  if (activeTab !== 'test-cases') {
    return null
  }
  return (
    <Box>
      <TestCaseList 
        organization={organization}
        project={project}
        debugMode={debugMode}
      />
    </Box>
  )
}

// Component for the create test case route
const CreateTestCaseRoute: React.FC<{ organization: string; project: string }> = ({ organization, project }) => {
  const { planId, suiteId } = useParams<{ planId: string; suiteId: string }>()
  const planIdNumber = parseInt(planId || '0')
  const suiteIdNumber = parseInt(suiteId || '0')

  if (!planIdNumber || !suiteIdNumber) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Invalid plan ID or suite ID provided.
        </Alert>
      </Box>
    )
  }

  return (
    <CreateTestCase 
      organization={organization}
      project={project}
      planId={planIdNumber}
      suiteId={suiteIdNumber}
    />
  )
}

// Component for the test run detail route
const TestRunDetailRoute: React.FC<{ debugMode: boolean; onTabChange?: (tabName: string) => void }> = ({ debugMode, onTabChange }) => {
  const { testRunId } = useParams<{ testRunId: string }>()
  const testRunIdNumber = parseInt(testRunId || '0')

  // Ensure the active tab is set to 'test-runs' when viewing a test run detail
  useEffect(() => {
    onTabChange?.('test-runs')
  }, [onTabChange])

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        <TestRunDetails testRunId={testRunIdNumber} debugMode={debugMode} />
      </Box>
    </Box>
  )
}

// Component for the API test route
const ApiTestRoute: React.FC = () => {
  return (
    <Box>
      <Box sx={{ p: 2, backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">
          API Test
        </Typography>
      </Box>
      <ApiTest />
    </Box>
  )
}

export default App