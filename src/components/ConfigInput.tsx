import React, { useState } from 'react'
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack, 
  Alert,
  Chip
} from '@mui/material'
import { Settings } from '@mui/icons-material'
import { 
  getOrganization, 
  getProject, 
  setOrganization, 
  setProject, 
  hasEnvConfig,
  hasEnvOrganization,
  hasEnvProject
} from '../utils/config'

interface ConfigInputProps {
  onSubmit: (organization: string, project: string) => void
  isLoading?: boolean
}

const ConfigInput: React.FC<ConfigInputProps> = ({ onSubmit, isLoading = false }) => {
  const [organization, setOrganizationState] = useState(getOrganization() || '')
  const [project, setProjectState] = useState(getProject() || '')
  const [errors, setErrors] = useState<{ organization?: string; project?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    const newErrors: { organization?: string; project?: string } = {}
    
    if (!organization.trim()) {
      newErrors.organization = 'Organization is required'
    }
    
    if (!project.trim()) {
      newErrors.project = 'Project is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Store in memory
    setOrganization(organization.trim())
    setProject(project.trim())
    
    // Call parent handler
    onSubmit(organization.trim(), project.trim())
  }

  const handleOrganizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrganizationState(e.target.value)
    if (errors.organization) {
      setErrors(prev => ({ ...prev, organization: undefined }))
    }
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectState(e.target.value)
    if (errors.project) {
      setErrors(prev => ({ ...prev, project: undefined }))
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 500,
            textAlign: 'center'
          }}
        >
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Settings sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Azure DevOps Configuration
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Enter your organization and project details
              </Typography>
            </Box>

            {hasEnvConfig() && (
              <Alert severity="success" sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  Configuration loaded from environment variables.
                </Typography>
              </Alert>
            )}

            {!hasEnvConfig() && (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  No environment configuration found. Please enter your organization and project details.
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {hasEnvOrganization() && (
                <Chip
                  icon={<Settings />}
                  label="Env Organization"
                  size="small"
                  color="success"
                />
              )}
              {hasEnvProject() && (
                <Chip
                  icon={<Settings />}
                  label="Env Project"
                  size="small"
                  color="success"
                />
              )}
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Organization"
                  value={organization}
                  onChange={handleOrganizationChange}
                  error={!!errors.organization}
                  helperText={errors.organization}
                  disabled={isLoading || hasEnvOrganization()}
                  placeholder="e.g., contoso"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Project"
                  value={project}
                  onChange={handleProjectChange}
                  error={!!errors.project}
                  helperText={errors.project}
                  disabled={isLoading || hasEnvProject()}
                  placeholder="e.g., MyProject"
                  required
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading || hasEnvConfig()}
                  sx={{ mt: 2 }}
                >
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Stack>
            </form>

            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                Configuration is stored only in memory for this session and is never saved to disk.
              </Typography>
            </Alert>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}

export default ConfigInput 