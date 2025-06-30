import React, { useState, useMemo } from 'react'
import { Button, Chip, Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Card, CardContent } from '@mui/material'
import { useTestRuns, useDeleteTestRun } from '../hooks/useTestRunQueryApi'

interface TestRunListProps {
  organization: string
  project: string
  onTestRunSelect: (runId: number) => void
  debugMode: boolean
  activeTab: string
}

const TestRunList: React.FC<TestRunListProps> = ({ organization, project, onTestRunSelect, debugMode, activeTab }) => {
  const [filters, setFilters] = useState({
    state: '',
    name: ''
  })

  // Only apply filters that have values to avoid empty string queries
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value && value.trim() !== '')
  )

  const { data: testRuns, isLoading, isError } = useTestRuns(organization, project, activeFilters, activeTab === 'test-runs')
  const deleteTestRun = useDeleteTestRun(organization, project)
  
  // State for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    testRunId: number | null
    testRunName: string
  }>({
    open: false,
    testRunId: null,
    testRunName: ''
  })

  // State for user feedback
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info'
  })

  // Show success notification when delete succeeds
  React.useEffect(() => {
    if (deleteTestRun.isSuccess) {
      setNotification({
        open: true,
        message: 'Test run deleted successfully!',
        severity: 'success'
      })
    }
  }, [deleteTestRun.isSuccess])

  // Show error notification when delete fails
  React.useEffect(() => {
    if (deleteTestRun.isError) {
      setNotification({
        open: true,
        message: `Failed to delete test run: ${deleteTestRun.error?.message || 'Unknown error'}`,
        severity: 'error'
      })
    }
  }, [deleteTestRun.isError, deleteTestRun.error])

  const rows = useMemo(() => {
    if (!testRuns || !Array.isArray(testRuns)) {
      return []
    }
    
    return testRuns
      .map((run) => ({
        id: run.id,
        name: run.name,
        state: run.state,
        passedTests: run.passedTests || 0,
        totalTests: run.totalTests || 0
      }))
      .sort((a, b) => b.id - a.id) // Sort by ID in descending order (newest first)
  }, [testRuns])

  const getStateColor = (state: string) => {
    return state === 'Completed' ? '#4caf50' : 
           state === 'InProgress' ? '#2196f3' : 
           state === 'Aborted' ? '#f44336' : '#757575'
  }



  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDeleteClick = (testRunId: number, testRunName: string) => {
    setDeleteDialog({
      open: true,
      testRunId,
      testRunName
    })
  }

  const handleDeleteConfirm = async () => {
    if (deleteDialog.testRunId) {
      try {
        // Verify the test run exists before attempting to delete
        const testRunExists = rows.find(row => row.id === deleteDialog.testRunId)
        if (!testRunExists) {
          setNotification({
            open: true,
            message: `Test run ${deleteDialog.testRunId} not found in current list. It may have been already deleted.`,
            severity: 'error'
          })
          setDeleteDialog({ open: false, testRunId: null, testRunName: '' })
          return
        }
        
        await deleteTestRun.mutateAsync(deleteDialog.testRunId)
        setDeleteDialog({ open: false, testRunId: null, testRunName: '' })
      } catch (error: any) {
        // Show specific error message
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred'
        setNotification({
          open: true,
          message: `Failed to delete test run: ${errorMessage}`,
          severity: 'error'
        })
        
        setDeleteDialog({ open: false, testRunId: null, testRunName: '' })
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, testRunId: null, testRunName: '' })
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  return (
          <Box sx={{ p: 2 }}>
      
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search by name"
          value={filters.name}
          onChange={(e) => handleFilterChange('name', e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>State</InputLabel>
          <Select
            value={filters.state}
            label="State"
            onChange={(e) => handleFilterChange('state', e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="InProgress">In Progress</MenuItem>
            <MenuItem value="Aborted">Aborted</MenuItem>
            <MenuItem value="NotStarted">Not Started</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {testRuns?.length === 0 
            ? 'No test runs found. This might be because: 1) No test runs exist in this project, 2) Your PAT token does not have access to test runs, or 3) Test management is not enabled for this project.'
            : 'Error loading test runs. Please check your connection and try again.'
          }
        </Alert>
      )}

      {!isError && !isLoading && rows.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No test runs found. This could mean:
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>No test runs have been created in this project yet</li>
            <li>Your PAT token doesn't have permission to view test runs</li>
            <li>Test management features are not enabled for this project</li>
            <li>The organization/project combination is incorrect</li>
          </ul>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Try refreshing the page or check the browser console for more detailed error information.
          </Typography>
        </Alert>
      )}

      {/* Custom Table */}
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 1, 
        overflow: 'hidden',
        backgroundColor: 'background.paper'
      }}>
        {/* Table Header */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '80px 1fr 120px 100px 100px 120px',
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          fontSize: 14,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>ID</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Test Run Name</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>State</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Passed</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Total</Box>
          <Box sx={{ p: 2 }}>Actions</Box>
        </Box>

        {/* Table Rows */}
        {rows.map((row) => (
          <Box key={row.id} sx={{ 
            display: 'grid', 
            gridTemplateColumns: '80px 1fr 120px 100px 100px 120px',
            borderBottom: '1px solid #e0e0e0',
            '&:hover': { backgroundColor: '#f5f5f5' },
            fontSize: 14
          }}>
            <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{row.id}</Box>
            <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
              <Box
                sx={{
                  cursor: 'pointer',
                  color: '#1976d2',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#1565c0',
                    textDecoration: 'underline'
                  }
                }}
                onClick={() => onTestRunSelect(row.id)}
              >
                {row.name}
              </Box>
            </Box>
            <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
              <Chip 
                label={row.state} 
                size="small" 
                sx={{ 
                  backgroundColor: getStateColor(row.state), 
                  color: 'white' 
                }} 
              />
            </Box>
            <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{row.passedTests}</Box>
            <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{row.totalTests}</Box>
            <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="small" 
                color="error"
                onClick={() => handleDeleteClick(row.id, row.name)}
              >
                Delete
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Test Run
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the test run "{deleteDialog.testRunName}" (ID: {deleteDialog.testRunId})?
            <br />
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteTestRun.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteTestRun.isPending}
          >
            {deleteTestRun.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Debug Information - Moved to bottom */}
      {debugMode && (
        <Card sx={{ mt: 3, backgroundColor: '#f0f0f0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <Box sx={{ fontSize: '0.875rem' }}>
              <Typography variant="body2">Loading: {isLoading ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Error: {isError ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Total Test Runs: {rows.length}</Typography>
              <Typography variant="body2">Test Run IDs: {rows.map(row => row.id).join(', ')}</Typography>
              <Typography variant="body2">Active Filters: {JSON.stringify(activeFilters)}</Typography>
              <Typography variant="body2">Delete Dialog Open: {deleteDialog.open ? 'Yes' : 'No'}</Typography>
              {deleteDialog.testRunId && (
                <Typography variant="body2">Selected for Delete: {deleteDialog.testRunId} - {deleteDialog.testRunName}</Typography>
              )}
              <Typography variant="body2">Organization: {organization}</Typography>
              <Typography variant="body2">Project: {project}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default TestRunList 