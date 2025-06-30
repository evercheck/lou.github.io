# Test Run Viewer

A React application for viewing and managing Azure DevOps test runs and their results.

## Features

- **Test Run List**: View all test runs in your Azure DevOps project with filtering capabilities
- **Test Run Details**: View individual test cases within a test run with the ability to update outcomes
- **Real-time Updates**: Update test case outcomes directly in the interface
- **Filtering**: Filter test runs by state, build number, and name
- **Responsive Design**: Modern UI built with Material-UI components

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables (Optional)**
   - Create a `.env` file in the root directory with your Azure DevOps settings:
   ```bash
   # Azure DevOps Configuration
   VITE_PAT=your_personal_access_token_here
   VITE_ORGANIZATION=your_organization_name_here
   VITE_PROJECT=your_project_name_here
   VITE_API_VERSION=7.1
   ```
   - If you don't set environment variables, you can enter them through the UI
   - **Note**: Organization and Project are now required like the PAT - no default values are provided

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Authentication and Configuration**
   - If no environment variables are set, you'll be prompted to enter all required information in a single form:
     - Personal Access Token (PAT) - Required for API access
     - Organization name - Your Azure DevOps organization
     - Project name - Your Azure DevOps project
   - All values are stored only in memory for the current session
   - Make sure your PAT has the necessary permissions to read test runs and test results

## Usage

### Viewing All Test Runs
1. After entering your PAT, you'll see a list of all test runs in your project
2. Use the filters at the top to search by name, filter by state, or filter by build number
3. Click the "View" button on any test run to see its details

### Viewing Test Run Details
1. From the test run list, click "View" on any test run
2. You'll see all test cases in that test run with their current outcomes
3. Click on the "Outcome" column to edit test case results
4. Use the "Back to Test Runs" button to return to the list

### Updating Test Case Outcomes
1. In the test run details view, click on any "Outcome" cell
2. Select the new outcome from the dropdown
3. The change will be automatically saved to Azure DevOps

## API Permissions Required

Your Azure DevOps Personal Access Token needs the following permissions:
- Test Management (Read & Write)
- Test Results (Read & Write)

## Development

The application is built with:
- React 19
- TypeScript
- Material-UI (MUI)
- TanStack Query for data fetching
- Vite for build tooling

### Project Structure
```
src/
├── components/
│   ├── TestRunList.tsx       # Main test run list view
│   ├── TestRunDetails.tsx    # Individual test run details
│   ├── TestCaseList.tsx      # Test cases list view
│   ├── PATInput.tsx          # PAT input component (legacy)
│   ├── ConfigInput.tsx       # Organization/Project input component (legacy)
│   └── CombinedInput.tsx     # Combined PAT, Organization, Project input
├── hooks/
│   ├── useTestPlanApi.ts      # API hooks for test cases
│   └── useTestRunQueryApi.ts  # API hooks for test runs
└── utils/
    ├── auth.ts               # Authentication utilities
    └── config.ts             # Configuration utilities
```

## Troubleshooting

- **No test runs appear**: Check that your PAT has the correct permissions and that your organization/project settings are correct
- **Cannot update test results**: Ensure your PAT has write permissions for test management
- **API errors**: Verify your Azure DevOps organization and project names are correct
- **Configuration errors**: Ensure all required fields (PAT, Organization, Project) are provided either via environment variables or UI input
