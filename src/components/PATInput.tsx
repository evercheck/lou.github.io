import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Container,
  Stack
} from '@mui/material';
import { Visibility, VisibilityOff, Security, Info } from '@mui/icons-material';

interface PATInputProps {
  onSubmit: (pat: string) => void;
  isLoading?: boolean;
}

const PATInput: React.FC<PATInputProps> = ({ onSubmit, isLoading = false }) => {
  const [pat, setPat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pat.trim()) {
      setError('Please enter your Personal Access Token');
      return;
    }

    if (pat.length < 10) {
      setError('Token appears to be too short. Please check your token.');
      return;
    }

    setError('');
    onSubmit(pat);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPat(e.target.value);
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
                Enter your Personal Access Token to continue
              </Typography>
            </Box>

            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                Your PAT is stored only in memory for this session and is never saved to disk.
              </Typography>
            </Alert>

            <Alert severity="success" sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  <strong>Tip:</strong> You can set VITE_PAT in your .env file to automatically use a PAT without entering it here.
                </Typography>
              </Box>
            </Alert>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Personal Access Token"
                  type={showPassword ? 'text' : 'password'}
                  value={pat}
                  onChange={handleChange}
                  error={!!error}
                  helperText={error}
                  autoComplete="off"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading || !pat.trim()}
                  sx={{ py: 1.5 }}
                >
                  {isLoading ? 'Connecting...' : 'Continue'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Need help?{' '}
                <a
                  href="https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit' }}
                >
                  Learn how to create a PAT
                </a>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default PATInput; 