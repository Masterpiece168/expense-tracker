import { useState } from 'react'
import Login from './Login'
import ExpenseList from './ExpenseList'

function App() {
  // We're logged in if a token is saved in the browser
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem('token')))

  function logout() {
    localStorage.removeItem('token')
    setLoggedIn(false)
  }

  return (
    <div className="app">
      <header className={loggedIn ? 'app-header' : 'app-header centered'}>
        <h1>Expense Tracker</h1>
        {loggedIn && (
          <button className="btn-ghost" onClick={logout}>Log out</button>
        )}
      </header>

      {loggedIn ? (
        <ExpenseList onLogout={logout} />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  )
}

export default App