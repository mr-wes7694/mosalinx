
import { API_BASE_URL } from '../config/api'

const WORKSPACE_FILES_URL = `${API_BASE_URL}/api/workspace-files`

const FILE_CATEGORIES = {
  document: 'Documents',
  spreadsheet: 'Spreadsheets',
  presentation: 'Presentations',
  sql: 'Database',
  code: 'Source',
}

// Keep frontend-only state out of persisted editor content.
function serializeWorkspaceContent(node) {
  const content = { ...node }

  for (const key of [
    'id',
    'type',
    'dirty',
    'revision',
    'resourceId',
    'resource_id',
  ]) {
    delete content[key]
  }

  return content
}

// Send authenticated requests to the Workspace file API.
async function requestWorkspaceFile(user, path, options = {}) {
  if (!user) {
    throw new Error('Authenticated user is required.')
  }

  const token = await user.getIdToken()

  let response

  try {
    response = await fetch(`${WORKSPACE_FILES_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to connect to Workspace files. Please try again.')
  }

  let data

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.message || 'Workspace file request failed.')
  }

  return data
}

// Create a new file and persist its initial content.
export async function createWorkspaceFile(user, projectId, node) {
  const category = FILE_CATEGORIES[node.type]

  if (!category) {
    throw new Error('Unsupported Workspace file type.')
  }

  const content = serializeWorkspaceContent(node)

  return requestWorkspaceFile(user, '', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      name: node.name,
      fileType: node.type,
      category,
      content,
    }),
  })
}

// Save changes to an existing persisted Workspace file.
export async function updateWorkspaceFile(user, resourceId, node) {
  const category = FILE_CATEGORIES[node.type]

  if (!category) {
    throw new Error('Unsupported Workspace file type.')
  }

  const content = serializeWorkspaceContent(node)

  return requestWorkspaceFile(user, `/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: node.name,
      category,
      content,
    }),
  })
}

// Retrieve saved files for the active project.
export async function listWorkspaceFiles(user, projectId) {
  return requestWorkspaceFile(user, `/project/${projectId}`)
}

// Retrieve a saved file and its content.
export async function getWorkspaceFile(user, resourceId) {
  return requestWorkspaceFile(user, `/${resourceId}`)
}
