import { useState } from 'react'
import { Layout } from '../components/Layout'

const ADMIN_PASSWORD = 'tgaia2026'

export function Admin() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  if (!authed) {
    return (
      <Layout>
        <div className="glass mx-auto mt-16 max-w-sm p-8 text-center">
          <div className="mb-3 text-4xl">🔐</div>
          <h2 className="mb-4 text-xl font-bold">Admin Access</h2>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (pw === ADMIN_PASSWORD) setAuthed(true)
                else setError(true)
              }
            }}
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40"
          />
          {error && (
            <p className="mt-2 text-sm text-magenta-bright">Wrong password</p>
          )}
          <button
            onClick={() =>
              pw === ADMIN_PASSWORD ? setAuthed(true) : setError(true)
            }
            className="mt-4 w-full rounded-xl bg-magenta px-4 py-3 font-bold text-white shadow-glow transition hover:bg-magenta-bright"
          >
            Unlock
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="glass mx-auto mt-8 max-w-3xl p-10 text-center">
        <div className="mb-4 text-5xl">🎛️</div>
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="mt-3 text-slate-400">
          Session creation, team management and game control land here (Phase
          2–3).
        </p>
      </div>
    </Layout>
  )
}
