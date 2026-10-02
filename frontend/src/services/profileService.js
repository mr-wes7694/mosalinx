const PROFILE_URL = 'http://localhost:3000/api/users/profile'

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
