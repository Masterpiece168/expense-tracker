import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('loading...')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus('server not reachable'))
  }, [])

  return (
    <div>
      <h1>Expense Tracker</h1>
      <p>Server status: {status}</p>
    </div>
  )
}

export default App