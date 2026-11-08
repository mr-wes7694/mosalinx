import { API_BASE_URL } from '../config/api'

const WORKSPACE_POSTS_URL = `${API_BASE_URL}/api/workspace-posts`

// Send authenticated requests to the Workspace Post API.
export async function createWorkspacePost(user, projectId, postContent, postTitle = '') {
  if (!user) {
    throw new Error('Please sign in before creating a post.')
  }

  if (!projectId) {
    throw new Error('Select a project before creating a post.')
  }

  let token

  try {
    token = await user.getIdToken()
  } catch {
    throw new Error('Unable to verify your sign-in. Please sign in again.')
  }

  let response

  try {
    response = await fetch(WORKSPACE_POSTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        postTitle,
        postContent,
      }),
    })
  } catch {
    throw new Error('Unable to connect to Workspace Posts. Please try again.')
  }

  let data

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.message || 'Unable to create the Workspace post.')
  }

  if (!data.post) {
    throw new Error('The server did not return the created post.')
  }

  return data.post
}

// Retrieve saved workspace posts for an authenticated project member.
export async function getWorkspacePosts(user, projectId) {
  if (!user) {
    throw new Error('Please sign in before viewing posts.')
  }

  if (!projectId) {
    throw new Error('Select a project before viewing posts.')
  }

  let token

  try {
    token = await user.getIdToken()
  } catch {
    throw new Error('Unable to verify your sign-in. Please sign in again.')
  }

  let response

  try {
    response = await fetch(`${WORKSPACE_POSTS_URL}/project/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Unable to connect to Workspace Posts. Please try again.')
  }

  let data

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.message || 'Unable to retrieve Workspace posts.')
  }

  if (!Array.isArray(data.posts)) {
    throw new Error('The server returned an invalid Workspace posts response.')
  }

  return data.posts
}
