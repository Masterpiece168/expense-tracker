import { useState } from 'react'
import { api } from './api'

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()                      // stop the browser reloading the page
    setError('')

    try {
      if (isRegister) {
        await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        })
      }

      // Log in (also done right after registering)
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem('token', data.token)
      onLogin()                                 // tell App we're logged in
    } catch (err) {
      setError(err.message)                     // show the server's message
    }
  }

  return (
    <form className="card auth" onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Create account' : 'Log in'}</h2>

      {isRegister && (
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      )}
      <input type="email" placeholder="Email" value={email}
             onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password (8+ characters)" value={password}
             onChange={e => setPassword(e.target.value)} />

      {error && <p className="error">{error}</p>}

      <button type="submit">{isRegister ? 'Register' : 'Log in'}</button>
      <button type="button" className="btn-ghost" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'I already have an account' : 'Create an account'}
      </button>
    </form>
  )
}

export default Login