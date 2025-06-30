import React from 'react'
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import type { FilterState } from '../../types'
import { VALID_STATES } from '../../config'

interface TestRunFiltersProps {
  filters: FilterState
  onFilterChange: (field: keyof FilterState, value: string) => void
}

const TestRunFilters: React.FC<TestRunFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <TextField
        label="Search by name"
        value={filters.name}
        onChange={(e) => onFilterChange('name', e.target.value)}
        size="small"
        sx={{ minWidth: 200 }}
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>State</InputLabel>
        <Select
          value={filters.state}
          label="State"
          onChange={(e) => onFilterChange('state', e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {VALID_STATES.map((state) => (
            <MenuItem key={state} value={state}>{state}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default TestRunFilters 