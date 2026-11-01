import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from './api'

function Dashboard({ expenses }) {
  const [month, setMonth] = useState(new Date().toLocaleDateString('en-CA').slice(0, 7))
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  // Fetch again whenever the month changes OR the expense list changes
  useEffect(() => {
    api(`/api/stats/monthly?month=${month}`)
      .then(setStats)
      .catch(err => setError(err.message))
  }, [month, expenses])

  // The chart wants dollars, not cents
  const chartData = stats
    ? stats.by_category.map(row => ({ name: row.category, dollars: row.total_cents / 100 }))
    : []

  return (
    <div>
      <h2>Dashboard</h2>

      <label>
        Month: <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </label>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {stats && (
        <>
          <p><strong>Spent in {stats.month}: ${(stats.total_cents / 100).toFixed(2)}</strong></p>

          {chartData.length === 0 ? (
            <p>No expenses this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={value => `$${value.toFixed(2)}`} />
                <Bar dataKey="dollars" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard