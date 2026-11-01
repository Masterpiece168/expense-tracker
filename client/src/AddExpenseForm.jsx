import { useState, useEffect } from 'react'
import { api } from './api'

// Today's date as 2026-10-31, in the user's own time zone
function today() {
  return new Date().toLocaleDateString('en-CA')
}

function AddExpenseForm({ onAdded }) {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')            // typed in dollars, like 12.50
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today())
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [error, setError] = useState('')

  // Load the categories once, for the dropdown
  useEffect(() => {
    api('/api/categories').then(list => {
      setCategories(list)
      if (list.length > 0) setCategoryId(String(list[0].id))   // pick the first one
    })
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    // The server wants whole cents. Math.round avoids float errors:
    // 12.1 * 100 is 1210.0000000000002 in JavaScript, so we round it.
    const cents = Math.round(parseFloat(amount) * 100)
    if (!(cents > 0)) {
      setError('Enter an amount greater than 0')
      return
    }

    try {
      await api('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount_cents: cents,
          description: description.trim() || null,
          expense_date: date,
          category_id: Number(categoryId),
          payment_method: paymentMethod,
        }),
      })

      setAmount('')              // clear the form for the next one
      setDescription('')
      onAdded()                  // tell the list to reload
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add an expense</h3>

      <input type="number" step="0.01" placeholder="Amount (e.g. 12.50)"
             value={amount} onChange={e => setAmount(e.target.value)} />

      <input placeholder="Description (optional)"
             value={description} onChange={e => setDescription(e.target.value)} />

      <input type="date" value={date} onChange={e => setDate(e.target.value)} />

      <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="bank_transfer">Bank transfer</option>
        <option value="e_wallet">E-wallet</option>
      </select>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Add</button>
    </form>
  )
}

export default AddExpenseForm