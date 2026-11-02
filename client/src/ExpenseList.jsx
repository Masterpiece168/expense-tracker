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
    <div className="stack">
      <Dashboard expenses={expenses} />
      <AddExpenseForm onAdded={loadExpenses} />

      <section className="card">
        <div className="card-head">
          <h2>Your expenses</h2>
        </div>

        {error && <p className="error">{error}</p>}

        {expenses.length === 0 ? (
          <p className="empty">No expenses yet. Add your first one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="num">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="c-date">{e.expense_date}</td>
                    <td className="c-desc">{e.description}</td>
                    <td className="c-cat"><span className="pill">{e.category}</span></td>
                    <td className="c-amt num">${(e.amount_cents / 100).toFixed(2)}</td>
                    <td className="c-del num">
                      <button className="btn-danger" onClick={() => handleDelete(e.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="total">Total: ${(totalCents / 100).toFixed(2)}</p>
      </section>
    </div>
  )
}

export default ExpenseList