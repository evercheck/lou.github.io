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
  Chip,
  Divider
} from '@mui/material'
import { Security, Settings } from '@mui/icons-material'
import { 
  getPAT, 
  setPAT, 
  hasEnvPAT 
} from '../utils/auth'
import { 
  getOrganization, 
  getProject, 
  setOrganization, 
  setProject, 
  hasEnvConfig,
  hasEnvOrganization,
  hasEnvProject
} from '../utils/config'

interface CombinedInputProps {
  onSubmit: (pat: string, organization: string, project: string) => void
  isLoading?: boolean
}

const CombinedInput: React.FC<CombinedInputProps> = ({ onSubmit, isLoading = false }) => {
  const [pat, setPatState] = useState(getPAT() || '')
  const [organization, setOrganizationState] = useState(getOrganization() || '')
  const [project, setProjectState] = useState(getProject() || '')
  const [errors, setErrors] = useState<{ pat?: string; organization?: string; project?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    const newErrors: { pat?: string; organization?: string; project?: string } = {}
    
    if (!pat.trim()) {
      newErrors.pat = 'Personal Access Token is required'
    }
    
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
    setPAT(pat.trim())
    setOrganization(organization.trim())
    setProject(project.trim())
    
    // Call parent handler
    onSubmit(pat.trim(), organization.trim(), project.trim())
  }

  const handlePatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatState(e.target.value)
    if (errors.pat) {
      setErrors(prev => ({ ...prev, pat: undefined }))
    }
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
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Azure DevOps Access
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Enter your Azure DevOps credentials and project details
              </Typography>
            </Box>

            {/* Environment Variable Status */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {hasEnvPAT() && (
                <Chip
                  icon={<Security />}
                  label="Env PAT"
                  size="small"
                  color="success"
                />
              )}
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

            {hasEnvConfig() && (
              <Alert severity="success" sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  Configuration loaded from environment variables. You can still override values below.
                </Typography>
              </Alert>
            )}

            {!hasEnvConfig() && (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2">
                  No environment configuration found. Please enter your Azure DevOps details below.
                </Typography>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Authentication Section */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'left', mb: 2 }}>
                    Authentication
                  </Typography>
                  <TextField
                    fullWidth
                    label="Personal Access Token"
                    type="password"
                    value={pat}
                    onChange={handlePatChange}
                    error={!!errors.pat}
                    helperText={errors.pat || 'Your Azure DevOps Personal Access Token'}
                    disabled={isLoading || hasEnvPAT()}
                    placeholder="Enter your PAT"
                    required
                  />
                </Box>

                <Divider />

                {/* Configuration Section */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'left', mb: 2 }}>
                    Project Configuration
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Organization"
                    value={organization}
                    onChange={handleOrganizationChange}
                    error={!!errors.organization}
                    helperText={errors.organization || 'Your Azure DevOps organization name'}
                    disabled={isLoading || hasEnvOrganization()}
                    placeholder="e.g., contoso"
                    required
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Project"
                    value={project}
                    onChange={handleProjectChange}
                    error={!!errors.project}
                    helperText={errors.project || 'Your Azure DevOps project name'}
                    disabled={isLoading || hasEnvProject()}
                    placeholder="e.g., MyProject"
                    required
                  />
                </Box>
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {isLoading ? 'Connecting...' : 'Connect to Azure DevOps'}
                </Button>
              </Stack>
            </form>

            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                All values are stored only in memory for this session and are never saved to disk.
              </Typography>
            </Alert>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}

export default CombinedInput 