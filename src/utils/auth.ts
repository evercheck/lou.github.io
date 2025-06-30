// Check for PAT from environment variables first, then fall back to in-memory storage
let _pat: string | null = null

// Get PAT from environment variable if available
function getEnvPAT(): string | null {
  return import.meta.env.VITE_PAT || null
}

export function setPAT(pat: string) {
  _pat = pat
}

export function getPAT(): string | null {
  // First check environment variable
  const envPat = getEnvPAT()
  if (envPat) {
    return envPat
  }
  
  // Fall back to in-memory storage
  return _pat
}

export function clearPAT() {
  _pat = null
}

export function hasEnvPAT(): boolean {
  return !!getEnvPAT()
}