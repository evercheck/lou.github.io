import React from 'react'
import { Box, Button, Chip } from '@mui/material'
import type { TestRun } from '../../types'
import { UI_CONSTANTS } from '../../config'

interface TestRunTableProps {
  testRuns: TestRun[]
  onTestRunSelect: (runId: number) => void
  onDeleteClick: (testRunId: number, testRunName: string) => void
}

const TestRunTable: React.FC<TestRunTableProps> = ({ 
  testRuns, 
  onTestRunSelect, 
  onDeleteClick 
}) => {
  const getStateColor = (state: string) => {
    return state === 'Completed' ? '#4caf50' : 
           state === 'InProgress' ? '#2196f3' : 
           state === 'Aborted' ? '#f44336' : '#757575'
  }

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleString() : ''
  }

  const calculateDuration = (createdDate: string, completedDate?: string) => {
    if (!completedDate || !createdDate) return 'N/A'
    const duration = Math.round(
      (new Date(completedDate).getTime() - new Date(createdDate).getTime()) / 1000 / 60
    )
    return `${duration} min`
  }

  return (
    <Box sx={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: 1, 
      overflow: 'hidden',
      backgroundColor: 'background.paper'
    }}>
      {/* Table Header */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: UI_CONSTANTS.GRID_COLUMNS.TEST_RUNS,
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        fontSize: 14,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>ID</Box>
        <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Test Run Name</Box>
        <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>State</Box>
        <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Created</Box>
        <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Completed</Box>
        <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Duration</Box>
        <Box sx={{ p: 2 }}>Actions</Box>
      </Box>

      {/* Table Rows */}
      {testRuns.map((testRun) => (
        <Box key={testRun.id} sx={{ 
          display: 'grid', 
          gridTemplateColumns: UI_CONSTANTS.GRID_COLUMNS.TEST_RUNS,
          borderBottom: '1px solid #e0e0e0',
          '&:hover': { backgroundColor: '#f5f5f5' },
          fontSize: 14
        }}>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{testRun.id}</Box>
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
              onClick={() => onTestRunSelect(testRun.id)}
            >
              {testRun.name}
            </Box>
          </Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
            <Chip 
              label={testRun.state} 
              size="small" 
              sx={{ 
                backgroundColor: getStateColor(testRun.state), 
                color: 'white' 
              }} 
            />
          </Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{formatDate(testRun.createdDate)}</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{formatDate(testRun.completedDate || '')}</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
            {calculateDuration(testRun.createdDate, testRun.completedDate)}
          </Box>
          <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              size="small" 
              color="error"
              onClick={() => onDeleteClick(testRun.id, testRun.name)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default TestRunTable 