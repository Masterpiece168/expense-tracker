import { useState, useEffect } from 'react'
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
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
    <section className="card">
      <div className="card-head">
        <h2>Dashboard</h2>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
               aria-label="Month" />
      </div>

      {error && <p className="error">{error}</p>}

      {stats && (
        <>
          <p className="stat-label">Spent in {stats.month}</p>
          <p className="stat-value">${(stats.total_cents / 100).toFixed(2)}</p>

          {chartData.length === 0 ? (
            <p className="empty">No expenses this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} stroke="var(--border)"
                       tick={{ fill: 'var(--muted)', fontSize: 13 }} />
                <YAxis width={52} tickLine={false} axisLine={false}
                       tickFormatter={v => `$${v}`}
                       tick={{ fill: 'var(--muted)', fontSize: 13 }} />
                <Tooltip
                  formatter={value => `$${value.toFixed(2)}`}
                  cursor={{ fill: 'var(--accent-soft)' }}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                  }}
                  itemStyle={{ color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--muted)' }}
                />
                <Bar dataKey="dollars" name="Spent" fill="var(--accent)" radius={[6, 6, 0, 0]}
                     maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </section>
  )
}

export default Dashboard