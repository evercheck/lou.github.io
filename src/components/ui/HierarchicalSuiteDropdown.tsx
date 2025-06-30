import React, { useMemo } from 'react'
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  Typography
} from '@mui/material'
import type { TestSuite } from '../../types'

interface HierarchicalSuiteDropdownProps {
  suites: TestSuite[]
  selectedSuiteId: number | ''
  onSuiteChange: (suiteId: number | '') => void
  disabled?: boolean
  label?: string
  showFullPath?: boolean
}

interface SuiteNode {
  suite: TestSuite
  level: number
  children: SuiteNode[]
}

const HierarchicalSuiteDropdown: React.FC<HierarchicalSuiteDropdownProps> = ({
  suites,
  selectedSuiteId,
  onSuiteChange,
  disabled = false,
  label = "Test Suite",
  showFullPath = false
}) => {
  // Build hierarchical tree from flat list
  const suiteTree = useMemo(() => {
    const suiteMap = new Map<number, SuiteNode>()
    const rootNodes: SuiteNode[] = []

    // First pass: create nodes for all suites
    suites.forEach(suite => {
      suiteMap.set(suite.id, {
        suite,
        level: 0,
        children: []
      })
    })

    // Second pass: build parent-child relationships
    suites.forEach(suite => {
      const node = suiteMap.get(suite.id)!
      
      if (suite.parentSuite) {
        const parentNode = suiteMap.get(suite.parentSuite.id)
        if (parentNode) {
          parentNode.children.push(node)
          node.level = parentNode.level + 1
        } else {
          // Parent not found, treat as root
          rootNodes.push(node)
        }
      } else {
        // No parent, treat as root
        rootNodes.push(node)
      }
    })



    return rootNodes
  }, [suites])

  // Get full path for a suite
  const getSuitePath = (suiteId: number): string => {
    const suiteMap = new Map<number, TestSuite>()
    suites.forEach(suite => suiteMap.set(suite.id, suite))
    
    const path: string[] = []
    let currentSuite = suiteMap.get(suiteId)
    
    while (currentSuite) {
      path.unshift(currentSuite.name)
      if (currentSuite.parentSuite) {
        currentSuite = suiteMap.get(currentSuite.parentSuite.id)
      } else {
        break
      }
    }
    
    return path.join(' > ')
  }

  // Flatten tree for display in dropdown
  const flattenedSuites = useMemo(() => {
    const result: Array<{ suite: TestSuite; level: number }> = []
    
    const traverse = (nodes: SuiteNode[]) => {
      nodes.forEach(node => {
        result.push({ suite: node.suite, level: node.level })
        if (node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    
    traverse(suiteTree)
    return result
  }, [suiteTree])

  const renderMenuItem = (suite: TestSuite, level: number) => {
    const hasChildren = suite.hasChildren || false
    
    return (
      <MenuItem 
        key={suite.id} 
        value={suite.id}
        sx={{ 
          pl: 2 + (level * 2), // Indent based on level
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: '40px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* Indentation and hierarchy indicators */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: level * 16, // Space for indentation
            flexShrink: 0
          }}>
            {level > 0 && (
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                width: '100%'
              }}>
                <Box sx={{ 
                  width: '2px', 
                  height: '16px', 
                  backgroundColor: 'primary.main',
                  mr: 1,
                  borderRadius: '1px'
                }} />
              </Box>
            )}
          </Box>
          
          {/* Suite name and details */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flex: 1,
            minWidth: 0 
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: hasChildren ? 600 : 400
                }}
              >
                {suite.name}
              </Typography>
              {showFullPath && level > 0 && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                >
                  {getSuitePath(suite.id)}
                </Typography>
              )}
            </Box>
            {suite.testCaseCount !== undefined && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ ml: 1, flexShrink: 0 }}
              >
                ({suite.testCaseCount} cases)
              </Typography>
            )}
          </Box>
          
          {/* Folder icon for suites with children */}
          {hasChildren && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ ml: 1, flexShrink: 0 }}
            >
              📁
            </Typography>
          )}
        </Box>
      </MenuItem>
    )
  }

  // Get selected suite name for display
  const selectedSuite = suites.find(suite => suite.id === selectedSuiteId)
  const selectedSuitePath = selectedSuite && showFullPath ? getSuitePath(selectedSuite.id) : selectedSuite?.name

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={selectedSuiteId}
        label={label}
        onChange={(e) => onSuiteChange(e.target.value as number | '')}
        disabled={disabled}
        renderValue={(value) => {
          if (!value) return <em>Select a test suite</em>
          
          // For root suites (no parent), show just the name
          // For child suites, show the full path
          const isRootSuite = !selectedSuite?.parentSuite
          
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {isRootSuite ? (
                <Typography variant="body2">{selectedSuite?.name}</Typography>
              ) : (
                <Typography variant="body2">{selectedSuitePath}</Typography>
              )}
            </Box>
          )
        }}
      >
        <MenuItem value="">
          <em>Select a test suite</em>
        </MenuItem>
        {flattenedSuites.map(({ suite, level }) => 
          renderMenuItem(suite, level)
        )}
      </Select>
    </FormControl>
  )
}

export default HierarchicalSuiteDropdown 