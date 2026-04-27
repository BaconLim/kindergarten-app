import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ParentDashboard from './pages/ParentDashboard'
import Profile from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route path="teacher" element={<TeacherDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="parent" element={<ParentDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route index element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
