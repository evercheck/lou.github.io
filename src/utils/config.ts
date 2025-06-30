// Check for organization and project from environment variables first, then fall back to in-memory storage
let _organization: string | null = null
let _project: string | null = null

// Get organization from environment variable if available
function getEnvOrganization(): string | null {
  return import.meta.env.VITE_ORGANIZATION || null
}

// Get project from environment variable if available
function getEnvProject(): string | null {
  return import.meta.env.VITE_PROJECT || null
}

export function setOrganization(organization: string) {
  _organization = organization
}

export function setProject(project: string) {
  _project = project
}

export function getOrganization(): string | null {
  // First check environment variable
  const envOrg = getEnvOrganization()
  if (envOrg) {
    return envOrg
  }
  
  // Fall back to in-memory storage
  return _organization
}

export function getProject(): string | null {
  // First check environment variable
  const envProject = getEnvProject()
  if (envProject) {
    return envProject
  }
  
  // Fall back to in-memory storage
  return _project
}

export function clearOrganization() {
  _organization = null
}

export function clearProject() {
  _project = null
}

export function hasEnvOrganization(): boolean {
  return !!getEnvOrganization()
}

export function hasEnvProject(): boolean {
  return !!getEnvProject()
}

export function hasEnvConfig(): boolean {
  return hasEnvOrganization() && hasEnvProject()
} 