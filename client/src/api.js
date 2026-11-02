// Sends a request to our server, attaching the login token if we have one
export async function api(path, options = {}) {
  const token = localStorage.getItem('token')

  let res
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    // The request never reached the server (offline, or the server is down)
    throw new Error('Cannot reach the server. Please try again in a moment.')
  }

  if (res.status === 204) return null          // success with nothing to return

  // The body may be empty or not JSON (for example, while the server is starting up)
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const error = new Error(data?.error || `The server had a problem (${res.status}). Please try again.`)
    error.status = res.status                  // so screens can react to 401
    throw error
  }

  if (data === null) {
    throw new Error('The server sent an unexpected reply. Please try again.')
  }
  return data
}