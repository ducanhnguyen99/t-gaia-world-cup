import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  /** Optional right-aligned header content (e.g. session pill, controls). */
  headerRight?: ReactNode
}

/** Shared page chrome: animated background, branded header, centered content. */
export function Layout({ children, headerRight }: LayoutProps) {
  return (
    <div className="app-bg min-h-screen w-full text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <BrandMark />
        {headerRight}
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">{children}</main>
    </div>
  )
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-3 select-none">
      <span className="text-2xl drop-shadow-[0_0_8px_rgba(226,0,116,0.6)]">
        ⚽
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-[0.2em] text-cyan-accent/80 uppercase">
          T-Gaia
        </div>
        <div className="bg-gradient-to-r from-magenta-bright via-magenta to-cyan-accent bg-clip-text text-lg font-extrabold text-transparent">
          World Cup 2026
        </div>
      </div>
    </div>
  )
}
