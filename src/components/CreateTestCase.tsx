import React, { useState } from 'react'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert,
  Chip
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { getPAT } from '../utils/auth'

interface CreateTestCaseProps {
  organization: string
  project: string
  planId: number
  suiteId: number
}

const CreateTestCase: React.FC<CreateTestCaseProps> = ({ organization, project, planId, suiteId }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '3', // Default to Medium
    state: 'Design' // Default to Design
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const pat = getPAT()
      if (!pat) {
        throw new Error('Personal Access Token not found')
      }

      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=7.1`
      
      const requestBody = {
        title: formData.title,
        description: formData.description,
        priority: parseInt(formData.priority),
        state: formData.state
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`:${pat}`)}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create test case: ${response.status} ${response.statusText} - ${errorText}`)
      }

      setSuccess('Test case created successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: '3',
        state: 'Design'
      })

      // Navigate back to test cases list after a short delay
      setTimeout(() => {
        navigate('/test-cases')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the test case')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/test-cases')
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create Test Case
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Test Case Details
                </Typography>
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Organization:</strong> {organization} | <strong>Project:</strong> {project} | 
                    <strong>Plan ID:</strong> {planId} | <strong>Suite ID:</strong> {suiteId}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Test Case Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={4}
                  disabled={isLoading}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      disabled={isLoading}
                    >
                      <MenuItem value="1">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="Critical" color="error" size="small" />
                          Critical
                        </Box>
                      </MenuItem>
                      <MenuItem value="2">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="High" color="warning" size="small" />
                          High
                        </Box>
                      </MenuItem>
                      <MenuItem value="3">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="Medium" color="info" size="small" />
                          Medium
                        </Box>
                      </MenuItem>
                      <MenuItem value="4">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="Low" color="default" size="small" />
                          Low
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <FormControl fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      value={formData.state}
                      label="State"
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={isLoading}
                    >
                      <MenuItem value="Design">Design</MenuItem>
                      <MenuItem value="Ready">Ready</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                      <MenuItem value="Resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate('/test-cases')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Test Case'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CreateTestCase 