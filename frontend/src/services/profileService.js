import { API_BASE_URL } from '../config/api'

const PROFILE_URL = `${API_BASE_URL}/api/users/profile`

// Retrieve the persisted profile for the authenticated Firebase user.
export async function getUserProfile(user) {
  if (!user) {
    throw new Error('Authenticated user is required')
  }

  const token = await user.getIdToken()

  let response

  try {
    response = await fetch(PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new Error('Unable to load your profile. Please try again later.')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load user profile')
  }

  return data.user
}

// Persist supported profile updates for the authenticated Firebase user.
export async function updateUserProfile(user, updates) {
  if (!user) {
    throw new Error('Authenticated user is required')
  }

  const token = await user.getIdToken()

  let response

  try {
    response = await fetch(PROFILE_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
  } catch {
    throw new Error('Unable to save your profile. Please try again later.')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user profile')
  }

  return data.user
}

// Upload a profile picture through the authenticated backend endpoint.
export async function uploadUserAvatar(user, file) {
  if (!user || !file) {
    throw new Error('An authenticated user and image file are required')
  }

  const token = await user.getIdToken()
  const formData = new FormData()
  formData.append('file', file)

  let response

  try {
    response = await fetch(`${PROFILE_URL}/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
  } catch {
    throw new Error('Unable to upload your profile picture. Please try again later.')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload profile picture')
  }

  return data.user
}

// Retrieve a saved profile picture as an authenticated image blob.
export async function getUserAvatar(user, userId) {
  if (!user || !Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
    throw new Error('An authenticated user and valid user ID are required')
  }

  const token = await user.getIdToken()

  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/users/${userId}/avatar`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })
  } catch {
    throw new Error('Unable to load the profile picture.')
  }

  if (!response.ok) {
    throw new Error('Failed to retrieve profile picture')
  }

  return response.blob()
}
