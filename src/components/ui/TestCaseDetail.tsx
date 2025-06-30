import React from 'react'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import type { TestCaseDetail as TestCaseDetailType } from '../../types'

interface TestCaseDetailProps {
  testCase: TestCaseDetailType
  detailedData: any
  isLoadingDetail: boolean
}

const TestCaseDetail: React.FC<TestCaseDetailProps> = ({ 
  testCase, 
  detailedData, 
  isLoadingDetail 
}) => {
  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A'
  }

  const formatDuration = (durationInMs: string) => {
    return durationInMs ? Math.round(Number(durationInMs) / 1000) + 's' : 'N/A'
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
      <Typography variant="h6" gutterBottom>
        Test Case Details - {testCase.testCaseTitle}
      </Typography>
      
      {isLoadingDetail && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Loading detailed information...</Typography>
        </Box>
      )}
      
      {detailedData && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Test Case ID</Typography>
                  <Typography variant="body1">{detailedData.testCase?.id || testCase.testCaseId || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Test Case Name</Typography>
                  <Typography variant="body1">{detailedData.testCase?.name || detailedData.testCaseTitle || testCase.testCaseTitle || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Test Plan ID</Typography>
                  <Typography variant="body1">{detailedData.testPlan?.id || testCase.testPlanId || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Configuration ID</Typography>
                  <Typography variant="body1">{detailedData.configuration?.id || testCase.configurationId || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Test Suite</Typography>
                  <Typography variant="body1">{detailedData.testSuite?.name || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Test Case Reference ID</Typography>
                  <Typography variant="body1">{detailedData.testCaseReferenceId || testCase.testCaseReferenceId || 'N/A'}</Typography>
                </Box>
              </Paper>
            </Box>
            
            <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Execution Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Started</Typography>
                  <Typography variant="body1">{formatDate(detailedData.startedDate || testCase.startedDate)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                  <Typography variant="body1">{formatDate(detailedData.completedDate || testCase.completedDate)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{formatDuration(detailedData.durationInMs || testCase.durationInMs)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">State</Typography>
                  <Typography variant="body1">{detailedData.state || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Priority</Typography>
                  <Typography variant="body1">{detailedData.priority || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Revision</Typography>
                  <Typography variant="body1">{detailedData.revision || 'N/A'}</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                User Information
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Run By</Typography>
                    <Typography variant="body1">{detailedData.runBy?.displayName || testCase.runBy || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Owner</Typography>
                    <Typography variant="body1">{detailedData.owner?.displayName || testCase.owner || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Last Updated By</Typography>
                    <Typography variant="body1">{detailedData.lastUpdatedBy?.displayName || testCase.lastUpdatedBy || 'N/A'}</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Last Updated Date</Typography>
                    <Typography variant="body1">{formatDate(detailedData.lastUpdatedDate || testCase.lastUpdatedDate)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Created Date</Typography>
                    <Typography variant="body1">{formatDate(detailedData.createdDate)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Test Case Revision</Typography>
                    <Typography variant="body1">{detailedData.testCaseRevision || testCase.testCaseRevision || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
          
          {detailedData.errorMessage && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 2, backgroundColor: '#fff3e0' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#e65100' }}>
                  Error Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Error Message</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                    {detailedData.errorMessage}
                  </Typography>
                </Box>
                {detailedData.stackTrace && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Stack Trace</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {detailedData.stackTrace}
                    </Typography>
                  </Box>
                )}
                {detailedData.failureType && detailedData.failureType !== 'None' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Failure Type</Typography>
                    <Typography variant="body1">{detailedData.failureType}</Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Additional Information
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Test Point ID</Typography>
                    <Typography variant="body1">{detailedData.testPoint?.id || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Custom Fields</Typography>
                    <Typography variant="body1">{detailedData.customFields?.length || 0} custom field(s)</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">URL</Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {detailedData.url || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </>
      )}
      
      {!detailedData && !isLoadingDetail && (
        <Box sx={{ p: 3, textAlign: 'center', color: '#666' }}>
          <Typography>No detailed information available for this test case.</Typography>
        </Box>
      )}
    </Box>
  )
}

export default TestCaseDetail 