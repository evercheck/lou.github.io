import React, { useState, useMemo, useEffect } from 'react'
import { 
  Button, 
  Chip, 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  Card, 
  CardContent 
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTestSuites, useTestCases } from '../hooks/useTestPlanApi'
import Notification from './ui/Notification'
import HierarchicalSuiteDropdown from './ui/HierarchicalSuiteDropdown'
import type { NotificationState } from '../types'

interface TestCaseListProps {
  organization: string
  project: string
  debugMode: boolean
}

const TestCaseList: React.FC<TestCaseListProps> = ({ organization, project, debugMode }) => {
  const navigate = useNavigate()
  const [selectedSuiteId, setSelectedSuiteId] = useState<number | ''>('')
  const [filters, setFilters] = useState({
    name: '',
    priority: '',
    state: ''
  })
  
  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  })
  
  // Using a hardcoded plan ID since we're not fetching test plans
  const selectedPlanId = 1 // This would need to be configured or passed as a prop
  
  // Fetch test suites for the hardcoded plan
  const { data: testSuites = [], isLoading: isLoadingSuites, error: suitesError } = useTestSuites(
    organization, 
    project, 
    selectedPlanId
  )
  
  // Fetch test cases when a suite is selected
  const { data: testCases = [], isLoading: isLoadingCases, error: casesError } = useTestCases(
    organization, 
    project, 
    selectedPlanId,
    selectedSuiteId || 0,
    filters
  )

  // Show success notification when test cases are loaded
  useEffect(() => {
    if (!isLoadingCases && testCases && testCases.length > 0) {
      setNotification({
        open: true,
        message: `Successfully loaded ${testCases.length} test cases from the selected test suite.`,
        severity: 'success'
      })
    }
  }, [isLoadingCases, testCases])

  const handleSuiteChange = (suiteId: number | '') => {
    setSelectedSuiteId(suiteId)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  const handleCreateTestCase = () => {
    if (selectedSuiteId) {
      navigate(`/create-test-case/${selectedPlanId}/${selectedSuiteId}`)
    }
  }

  // Apply filters to test cases
  const filteredTestCases = useMemo(() => {
    if (!testCases || testCases.length === 0) return []
    
    return testCases.filter(testCase => {
      // Filter by name (title)
      if (filters.name && !testCase.title.toLowerCase().includes(filters.name.toLowerCase())) {
        return false
      }
      
      // Filter by priority
      if (filters.priority && testCase.priority !== parseInt(filters.priority)) {
        return false
      }
      
      // Filter by state
      if (filters.state && testCase.state !== filters.state) {
        return false
      }
      
      return true
    })
  }, [testCases, filters])

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'error'
      case 2: return 'warning'
      case 3: return 'info'
      default: return 'default'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Critical'
      case 2: return 'High'
      case 3: return 'Medium'
      case 4: return 'Low'
      default: return 'Unknown'
    }
  }

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active': return 'success'
      case 'inactive': return 'error'
      case 'draft': return 'warning'
      default: return 'default'
    }
  }



  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Test Cases{testCases && testCases.length > 0 ? ` (${testCases.length})` : ''}
        </Typography>
        {selectedSuiteId && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateTestCase}
            disabled={!selectedSuiteId}
          >
            Create Test Case
          </Button>
        )}
      </Box>

      {/* Selection Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <HierarchicalSuiteDropdown
                suites={testSuites}
                selectedSuiteId={selectedSuiteId}
                onSuiteChange={handleSuiteChange}
                disabled={isLoadingSuites}
                label="Test Suite"
                showFullPath={true}
              />
              {isLoadingSuites && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  {/* CircularProgress removed */}
                </Box>
              )}
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <FormControl fullWidth disabled={!selectedSuiteId}>
                <InputLabel>State</InputLabel>
                <Select
                  value={filters.state}
                  label="State"
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  disabled={!selectedSuiteId}
                >
                  <MenuItem value="">All States</MenuItem>
                  <MenuItem value="Ready">Ready</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {selectedSuiteId && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Search by name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  placeholder="Filter test cases by name..."
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="1">Critical</MenuItem>
                    <MenuItem value="2">High</MenuItem>
                    <MenuItem value="3">Medium</MenuItem>
                    <MenuItem value="4">Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {suitesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading test suites: {String(suitesError)}
        </Alert>
      )}

      {casesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading test cases: {String(casesError)}
        </Alert>
      )}

      {/* Test Cases Table */}
      {selectedSuiteId && (
        <Box sx={{ mt: 2 }}>
          
          {isLoadingCases ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading test cases...</Typography>
            </Box>
          ) : filteredTestCases.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: '#666' }}>
              <Typography>No test cases found matching the current filters.</Typography>
            </Box>
          ) : (
            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 1, 
              overflow: 'hidden',
              backgroundColor: 'background.paper'
            }}>
              {/* Table Header */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 0.5fr 0.5fr 0.5fr 1fr 1fr',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                fontSize: 14,
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Title</Box>
                <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>ID</Box>
                <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Priority</Box>
                <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>State</Box>
                <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Automated</Box>
                <Box sx={{ p: 2 }}>Assigned To</Box>
              </Box>

              {/* Table Rows */}
              {filteredTestCases.map((testCase) => (
                <Box key={testCase.id} sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 0.5fr 0.5fr 0.5fr 1fr 1fr',
                  borderBottom: '1px solid #e0e0e0',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  fontSize: 14
                }}>
                  <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{testCase.title}</Box>
                  <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{testCase.testCaseId}</Box>
                  <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                    <Chip
                      label={getPriorityLabel(testCase.priority)}
                      color={getPriorityColor(testCase.priority) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                    <Chip
                      label={testCase.state}
                      color={getStateColor(testCase.state) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                    {testCase.automationStatus === 'Automated' ? (
                      <Chip label="Automated" color="success" size="small" />
                    ) : testCase.automationStatus === 'Planned' ? (
                      <Chip label="Planned" color="warning" size="small" />
                    ) : (
                      <Chip label="Manual" color="default" size="small" />
                    )}
                  </Box>
                  <Box sx={{ p: 2 }}>
                    {testCase.assignedTo || 'Unassigned'}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Instructions */}
      {!selectedPlanId && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1. Select a test suite from the dropdown above
              2. Choose a test suite within that plan
              3. Use the filters to narrow down test cases
              4. View test case details by clicking "View Details"
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Debug Information - Moved to bottom */}
      {debugMode && (
        <Card sx={{ mt: 3, backgroundColor: '#f0f0f0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <Box sx={{ fontSize: '0.875rem' }}>

              <Typography variant="body2">Loading Suites: {isLoadingSuites ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Loading Cases: {isLoadingCases ? 'Yes' : 'No'}</Typography>

              <Typography variant="body2">Total Test Suites: {testSuites?.length || 0}</Typography>
              <Typography variant="body2">Total Test Cases: {testCases?.length || 0}</Typography>
              <Typography variant="body2">Filtered Test Cases: {filteredTestCases?.length || 0}</Typography>

              <Typography variant="body2">Selected Suite ID: {selectedSuiteId}</Typography>
              <Typography variant="body2">Active Filters: {JSON.stringify(filters)}</Typography>

              {suitesError && (
                <Typography variant="body2" color="error">Suites Error: {String(suitesError)}</Typography>
              )}
              {casesError && (
                <Typography variant="body2" color="error">Cases Error: {String(casesError)}</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Toast Notification */}
      <Notification 
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  )
}

export default TestCaseList 