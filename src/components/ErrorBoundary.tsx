import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Catches render crashes so a bug shows a message + reload, not a black screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-bg flex min-h-screen flex-col items-center justify-center p-6 text-center text-slate-100">
          <div className="glass max-w-lg p-8">
            <div className="text-5xl">😵</div>
            <h1 className="mt-3 text-2xl font-bold">Something broke</h1>
            <p className="mt-2 text-sm text-slate-300">
              The screen hit an error. Reloading usually fixes it — your spot in
              the session is saved.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-left text-xs text-magenta-bright">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-magenta px-6 py-2.5 font-bold text-white shadow-glow hover:bg-magenta-bright"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
