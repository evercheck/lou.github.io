import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tabs, Tab, Box } from '@mui/material'
import { PlaylistPlay, Assignment } from '@mui/icons-material'

interface NavigationProps {
  organization: string
  project: string
  onTabChange?: (tabName: string) => void
}

const Navigation: React.FC<NavigationProps> = ({ onTabChange }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const getCurrentTab = () => {
    if (location.pathname.startsWith('/test-cases')) {
      return 1
    }
    if (location.pathname.startsWith('/test-run/')) {
      return 0 // Test run detail pages should highlight the Test Runs tab
    }
    return 0 // Default to test runs
  }

  // Individual onClick handlers are used for each tab instead of a global onChange handler

  // Track route changes and notify parent component
  // Removed this useEffect as it was interfering with navigation

  // Handle initial route on component mount
  useEffect(() => {
    const currentTab = getCurrentTab()
    if (currentTab === 0) {
      onTabChange?.('test-runs')
    } else if (currentTab === 1) {
      onTabChange?.('test-cases')
    }
  }, []) // Empty dependency array means this runs only once on mount

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
      <Tabs 
        value={getCurrentTab()} 
        aria-label="Test management navigation"
        sx={{
          '& .MuiTab-root': {
            minHeight: 64,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500
          }
        }}
      >
        <Tab 
          label="Test Runs" 
          icon={<PlaylistPlay />} 
          iconPosition="start"
          onClick={() => {
            navigate('/test-runs')
            onTabChange?.('test-runs')
          }}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer'
          }}
        />
        <Tab 
          label="Test Cases" 
          icon={<Assignment />} 
          iconPosition="start"
          onClick={() => {
            navigate('/test-cases')
            onTabChange?.('test-cases')
          }}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer'
          }}
        />
      </Tabs>
    </Box>
  )
}

export default Navigation 