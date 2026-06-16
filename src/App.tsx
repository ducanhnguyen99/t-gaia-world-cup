import { HashRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Game } from './pages/Game'
import { Admin } from './pages/Admin'
import { LeaderboardPage } from './pages/LeaderboardPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/game" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  )
}
