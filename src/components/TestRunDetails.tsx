import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useTestCases, useUpdateTestCaseResult } from '../hooks/useTestRunQueryApi'
import { Alert, Snackbar, CircularProgress, Box, Paper, Typography, FormControl, Select, MenuItem, Card, CardContent, Chip, IconButton, Modal, Button } from '@mui/material'
import axios from 'axios'
import { getPAT } from '../utils/auth'
import { getOrganization, getProject } from '../utils/config'
import type { TestCaseAttachment, TestCaseAttachmentsResponse } from '../types'

interface TestRunDetailsProps {
  testRunId: number
  debugMode: boolean
}

interface TestCaseDetail {
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
  // Additional detail fields
  errorMessage?: string
  stackTrace?: string
  attachments?: any[]
  workItemId?: string
  testCaseRevision?: number
  lastUpdatedBy?: string
  lastUpdatedDate?: string
}

const TestRunDetails: React.FC<TestRunDetailsProps> = ({ testRunId, debugMode }) => {
  // Get organization and project from environment or user input
  const organization = getOrganization() || ""
  const project = getProject() || ""

  // Only call hooks when we have a valid test run ID
  const hasValidTestRunId = testRunId && testRunId > 0
  
  const { data, isError } = useTestCases(organization, project, hasValidTestRunId ? testRunId.toString() : "")
  const updateTestCaseResult = useUpdateTestCaseResult(organization, project, hasValidTestRunId ? testRunId.toString() : "")

  
  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  
  // State for detailed test case data
  const [detailedTestCases, setDetailedTestCases] = useState<Map<number, any>>(new Map())
  
  // State for expanded information sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['error']))
  
  // State for attachments data
  const [attachments, setAttachments] = useState<Map<number, TestCaseAttachment[]>>(new Map())
  
  // State for loading images
  const [authenticatedImageUrls, setAuthenticatedImageUrls] = useState<Map<number, string>>(new Map())
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set())
  const [activeBlobUrls, setActiveBlobUrls] = useState<Set<string>>(new Set())
  
  // State for image preview modal
  const [imagePreview, setImagePreview] = useState<{
    open: boolean
    imageUrl: string
    fileName: string
    attachment?: TestCaseAttachment
  }>({
    open: false,
    imageUrl: '',
    fileName: '',
    attachment: undefined
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



  // Show success notification when update succeeds
  useEffect(() => {
    if (updateTestCaseResult.isSuccess) {
      setNotification({
        open: true,
        message: 'Test case outcome updated successfully!',
        severity: 'success'
      })
    }
  }, [updateTestCaseResult.isSuccess])

  // Show error notification when update fails
  useEffect(() => {
    if (updateTestCaseResult.isError) {
      setNotification({
        open: true,
        message: `Failed to update outcome: ${updateTestCaseResult.error?.message || 'Unknown error'}`,
        severity: 'error'
      })
    }
  }, [updateTestCaseResult.isError, updateTestCaseResult.error])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to free memory
      authenticatedImageUrls.forEach(blobUrl => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl)
        }
      })
      
      // Clear the image URL cache
      imageUrlCache.current.clear()
      

    }
      }, []) // Remove traceFiles dependency

  // Map test case API fields to grid rows
  const rows = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return []
    }
    
    // API structure: handle the actual Azure DevOps test results response
    return data.map((item: any) => {
      return {
        id: item.id,
        testCaseTitle: item.testCaseTitle || item.testCase?.name || item.automatedTestName || `Test Case ${item.id}`,
        testCaseId: item.testCase?.id || '',
        outcome: item.outcome || 'NotExecuted',
        state: item.state || 'NotStarted',
        priority: item.priority || 3,
        startedDate: item.startedDate ? new Date(item.startedDate).toLocaleString() : '',
        completedDate: item.completedDate ? new Date(item.completedDate).toLocaleString() : '',
        durationInMs: item.durationInMs || '',
        runBy: item.runBy?.displayName || '',
        owner: item.owner?.displayName || '',
        testPlanId: item.testPlanId || '',
        configurationId: item.configurationId || '',
        automatedTestName: item.automatedTestName || '',
        testCaseReferenceId: item.testCaseReferenceId || '',
        comment: item.comment || '',
        errorMessage: item.errorMessage || '',
        stackTrace: item.stackTrace || '',
        attachments: item.attachments || [],
        workItemId: item.workItemId || '',
        testCaseRevision: item.testCaseRevision || 0,
        lastUpdatedBy: item.lastUpdatedBy?.displayName || '',
        lastUpdatedDate: item.lastUpdatedDate ? new Date(item.lastUpdatedDate).toLocaleString() : '',
      }
    })
  }, [data])

  const handleOutcomeChange = async (testCaseId: number, newOutcome: string) => {
    try {
      await updateTestCaseResult.mutateAsync({
        testCaseResultId: testCaseId,
        outcome: newOutcome,
        comment: ''
      })
    } catch (error: any) {
      console.error('Failed to update test case outcome:', error)
    }
  }

  const handleTitleClick = async (testCaseId: number) => {
    const newExpandedRows = new Set(expandedRows)
    
    if (newExpandedRows.has(testCaseId)) {
      // Collapse the row
      newExpandedRows.delete(testCaseId)
      setExpandedRows(newExpandedRows)
    } else {
      // Expand the row and fetch detailed data
      newExpandedRows.add(testCaseId)
      setExpandedRows(newExpandedRows)
      
      // Fetch detailed test case data
      try {
        const pat = getPAT()
        if (!pat) {
          return
        }
        
        const authHeader = 'Basic ' + btoa(':' + pat)
        const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/results/${testCaseId}?api-version=7.1`
        
        const response = await axios.get(url, {
          headers: { 
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
        })
        
        // Update the detailed test cases map
        setDetailedTestCases(prev => {
          const newMap = new Map(prev)
          newMap.set(testCaseId, response.data)
          return newMap
        })
        
        // Fetch attachments for this test case
        await fetchAttachments(testCaseId)
        
      } catch (error: any) {
        setNotification({
          open: true,
          message: `Failed to load test case details: ${error.response?.data?.message || error.message}`,
          severity: 'error'
        })
      }
    }
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  const fetchAttachments = async (testCaseId: number) => {
    try {
      const pat = getPAT()
      if (!pat) {
        return
      }
      
      const authHeader = 'Basic ' + btoa(':' + pat)
      const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/Results/${testCaseId}/attachments?api-version=7.1`
      
      const response = await axios.get<TestCaseAttachmentsResponse>(url, {
        headers: { 
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
      })
      
      // Update the attachments map
      setAttachments(prev => {
        const newMap = new Map(prev)
        newMap.set(testCaseId, response.data.value)
        return newMap
      })
      
      // Set loading state for image attachments
      const imageAttachments = response.data.value.filter(att => isImageFile(att.fileName))
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        imageAttachments.forEach(att => newSet.add(att.id))
        return newSet
      })
      
      // Reset failed state for new attachments
      setFailedImages(prev => {
        const newSet = new Set(prev)
        imageAttachments.forEach(att => newSet.delete(att.id))
        return newSet
      })
      

      
      // No need to fetch authenticated URLs anymore - we'll use direct API endpoints
      // Just mark images as loaded since they'll load directly from the API
      if (imageAttachments.length > 0) {
        // Mark all images as loaded (they'll load when the img elements render)
        imageAttachments.forEach(attachment => {
          setLoadingImages(prev => {
            const newSet = new Set(prev)
            newSet.delete(attachment.id)
            return newSet
          })
        })
      }
      
    } catch (error: any) {
      console.error('Failed to fetch attachments:', error)
      // Don't show error notification for attachments as it's not critical
    }
  }

  // Simplified image loading - no more complex blob URL management needed

  const retryFailedImage = async (attachment: TestCaseAttachment) => {
    const attachmentId = attachment.id
    
    // Reset failed state and set loading
    setFailedImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(attachmentId)
      return newSet
    })
    
    setLoadingImages(prev => {
      const newSet = new Set(prev)
      newSet.add(attachmentId)
      return newSet
    })
    
    // Clear any existing authenticated URL
    setAuthenticatedImageUrls(prev => {
      const newMap = new Map(prev)
      newMap.delete(attachmentId)
      return newMap
    })
    
    // Reset failed state - image will load directly from API
    setFailedImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(attachmentId)
      return newSet
    })
  }

  const retryAllFailedImages = async () => {
    const failedAttachments = Array.from(attachments.values())
      .flat()
      .filter(att => isImageFile(att.fileName) && failedImages.has(att.id))
    
    if (failedAttachments.length === 0) {
      setNotification({
        open: true,
        message: 'No failed images to retry',
        severity: 'info'
      })
      return
    }
    
    // Clear all failed states
    setFailedImages(new Set())
    
    // Set loading state for all failed images
    setLoadingImages(prev => {
      const newSet = new Set(prev)
      failedAttachments.forEach(att => newSet.add(att.id))
      return newSet
    })
    
    // Clear any existing authenticated URLs for failed images
    setAuthenticatedImageUrls(prev => {
      const newMap = new Map(prev)
      failedAttachments.forEach(att => newMap.delete(att.id))
      return newMap
    })
    
            // Reset all failed states - images will load directly from API
        failedAttachments.forEach(att => {
          setFailedImages(prev => {
            const newSet = new Set(prev)
            newSet.delete(att.id)
            return newSet
          })
        })
    
    setNotification({
      open: true,
      message: `Retry completed for ${failedAttachments.length} images`,
      severity: 'info'
    })
  }



  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isTraceFile = (fileName: string): boolean => {
    const traceExtensions = ['.zip', '.trace']
    const lowerFileName = fileName.toLowerCase()
    return traceExtensions.some(ext => lowerFileName.endsWith(ext)) || 
           lowerFileName.includes('trace') || 
           lowerFileName.includes('playwright')
  }

  const downloadTraceFile = async (attachment: TestCaseAttachment, testCaseId: number) => {
    try {
      const pat = getPAT()
      if (!pat) {
        throw new Error('Personal Access Token not found')
      }

      const authHeader = 'Basic ' + btoa(':' + pat)
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/Results/${testCaseId}/Attachments/${attachment.id}`
      
      setNotification({
        open: true,
        message: `Downloading trace file "${attachment.fileName}"...`,
        severity: 'info'
      })

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      
      // Create a download link
      const link = document.createElement('a')
      const blobUrl = URL.createObjectURL(blob)
      link.href = blobUrl
      link.download = attachment.fileName
      link.click()
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)

      setNotification({
        open: true,
        message: `Trace file "${attachment.fileName}" downloaded successfully!`,
        severity: 'success'
      })

    } catch (error: any) {
      console.error('Failed to download trace file:', error)
      setNotification({
        open: true,
        message: `Failed to download trace file: ${error.message}`,
        severity: 'error'
      })
    }
  }

  const downloadImageFile = async (attachment: TestCaseAttachment, testCaseId: number) => {
    try {
      const pat = getPAT()
      if (!pat) {
        throw new Error('Personal Access Token not found')
      }

      const authHeader = 'Basic ' + btoa(':' + pat)
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/Results/${testCaseId}/Attachments/${attachment.id}`
      
      setNotification({
        open: true,
        message: `Downloading image "${attachment.fileName}"...`,
        severity: 'info'
      })

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      
      // Create a download link
      const link = document.createElement('a')
      const blobUrl = URL.createObjectURL(blob)
      link.href = blobUrl
      link.download = attachment.fileName
      link.click()
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)

      setNotification({
        open: true,
        message: `Image "${attachment.fileName}" downloaded successfully!`,
        severity: 'success'
      })

    } catch (error: any) {
      console.error('Failed to download image file:', error)
      setNotification({
        open: true,
        message: `Failed to download image: ${error.message}`,
        severity: 'error'
      })
    }
  }











  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    const lowerFileName = fileName.toLowerCase()
    return imageExtensions.some(ext => lowerFileName.endsWith(ext))
  }

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName)
      } else {
        newSet.add(sectionName)
      }
      return newSet
    })
  }

  const getAuthenticatedImageUrl = async (attachment: TestCaseAttachment): Promise<string> => {
    try {
      const pat = getPAT()
      if (!pat) {
        throw new Error('Personal Access Token not found')
      }

      const authHeader = 'Basic ' + btoa(':' + pat)
      
      const response = await axios.get(attachment.url, {
        headers: { 
          Authorization: authHeader
        },
        responseType: 'blob',
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx status codes
      })

      // Check if response is actually an image
      if (!response.data || (response.data as any).size === 0) {
        throw new Error('Empty or invalid image data received')
      }

      // Check for specific HTTP error statuses
      if (response.status === 401) {
        throw new Error('Authentication failed - please check your Personal Access Token')
      } else if (response.status === 403) {
        throw new Error('Access denied - you may not have permission to view this image')
      } else if (response.status === 404) {
        throw new Error('Image not found - the file may have been deleted or moved')
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}) - please try again later`)
      }

      // Determine the correct MIME type based on file extension
      let mimeType = 'image/png' // default
      const fileName = attachment.fileName.toLowerCase()
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (fileName.endsWith('.gif')) {
        mimeType = 'image/bmp'
      } else if (fileName.endsWith('.webp')) {
        mimeType = 'image/webp'
      }

      // Create a blob URL from the response
      const blob = new Blob([response.data as BlobPart], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)
      
      return blobUrl
    } catch (error: any) {
      console.error('Failed to fetch authenticated image:', error)
      
      // Log detailed error information
      if (error.response) {
        console.error('HTTP Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        })
      } else if (error.request) {
        console.error('Network Error:', {
          message: error.message,
          code: error.code,
          errno: error.errno
        })
      } else {
        console.error('Other Error:', {
          message: error.message,
          stack: error.stack
        })
      }
      
      throw error
    }
  }



  const handleImagePreviewWithAuth = async (attachment: TestCaseAttachment, testCaseId: number) => {
    try {
      // Use the same direct API endpoint that works for thumbnails
      const imageUrl = await getImageUrl(attachment, testCaseId)
      
      setImagePreview({
        open: true,
        imageUrl,
        fileName: attachment.fileName,
        attachment: attachment
      })
    } catch (error) {
      console.error('Failed to get image for preview:', error)
      
      // Fallback to original URL if there's an issue
      setImagePreview({
        open: true,
        imageUrl: attachment.url,
        fileName: attachment.fileName,
        attachment: attachment
      })
    }
  }

  const closeImagePreview = () => {
    setImagePreview({
      open: false,
      imageUrl: '',
      fileName: '',
      attachment: undefined
    })
  }







  const renderTestCaseDetail = (testCase: TestCaseDetail) => {
    const detailedData = detailedTestCases.get(testCase.id)
    const isLoadingDetail = expandedRows.has(testCase.id) && !detailedData
    
    if (detailedData) {
      return (
        <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          
          {isLoadingDetail && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }}>Loading detailed information...</Typography>
            </Box>
          )}
          
          {detailedData && (
            <>

              
              {/* Attachments Section */}
              <Box sx={{ mt: 2 }}>
                <Paper sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Attachments
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {failedImages.size > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={retryAllFailedImages}
                          startIcon={<span>🔄</span>}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Retry Failed ({failedImages.size})
                        </Button>
                      )}
                    </Box>
                  </Box>
                  
                  {(() => {
                    const testCaseAttachments = attachments.get(testCase.id) || []
                    if (testCaseAttachments.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          No attachments found for this test case.
                        </Typography>
                      )
                    }
                    
                    return (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                          {testCaseAttachments.length} attachment(s) found
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5 }}>
                          {testCaseAttachments.map((attachment) => {
                            const isImage = isImageFile(attachment.fileName)
                            
                            if (isImage) {
                              return (
                                <Box
                                  key={attachment.id}
                                  sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: '180px'
                                  }}
                                >
                                  <Box sx={{ 
                                    height: 120, 
                                    backgroundColor: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleImagePreviewWithAuth(attachment, testCase.id)}
                                  title={`Click to preview ${attachment.fileName}`}
                                  >
                                    {!failedImages.has(attachment.id) && (
                                      <>
                                        <ImageWithAuth
                                          attachment={attachment}
                                          testCaseId={testCase.id}
                                          onLoad={() => {
                                            // Image loaded successfully
                                          }}
                                          onError={(e) => {
                                            console.error(`Image failed to load: ${attachment.fileName}`, e)
                                            
                                            // Mark as failed
                                            setFailedImages(prev => {
                                              const newSet = new Set(prev)
                                              newSet.add(attachment.id)
                                              return newSet
                                            })
                                            
                                            // Show error notification
                                            setNotification({
                                              open: true,
                                              message: `Failed to load image: ${attachment.fileName}`,
                                              severity: 'info'
                                            })
                                          }}
                                        />
                                        
                                        {/* Download button overlay on top right */}
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            zIndex: 1
                                          }}
                                        >
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              downloadImageFile(attachment, testCase.id)
                                            }}
                                            sx={{
                                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                              color: '#1976d2',
                                              '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                                transform: 'scale(1.1)'
                                              },
                                              transition: 'all 0.2s ease-in-out'
                                            }}
                                            title="Download image"
                                          >
                                            <span style={{ fontSize: '16px' }}>⬇️</span>
                                          </IconButton>
                                        </Box>
                                      </>
                                    )}
                                    
                                    {failedImages.has(attachment.id) && (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: '#666',
                                          fontSize: '0.875rem',
                                          textAlign: 'center',
                                          p: 2
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                          Failed to load
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              retryFailedImage(attachment)
                                            }}
                                          >
                                            Retry
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="info"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              diagnoseImageFailure(attachment)
                                            }}
                                          >
                                            Diagnose
                                          </Button>
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                  <Box sx={{ p: 1 }}>
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      fontWeight: 'bold',
                                      color: '#333',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {attachment.fileName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                                      {formatFileSize(attachment.size)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )
                            }
                            
                            // Trace files with download button
                            if (isTraceFile(attachment.fileName)) {
                              return (
                                <Box
                                  key={attachment.id}
                                  sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    p: 1,
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    minWidth: '180px'
                                  }}
                                >
                                  <Typography variant="caption" sx={{ 
                                    fontWeight: 'bold',
                                    color: '#333',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {attachment.fileName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    {formatFileSize(attachment.size)}
                                  </Typography>
                                  
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => downloadTraceFile(attachment, testCase.id)}
                                    startIcon={<span>⬇️</span>}
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    Download Trace
                                  </Button>
                                </Box>
                              )
                            }
                            
                            // Regular non-image files as chips
                            return (
                              <Chip
                                key={attachment.id}
                                label={`${attachment.fileName} (${formatFileSize(attachment.size)})`}
                                variant="outlined"
                                size="small"
                                sx={{ 
                                  maxWidth: '180px',
                                  height: 'auto',
                                  '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'left',
                                    padding: '6px 10px'
                                  }
                                }}
                                onClick={() => window.open(attachment.url, '_blank')}
                                title={`${attachment.fileName}\nSize: ${formatFileSize(attachment.size)}\nCreated: ${new Date(attachment.createdDate).toLocaleString()}\nComment: ${attachment.comment || 'No comment'}\nClick to open`}
                              />
                            )
                          })}
                        </Box>
                      </Box>
                    )
                  })()}
                </Paper>
              </Box>
              
              {/* Information Sections */}
              <Box sx={{ mt: 3 }}>
                {/* Error Information Section (if exists) - Display first */}
                {detailedData.errorMessage && (
                  <Paper sx={{ p: 1.5, backgroundColor: '#fff3e0', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', fontSize: '0.9rem' }}>
                        Error Information
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => toggleSection('error')}
                        sx={{ color: '#e65100', p: 0.5 }}
                      >
                        {expandedSections.has('error') ? '−' : '+'}
                      </IconButton>
                    </Box>
                    {expandedSections.has('error') && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Error Message</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 0.75, borderRadius: 1, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                            {detailedData.errorMessage}
                          </Typography>
                        </Box>
                        {detailedData.stackTrace && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Stack Trace</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 0.75, borderRadius: 1, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                              {detailedData.stackTrace}
                            </Typography>
                          </Box>
                        )}
                        {detailedData.failureType && detailedData.failureType !== 'None' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Failure Type:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.failureType}</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Basic Information Section */}
                <Paper sx={{ p: 1.5, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Basic Information
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSection('basic')}
                      sx={{ color: '#666', p: 0.5 }}
                    >
                      {expandedSections.has('basic') ? '−' : '+'}
                    </IconButton>
                  </Box>
                  {expandedSections.has('basic') && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>ID:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testCase?.id || testCase.testCaseId || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>Name:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testCase?.name || detailedData.testCaseTitle || testCase.testCaseTitle || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>Plan ID:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testPlan?.id || testCase.testPlanId || 'N/A'}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>Config ID:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.configuration?.id || testCase.configurationId || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>Suite:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testSuite?.name || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>Ref ID:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testCaseReferenceId || testCase.testCaseReferenceId || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* Execution Details Section */}
                <Paper sx={{ p: 1.5, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Execution Details
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSection('execution')}
                      sx={{ color: '#666', p: 0.5 }}
                    >
                      {expandedSections.has('execution') ? '−' : '+'}
                    </IconButton>
                  </Box>
                  {expandedSections.has('execution') && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px', fontSize: '0.75rem' }}>Started:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.startedDate ? new Date(detailedData.startedDate).toLocaleString() : testCase.startedDate || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px', fontSize: '0.75rem' }}>Completed:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.completedDate ? new Date(detailedData.completedDate).toLocaleString() : testCase.completedDate || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px', fontSize: '0.75rem' }}>Duration:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.durationInMs ? Math.round(Number(detailedData.durationInMs) / 1000) + 's' : testCase.durationInMs || 'N/A'}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px', fontSize: '0.75rem' }}>State:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.state || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px', fontSize: '0.75rem' }}>Priority:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.priority || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px', fontSize: '0.75rem' }}>Revision:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.revision || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* User Information Section */}
                <Paper sx={{ p: 1.5, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      User Information
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSection('user')}
                      sx={{ color: '#666', p: 0.5 }}
                    >
                      {expandedSections.has('user') ? '−' : '+'}
                    </IconButton>
                  </Box>
                  {expandedSections.has('user') && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '90px', fontSize: '0.75rem' }}>Run By:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.runBy?.displayName || testCase.runBy || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '90px', fontSize: '0.75rem' }}>Owner:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.owner?.displayName || testCase.owner || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '90px', fontSize: '0.75rem' }}>Updated By:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.lastUpdatedBy?.displayName || testCase.lastUpdatedBy || 'N/A'}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '90px', fontSize: '0.75rem' }}>Updated Date:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.lastUpdatedDate ? new Date(detailedData.lastUpdatedDate).toLocaleString() : testCase.lastUpdatedDate || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '90px', fontSize: '0.75rem' }}>Created Date:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.lastUpdatedDate ? new Date(detailedData.lastUpdatedDate).toLocaleString() : 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '90px', fontSize: '0.75rem' }}>Revision:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testCaseRevision || testCase.testCaseRevision || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* Additional Information Section */}
                <Paper sx={{ p: 1.5, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Additional Information
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSection('additional')}
                      sx={{ color: '#666', p: 0.5 }}
                    >
                      {expandedSections.has('additional') ? '−' : '+'}
                    </IconButton>
                  </Box>
                  {expandedSections.has('additional') && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '100px', fontSize: '0.75rem' }}>Test Point ID:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.testPoint?.id || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '100px', fontSize: '0.75rem' }}>Custom Fields:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{detailedData.customFields?.length || 0} custom field(s)</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: '100px', fontSize: '0.75rem' }}>URL:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                            {detailedData.url || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
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

    return (
      <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
        
        {isLoadingDetail && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Loading detailed information...</Typography>
          </Box>
        )}
        
        {!isLoadingDetail && (
          <Box sx={{ p: 3, textAlign: 'center', color: '#666' }}>
            <Typography>No detailed information available for this test case.</Typography>
          </Box>
        )}
      </Box>
    )
  }

  if (!hasValidTestRunId) {
    return (
        <div style={{ 
          padding: 40, 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderRadius: 8
        }}>
        <h3>Invalid Test Run ID</h3>
        <p>The test run ID "{testRunId}" is not valid.</p>
        <p>Please select a valid test run from the list.</p>
        </div>
    )
  }

  const logImageLoadingStats = () => {
    // Image loading statistics logging removed
  }

  // Log image loading stats when attachments change
  useEffect(() => {
    if (attachments.size > 0) {
      logImageLoadingStats()
    }
  }, [attachments, authenticatedImageUrls, failedImages, loadingImages])

  const logImageStates = () => {
    // Image states logging removed
  }

  // Log image states when they change
  useEffect(() => {
    if (attachments.size > 0) {
      logImageStates()
    }
  }, [attachments, authenticatedImageUrls, failedImages, loadingImages])

  // Debug panel for image loading statistics
  const ImageLoadingDebugPanel = () => {
    if (!debugMode) return null
    
    const totalImages = Array.from(attachments.values()).flat().filter(att => isImageFile(att.fileName)).length
    const loadedImages = authenticatedImageUrls.size
    const failedImagesCount = failedImages.size
    const loadingImagesCount = loadingImages.size
    const successRate = totalImages > 0 ? ((loadedImages / totalImages) * 100).toFixed(1) : 'N/A'
    
    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, fontSize: '0.75rem' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
          🐛 Image Loading Debug
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <span>Total: {totalImages}</span>
          <span>Loaded: {loadedImages}</span>
          <span>Failed: {failedImagesCount}</span>
          <span>Loading: {loadingImagesCount}</span>
          <span>Success Rate: {successRate}%</span>
        </Box>
        {failedImagesCount > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#d32f2f' }}>
              Failed Images: {Array.from(failedImages).join(', ')}
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  const handleImageTimeout = (attachmentId: number) => {
    // Mark as failed due to timeout
    setFailedImages(prev => {
      const newSet = new Set(prev)
      newSet.add(attachmentId)
      return newSet
    })
    
    // Remove from loading state
    setLoadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(attachmentId)
      return newSet
    })
    
    // Show timeout notification
    setNotification({
      open: true,
      message: 'Image load timeout - please check your connection and try again',
      severity: 'info'
    })
  }

  // Set timeout for each image loading
  useEffect(() => {
    const timeouts = new Map<number, number>()
    
    loadingImages.forEach(attachmentId => {
      const timeout = setTimeout(() => {
        handleImageTimeout(attachmentId)
      }, 30000) // 30 second timeout for individual images
      
      timeouts.set(attachmentId, timeout)
    })
    
    return () => {
      // Clear all timeouts on cleanup
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [loadingImages])







  const validateImageStates = () => {
    const allAttachments = Array.from(attachments.values()).flat()
    const imageAttachments = allAttachments.filter(att => isImageFile(att.fileName))
    
    // Check for state inconsistencies
    const inconsistencies: string[] = []
    
    imageAttachments.forEach(att => {
      const isLoaded = authenticatedImageUrls.has(att.id)
      const isLoading = loadingImages.has(att.id)
      const isFailed = failedImages.has(att.id)
      
      // An image can't be in multiple states at once
      if (isLoaded && isLoading) {
        inconsistencies.push(`${att.fileName}: Both loaded and loading`)
      }
      if (isLoaded && isFailed) {
        inconsistencies.push(`${att.fileName}: Both loaded and failed`)
      }
      if (isLoading && isFailed) {
        inconsistencies.push(`${att.fileName}: Both loading and failed`)
      }
      
      // An image should be in at least one state
      if (!isLoaded && !isLoading && !isFailed) {
        inconsistencies.push(`${att.fileName}: No state set`)
      }
    })
    
    if (inconsistencies.length > 0) {
      if (debugMode) {
        console.warn('Image state inconsistencies detected:', inconsistencies)
      }
      
      // Fix inconsistencies by resetting problematic states
      inconsistencies.forEach(inconsistency => {
        const fileName = inconsistency.split(':')[0]
        const attachment = imageAttachments.find(att => att.fileName === fileName)
        if (attachment) {
          // Reset all states for this image
          setAuthenticatedImageUrls(prev => {
            const newMap = new Map(prev)
            newMap.delete(attachment.id)
            return newMap
          })
          
          setFailedImages(prev => {
            const newSet = new Set(prev)
            newSet.delete(attachment.id)
            return newSet
          })
          
          setLoadingImages(prev => {
            const newSet = new Set(prev)
            newSet.delete(attachment.id)
            return newSet
          })
          
          // Reset the image state - it will load directly from API
          setFailedImages(prev => {
            const newSet = new Set(prev)
            newSet.delete(attachment.id)
            return newSet
          })
        }
      })
    }
  }

  // Validate image states periodically
  useEffect(() => {
    if (attachments.size > 0) {
      const interval = setInterval(validateImageStates, 5000) // Check every 5 seconds
      return () => clearInterval(interval)
    }
  }, [attachments, authenticatedImageUrls, failedImages, loadingImages])

  // Cleanup unused blob URLs periodically
  useEffect(() => {
    if (attachments.size > 0) {
      const interval = setInterval(() => {
        // Find and revoke blob URLs that are no longer in use
        authenticatedImageUrls.forEach((blobUrl, attachmentId) => {
          if (blobUrl.startsWith('blob:')) {
            // Check if this attachment is still being displayed
            const isStillUsed = Array.from(attachments.values())
              .flat()
              .some(att => att.id === attachmentId)
            
            if (!isStillUsed) {
              URL.revokeObjectURL(blobUrl)
              
              // Remove from the map
              setAuthenticatedImageUrls(prev => {
                const newMap = new Map(prev)
                newMap.delete(attachmentId)
                return newMap
              })
            }
          }
        })
      }, 30000) // Check every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [attachments, authenticatedImageUrls])

  const addBlobUrl = (attachmentId: number, blobUrl: string) => {
    // Mark this blob URL as active
    setActiveBlobUrls(prev => {
      const newSet = new Set(prev)
      newSet.add(blobUrl)
      return newSet
    })
    
    // Store the authenticated URL
    setAuthenticatedImageUrls(prev => {
      const newMap = new Map(prev)
      newMap.set(attachmentId, blobUrl)
      return newMap
    })
  }





  // Cleanup blob URLs when attachments are removed
  useEffect(() => {
    return () => {
      // When component unmounts, revoke all active blob URLs
      activeBlobUrls.forEach(blobUrl => {
        URL.revokeObjectURL(blobUrl)
      })
    }
  }, [activeBlobUrls])

  // Final cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to free memory
      authenticatedImageUrls.forEach(blobUrl => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl)
        }
      })
    }
  }, []) // Empty dependency array - only run on unmount

  const regenerateBlobUrl = async (attachment: TestCaseAttachment): Promise<string> => {
    try {
      // Remove the old blob URL
      setAuthenticatedImageUrls(prev => {
        const newMap = new Map(prev)
        newMap.delete(attachment.id)
        return newMap
      })
      
      // Get a new authenticated URL
      const newUrl = await getAuthenticatedImageUrl(attachment)
      
      // Add the new blob URL
      addBlobUrl(attachment.id, newUrl)
      
      return newUrl
    } catch (error) {
      console.error(`Failed to regenerate blob URL for ${attachment.fileName}:`, error)
      throw error
    }
  }

  const handlePreviewImageError = async (attachment: TestCaseAttachment) => {
    try {
      // Try to regenerate the blob URL
      const newUrl = await regenerateBlobUrl(attachment)
      
      // Update the preview with the new URL
      setImagePreview(prev => ({
        ...prev,
        imageUrl: newUrl
      }))
    } catch (error) {
      console.error(`Failed to regenerate URL for preview: ${attachment.fileName}`, error)
      
      // Show error notification
      setNotification({
        open: true,
        message: `Failed to load image preview: ${attachment.fileName}`,
        severity: 'info'
      })
    }
  }



  const testImageUrl = async (url: string, fileName: string): Promise<{ valid: boolean; status?: number; error?: string }> => {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        return { valid: true, status: response.status }
      } else {
        return { 
          valid: false, 
          status: response.status, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }
      }
    } catch (error: any) {
      console.error(`URL test failed for ${fileName}:`, error)
      return { 
        valid: false, 
        error: error.message || 'Network error' 
      }
    }
  }

  const diagnoseImageFailure = async (attachment: TestCaseAttachment) => {
    // Test the direct URL first
    const directUrlTest = await testImageUrl(attachment.url, attachment.fileName)
    
    // Test the authenticated URL if it exists
    const authenticatedUrl = authenticatedImageUrls.get(attachment.id)
    
    // Check if we have a valid PAT
    const pat = getPAT()
    
    // Check organization and project
    
    return {
      directUrl: directUrlTest,
      authenticatedUrl: authenticatedUrl ? await testImageUrl(authenticatedUrl, `${attachment.fileName} (authenticated)`) : null,
      hasPat: !!pat,
      organization,
      project
    }
  }

  // Cache for image URLs to prevent duplicate API calls
  const imageUrlCache = useRef(new Map<string, string>())
  
  // Debounce mechanism to prevent rapid successive calls
  const loadingStates = useRef(new Map<string, boolean>())

  const getImageUrl = async (attachment: TestCaseAttachment, testCaseId: number): Promise<string> => {
    // Check cache first
    const cacheKey = `${attachment.id}-${testCaseId}`
    const cachedUrl = imageUrlCache.current.get(cacheKey)
    if (cachedUrl) {
      return cachedUrl
    }
    
    // Check if already loading to prevent duplicate requests
    if (loadingStates.current.get(cacheKey)) {
      // Wait for the existing request to complete
      while (loadingStates.current.get(cacheKey)) {
        await new Promise(resolve => setTimeout(resolve, 100))
        // Check cache again in case it was loaded while waiting
        const newCachedUrl = imageUrlCache.current.get(cacheKey)
        if (newCachedUrl) {
          return newCachedUrl
        }
      }
    }
    
    // Mark as loading
    loadingStates.current.set(cacheKey, true)

    // Use the direct API endpoint with proper PAT authentication
    const pat = getPAT()
    if (!pat) {
      // If no PAT, fall back to the original URL
      if (debugMode) {
        console.warn('No PAT available, using original URL')
      }
      return attachment.url
    }
    
    try {
      // Construct the direct API endpoint URL
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${testRunId}/Results/${testCaseId}/Attachments/${attachment.id}`
      
      // Create authenticated request with PAT
      const authHeader = 'Basic ' + btoa(':' + pat)
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      })
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Get the image data as blob
      const blob = await response.blob()
      
      // Create a blob URL from the authenticated response
      const blobUrl = URL.createObjectURL(blob)
      
      // Cache the URL
      imageUrlCache.current.set(cacheKey, blobUrl)
      
      // Clear loading state
      loadingStates.current.delete(cacheKey)
      
      // Store the blob URL for cleanup
      setAuthenticatedImageUrls(prev => {
        const newMap = new Map(prev)
        newMap.set(attachment.id, blobUrl)
        return newMap
      })
      
      return blobUrl
    } catch (error) {
      console.error(`Failed to get authenticated image URL for ${attachment.fileName}:`, error)
      
      // Clear loading state on error
      loadingStates.current.delete(cacheKey)
      
      // Fall back to original URL if authentication fails
      return attachment.url
    }
  }

  // Component to handle authenticated image loading
  const ImageWithAuth: React.FC<{
    attachment: TestCaseAttachment
    testCaseId: number
    onLoad: () => void
    onError: (error: any) => void
  }> = React.memo(({ attachment, testCaseId, onLoad, onError }) => {
    const [imageUrl, setImageUrl] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    // Memoize the callbacks to prevent unnecessary re-renders
    const stableOnLoad = React.useCallback(onLoad, [])
    const stableOnError = React.useCallback(onError, [])

    useEffect(() => {
      // Prevent duplicate API calls
      if (hasLoaded && imageUrl) {
        return
      }

      let isCancelled = false

      const loadImage = async () => {
        try {
          setIsLoading(true)
          setHasError(false)
          
          const url = await getImageUrl(attachment, testCaseId)
          
          // Check if component is still mounted and hasn't been cancelled
          if (!isCancelled) {
            setImageUrl(url)
            setHasLoaded(true)
            setIsLoading(false)
          }
        } catch (error) {
          console.error(`Failed to load image ${attachment.fileName}:`, error)
          if (!isCancelled) {
            setHasError(true)
            setIsLoading(false)
            stableOnError(error)
          }
        }
      }

      loadImage()

      // Cleanup function to prevent setting state on unmounted component
      return () => {
        isCancelled = true
      }
    }, [attachment.id, testCaseId, stableOnError])

    // Reset state when attachment changes
    useEffect(() => {
      setImageUrl('')
      setIsLoading(true)
      setHasError(false)
      setHasLoaded(false)
    }, [attachment.id])

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress size={24} sx={{ color: '#1976d2' }} />
        </Box>
      )
    }

    if (hasError || !imageUrl) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#666',
          fontSize: '0.875rem'
        }}>
          Failed to load
        </Box>
      )
    }

    return (
      <img
        src={imageUrl}
        alt={attachment.fileName}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
        onLoad={stableOnLoad}
        onError={stableOnError}
      />
    )
  })

  return (
    <Box>
      {updateTestCaseResult.isPending && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <span style={{ fontSize: 14, color: '#666' }}>Updating...</span>
        </Box>
      )}
      
      {/* Custom Table with Inline Expansion */}
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 1, 
        overflow: 'hidden',
        backgroundColor: 'background.paper'
      }}>
        {/* Table Header */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '3fr 1fr 1fr 0.5fr 1fr 1fr 0.5fr',
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          fontSize: 14,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Test Case Title</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Outcome</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>State</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Priority</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Started</Box>
          <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>Completed</Box>
          <Box sx={{ p: 2 }}>Duration</Box>
        </Box>

        {/* Table Rows */}
        {rows.map((row) => (
          <React.Fragment key={row.id}>
            {/* Main Row */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '3fr 1fr 1fr 0.5fr 1fr 1fr 0.5fr',
              borderBottom: '1px solid #e0e0e0',
              '&:hover': { backgroundColor: '#f5f5f5' },
              fontSize: 14
            }}>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                <Box
                  sx={{
                    cursor: 'pointer',
                    color: '#1976d2',
                    textDecoration: 'underline',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      color: '#1565c0',
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => handleTitleClick(row.id)}
                >
                  <span style={{ fontSize: '12px' }}>
                    {expandedRows.has(row.id) ? '▼' : '▶'}
                  </span>
                  {row.testCaseTitle}
                </Box>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={row.outcome}
                    onChange={(e) => handleOutcomeChange(row.id, e.target.value)}
                    disabled={updateTestCaseResult.isPending}
                    sx={{
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: row.outcome === 'Passed' ? '#4caf50' : 
                               row.outcome === 'Failed' ? '#f44336' : 
                               row.outcome === 'Blocked' ? '#ff9800' : '#757575'
                      }
                    }}
                  >
                    <MenuItem value="Passed">Passed</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                    <MenuItem value="Blocked">Blocked</MenuItem>
                    <MenuItem value="NotApplicable">N/A</MenuItem>
                    <MenuItem value="NotExecuted">Not Executed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{row.state}</Box>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>{row.priority}</Box>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                {row.startedDate ? new Date(row.startedDate).toLocaleString() : 'N/A'}
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
                {row.completedDate ? new Date(row.completedDate).toLocaleString() : 'N/A'}
              </Box>
              <Box sx={{ p: 2 }}>
                {row.durationInMs ? Math.round(Number(row.durationInMs) / 1000) + 's' : 'N/A'}
              </Box>
            </Box>

            {/* Expanded Detail Row */}
            {expandedRows.has(row.id) && (
              <Box sx={{ 
                gridColumn: '1 / -1',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {renderTestCaseDetail(row as TestCaseDetail)}
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading test cases. Please try refreshing the page.
        </Alert>
      )}
      
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
              <Typography variant="body2">Test Run ID: {testRunId}</Typography>
              <Typography variant="body2">Has Valid Test Run ID: {hasValidTestRunId ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Error: {isError ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Total Rows: {rows.length}</Typography>
              <Typography variant="body2">Expanded Rows: {Array.from(expandedRows).join(', ')}</Typography>
              <Typography variant="body2">Detailed Data Keys: {Array.from(detailedTestCases.keys()).join(', ')}</Typography>
              <Typography variant="body2">Organization: {organization}</Typography>
              <Typography variant="body2">Project: {project}</Typography>
              <Typography variant="body2">Update Pending: {updateTestCaseResult.isPending ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Update Success: {updateTestCaseResult.isSuccess ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Update Error: {updateTestCaseResult.isError ? 'Yes' : 'No'}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Modal */}
      <Modal
        open={imagePreview.open}
        onClose={closeImagePreview}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            backgroundColor: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              display: 'flex',
              gap: 1
            }}
          >
            <IconButton
              onClick={closeImagePreview}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
              {imagePreview.fileName}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#000',
            minHeight: '400px'
          }}>
            <img
              src={imagePreview.imageUrl}
              alt={imagePreview.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onLoad={() => {
                // Hide any fallback UI
                const fallback = document.querySelector('.modal-image-fallback') as HTMLElement
                if (fallback) {
                  fallback.style.display = 'none'
                }
              }}
              onLoadStart={() => {
                // Image preview loading started
              }}
              onError={(e) => {
                console.error(`Image preview failed to load: ${imagePreview.fileName}`, e)
                console.error(`Failed URL: ${imagePreview.imageUrl}`)
                

                
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.modal-image-fallback')
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex'
                }
              }}
            />
            <Box
              className="modal-image-fallback"
              sx={{
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1rem',
                textAlign: 'center',
                p: 4
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Image Preview Unavailable</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Unable to load the image preview.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                  label="Retry"
                  variant="outlined"
                  onClick={() => {
                    if (imagePreview.attachment) {
                      handlePreviewImageError(imagePreview.attachment)
                    }
                  }}
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip
                  label="Open in New Tab"
                  variant="outlined"
                  onClick={() => window.open(imagePreview.imageUrl, '_blank')}
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>
      {ImageLoadingDebugPanel()}
    </Box>
  )
}

export default TestRunDetails