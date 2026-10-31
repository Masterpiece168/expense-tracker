import { useState, useEffect } from 'react'
import { api } from './api'

function ExpenseList({ onLogout }) {
  const [expenses, setExpenses] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/expenses')
      .then(setExpenses)
      .catch(err => {
        if (err.status === 401) onLogout()      // token missing or expired
        else setError(err.message)
      })
  }, [])

  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0)

  return (
    <div>
      <h2>Your expenses</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td>{e.expense_date}</td>
                <td>{e.description}</td>
                <td>{e.category}</td>
                <td>${(e.amount_cents / 100).toFixed(2)}</td>
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