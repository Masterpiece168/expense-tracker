import { useState, useEffect } from 'react'
import { api } from './api'
import AddExpenseForm from './AddExpenseForm'
import Dashboard from './Dashboard'

function ExpenseList({ onLogout }) {
  const [expenses, setExpenses] = useState([])
  const [error, setError] = useState('')

  // Fetch the expenses from the server. Used on page load and after any change.
  function loadExpenses() {
    api('/api/expenses')
      .then(setExpenses)
      .catch(err => {
        if (err.status === 401) onLogout()      // token missing or expired
        else setError(err.message)
      })
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    try {
      await api(`/api/expenses/${id}`, { method: 'DELETE' })
      loadExpenses()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0)

  return (
    <div>
      <Dashboard expenses={expenses} />
      <AddExpenseForm onAdded={loadExpenses} />

      <h2>Your expenses</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td>{e.expense_date}</td>
                <td>{e.description}</td>
                <td>{e.category}</td>
                <td>${(e.amount_cents / 100).toFixed(2)}</td>
                <td><button onClick={() => handleDelete(e.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p><strong>Total: ${(totalCents / 100).toFixed(2)}</strong></p>
    </div>
  )
}

export default ExpenseList