const SETTINGS_URL = 'http://localhost:3000/api/users/settings'

// Retrieve account settings for the authenticated Firebase user.
export async function getUserSettings(user) {
  if (!user) {
    throw new Error('Authenticated user is required')
  }

  const token = await user.getIdToken()

  const response = await fetch(SETTINGS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load account settings')
  }

  return data.settings
}

// Persist supported account settings for the authenticated Firebase user.
export async function updateUserSettings(user, settings) {
  if (!user) {
    throw new Error('Authenticated user is required')
  }

  const token = await user.getIdToken()

  const response = await fetch(SETTINGS_URL, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to save account settings')
  }

  return data.settings
}
