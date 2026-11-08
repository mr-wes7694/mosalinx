import { API_BASE_URL } from '../config/api'

const ACTIVITY_URL = `${API_BASE_URL}/api/projects`

// Retrieve authenticated activity records for a project.
export async function getProjectActivity(user, projectId) {
  if (!user) {
    throw new Error('Please sign in to view project activity.')
  }

  if (!projectId) {
    throw new Error('Select a project to view its activity.')
  }

  let token

  try {
    token = await user.getIdToken()
  } catch {
    throw new Error('Unable to verify your sign-in. Please sign in again.')
  }

  let response

  try {
    response = await fetch(
      `${ACTIVITY_URL}/${encodeURIComponent(projectId)}/activity`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
  } catch {
    throw new Error('Unable to connect to project activity. Please try again.')
  }

  let data

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.message || 'Unable to retrieve project activity.')
  }

  return Array.isArray(data.activities) ? data.activities : []
}