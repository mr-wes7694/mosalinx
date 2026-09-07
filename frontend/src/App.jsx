import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Shell from './components/Shell.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Calendar from './pages/Calendar.jsx'
import Messages from './pages/Messages.jsx'
import Statistics from './pages/Statistics.jsx'
import Resources from './pages/Resources.jsx'
import Workspace from './pages/Workspace.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

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
      </Route>
    </Routes>
  )
}

export default App