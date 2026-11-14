import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Shell from './components/Shell.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Calendar from './pages/Calendar.jsx'
import Messages from './pages/Messages.jsx'
import Statistics from './pages/Statistics.jsx'
import Resources from './pages/Resources.jsx'
import Workspace from './pages/Workspace.jsx'
import Settings from './pages/Settings.jsx'
import Profile from './pages/Profile.jsx'
import TeamMembers from './pages/TeamMembers.jsx'

function App() {
  return (
    <Routes>
      {/* Log in and Sign up now live on the landing page; the address
          decides which form Home shows. */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Home />} />
      <Route path="/signup" element={<Home />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="messages" element={<Messages />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="resources" element={<Resources />} />
        <Route path="workspace" element={<Workspace />} />
        <Route path="team-members" element={<TeamMembers />} />
      </Route>

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App