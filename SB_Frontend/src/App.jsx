import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentDashboard from './pages/student/StudentDashboard'

function App() {
  const [student, setStudent] = useState(null)
  const [admin, setAdmin] = useState(null)

  const handleLogout = () => {
    setStudent(null)
    setAdmin(null)
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/" 
        element={
          student ? <Navigate to="/dashboard/home" /> :
          admin ? <Navigate to="/admin/buses" /> :
          <LoginPage setStudent={setStudent} setAdmin={setAdmin} />
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          admin ? (
            <AdminDashboard admin={admin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />

      {/* Student Routes */}
      <Route 
        path="/dashboard/*" 
        element={
          student ? (
            <StudentDashboard student={student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App