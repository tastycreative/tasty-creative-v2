'use client'
import React, { useEffect, useState } from 'react'

export default function TestOnboardingPage() {
  const [clientId, setClientId] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function fetchStatus() {
    if (!clientId) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/test-onboarding/status?clientModelDetailsId=${encodeURIComponent(clientId)}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setMessage('Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  async function triggerNext(completed = true) {
    if (!clientId) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/webhook/onboarding?clientModelDetailsId=${encodeURIComponent(clientId)}&completed=${completed}` , { method: 'POST' })
      const json = await res.json()
      setMessage(JSON.stringify(json))
      await fetchStatus()
    } catch (e) {
      setMessage('Failed to trigger')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div style={{ padding: 20 }}>
      <h2>Onboarding Visualizer / Tester</h2>
      <div style={{ marginBottom: 12 }}>
        <label>ClientModelDetails ID: </label>
        <input value={clientId} onChange={e => setClientId(e.target.value)} style={{ width: 420 }} />
        <button onClick={fetchStatus} style={{ marginLeft: 8 }}>Fetch Status</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => triggerNext(true)} disabled={!clientId || loading}>Mark next step completed</button>
        <button onClick={() => triggerNext(false)} disabled={!clientId || loading} style={{ marginLeft: 8 }}>Mark next step incomplete</button>
      </div>

      {loading && <div>Loading...</div>}

      {message && <pre style={{ background: '#eee', padding: 8 }}>{message}</pre>}

  {data && (
        <div>
          <h3>Onboarding Progress (for client)</h3>
          <ul>
            {(!data.steps || data.steps.length === 0) && <li>No onboarding steps found</li>}
            {(data.steps || []).map((entry: any) => (
              <li key={entry.onboardingList.id} style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={!!entry.progress.completed} onChange={async (e) => {
                    const next = e.target.checked
                    setLoading(true)
                    try {
                      const res = await fetch(`/api/onboarding/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientModelDetailsId: clientId, onboardingListId: entry.onboardingList.id, completed: next }) })
                      const json = await res.json()
                      setMessage(JSON.stringify(json))
                      await fetchStatus()
                    } catch (err) {
                      setMessage('Toggle failed')
                    } finally {
                      setLoading(false)
                    }
                  }} />
                  <strong>{entry.onboardingList.stepNumber ?? '?' }.</strong>
                  <span>{entry.onboardingList.title}</span>
                </label>
                {entry.progress.notes && <div>notes: {entry.progress.notes}</div>}
              </li>
            ))}
          </ul>

          <h3>ClientModelDetails</h3>
          <pre style={{ background: '#fafafa', padding: 8 }}>{JSON.stringify(data.clientModelDetails, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
