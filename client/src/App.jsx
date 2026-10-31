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
    <div>
      <h1>Expense Tracker</h1>

      {loggedIn ? (
        <>
          <button onClick={logout}>Log out</button>
          <ExpenseList onLogout={logout} />
        </>
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  )
}

export default App