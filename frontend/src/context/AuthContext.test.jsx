
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserProfile } from '../services/profileService.js'

vi.mock('../firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}))

vi.mock('../services/profileService.js', () => ({
  getUserProfile: vi.fn(),
}))

let notifyAuthChange

// Expose authentication state and registration controls to the tests.
function AuthTestConsumer() {
  const authState = useAuth()

  return (
    <div>
      <span data-testid="user-email">
        {authState.currentUser?.email || 'No user'}
      </span>
      <span data-testid="profile-email">
        {authState.userProfile?.email || 'No profile'}
      </span>
      <span data-testid="profile-loading">
        {String(authState.profileLoading)}
      </span>
      <span data-testid="profile-error">
        {authState.profileError || 'No error'}
      </span>
      <button onClick={authState.beginRegistration}>
        Begin Registration
      </button>
      <button onClick={authState.endRegistration}>
        End Registration
      </button>
    </div>
  )
}

// Create a promise that tests can resolve after an authentication change.
function deferred() {
  let resolve
  let reject

  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

async function simulateAuthChange(user) {
  await act(async () => {
    notifyAuthChange(user)
  })
}

describe('AuthContext registration coordination', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    notifyAuthChange = null

    // Capture Firebase authentication events for controlled testing.
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      notifyAuthChange = callback
      return () => { }
    })
  })

  it('does not load a profile without an authenticated user', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(null)

    expect(screen.getByTestId('user-email').textContent).toBe('No user')
    expect(screen.getByTestId('profile-email').textContent).toBe('No profile')
    expect(getUserProfile).not.toHaveBeenCalled()
  })

  it('waits for backend registration before loading the new user profile', async () => {
    const newUser = {
      uid: 'new-user-123',
      email: 'avery@example.com',
    }

    const savedProfile = {
      userId: 123,
      email: 'avery@example.com',
    }

    vi.mocked(getUserProfile).mockResolvedValue(savedProfile)

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(null)

    await act(async () => {
      screen.getByText('Begin Registration').click()
    })

    // Firebase authenticates before backend registration finishes.
    await simulateAuthChange(newUser)

    expect(screen.getByTestId('user-email').textContent).toBe(
      'avery@example.com'
    )
    expect(getUserProfile).not.toHaveBeenCalled()

    // Backend registration finishes and profile loading resumes.
    await act(async () => {
      screen.getByText('End Registration').click()
    })

    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('profile-email').textContent).toBe(
        'avery@example.com'
      )
    })
  })

  it('loads an existing user profile after login', async () => {
    const existingUser = {
      uid: 'existing-user-456',
      email: 'existing@example.com',
    }

    vi.mocked(getUserProfile).mockResolvedValue({
      userId: 456,
      email: 'existing@example.com',
    })

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(existingUser)

    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalledWith(existingUser)
      expect(screen.getByTestId('profile-email').textContent).toBe(
        'existing@example.com'
      )
    })
  })

  it('restores the profile when Firebase restores an existing session', async () => {
    const restoredUser = {
      uid: 'restored-user-789',
      email: 'restored@example.com',
    }

    vi.mocked(getUserProfile).mockResolvedValue({
      userId: 789,
      email: 'restored@example.com',
    })

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    // Firebase immediately restores the previously authenticated session.
    await simulateAuthChange(restoredUser)

    await waitFor(() => {
      expect(screen.getByTestId('profile-email').textContent).toBe(
        'restored@example.com'
      )
    })
  })

  it('clears profile information after logout', async () => {
    const existingUser = {
      uid: 'logout-user-123',
      email: 'logout@example.com',
    }

    vi.mocked(getUserProfile).mockResolvedValue({
      userId: 123,
      email: 'logout@example.com',
    })

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(existingUser)

    await waitFor(() => {
      expect(screen.getByTestId('profile-email').textContent).toBe(
        'logout@example.com'
      )
    })

    await simulateAuthChange(null)

    expect(screen.getByTestId('user-email').textContent).toBe('No user')
    expect(screen.getByTestId('profile-email').textContent).toBe('No profile')
    expect(screen.getByTestId('profile-error').textContent).toBe('No error')
  })

  it('displays a profile error when loading fails', async () => {
    const existingUser = {
      uid: 'error-user-123',
      email: 'error@example.com',
    }

    vi.mocked(getUserProfile).mockRejectedValue(
      new Error('User profile not found')
    )

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(existingUser)

    await waitFor(() => {
      expect(screen.getByTestId('profile-error').textContent).toBe(
        'User profile not found'
      )
      expect(screen.getByTestId('profile-loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('profile-email').textContent).toBe('No profile')
  })

  it('ignores stale profile responses after logout', async () => {
    const pendingProfile = deferred()
    const existingUser = {
      uid: 'stale-user-123',
      email: 'stale@example.com',
    }

    vi.mocked(getUserProfile).mockReturnValue(pendingProfile.promise)

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(existingUser)

    expect(getUserProfile).toHaveBeenCalledTimes(1)

    await simulateAuthChange(null)

    // The previous request resolves after the user has logged out.
    await act(async () => {
      pendingProfile.resolve({
        userId: 123,
        email: 'stale@example.com',
      })
      await pendingProfile.promise
    })

    expect(screen.getByTestId('user-email').textContent).toBe('No user')
    expect(screen.getByTestId('profile-email').textContent).toBe('No profile')
    expect(screen.getByTestId('profile-loading').textContent).toBe('false')
  })

  it('ignores stale profile errors after switching users', async () => {
    const pendingProfile = deferred()

    const firstUser = {
      uid: 'first-user',
      email: 'first@example.com',
    }

    const secondUser = {
      uid: 'second-user',
      email: 'second@example.com',
    }

    vi.mocked(getUserProfile)
      .mockReturnValueOnce(pendingProfile.promise)
      .mockResolvedValueOnce({
        userId: 222,
        email: 'second@example.com',
      })

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(firstUser)
    await simulateAuthChange(secondUser)

    await waitFor(() => {
      expect(screen.getByTestId('profile-email').textContent).toBe(
        'second@example.com'
      )
    })

    await act(async () => {
      pendingProfile.reject(new Error('Old profile request failed'))

      try {
        await pendingProfile.promise
      } catch {
        // Expected rejection from the previous user's request.
      }
    })

    expect(screen.getByTestId('profile-email').textContent).toBe(
      'second@example.com'
    )
    expect(screen.getByTestId('profile-error').textContent).toBe('No error')
  })

  it('does not apply an earlier profile response during registration', async () => {
    const pendingProfile = deferred()

    const existingUser = {
      uid: 'existing-user',
      email: 'existing@example.com',
    }

    vi.mocked(getUserProfile).mockReturnValue(pendingProfile.promise)

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    )

    await simulateAuthChange(existingUser)

    expect(getUserProfile).toHaveBeenCalledTimes(1)

    await act(async () => {
      screen.getByText('Begin Registration').click()
    })

    // The old profile request completes while registration is suspended.
    await act(async () => {
      pendingProfile.resolve({
        userId: 111,
        email: 'existing@example.com',
      })
      await pendingProfile.promise
    })

    expect(screen.getByTestId('profile-email').textContent).toBe('No profile')
  })
})
