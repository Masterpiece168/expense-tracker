// Sends a request to our server, attaching the login token if we have one
export async function api(path, options = {}) {
  const token = localStorage.getItem('token')

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 204) return null          // success with nothing to return

  const data = await res.json()
  if (!res.ok) {
    const error = new Error(data.error || 'Something went wrong')
    error.status = res.status                  // so screens can react to 401
    throw error
  }
  return data
}