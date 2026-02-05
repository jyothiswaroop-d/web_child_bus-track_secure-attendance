import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import HomePage from './HomePage'
import AttendancePage from './AttendancePage'
import ProfilePage from './ProfilePage'

function StudentDashboard({ student, onLogout }) {
  const location = useLocation()
  const pathParts = location.pathname.split('/')
  const currentPage = pathParts[pathParts.length - 1]

  // Check if we're on profile page
  const isProfilePage = currentPage === 'profile'


  return (
    <div className="dashboard">
      {/* Top Navigation Bar - Only show on profile page */}
      {isProfilePage && (
        <div className="navbar" 
         style={{
        background: "linear-gradient(135deg, #5dacbd 0%, #24527a 100%)",
        color: "#fff"
      }}>
          <div className="navbar-title">Student Portal</div>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      )}

      {/* Page Content */}
      <div className="content" style={{ paddingTop: isProfilePage ? '60px' : '0' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/home" />} />
          <Route path="/home" element={<HomePage student={student} />} />
          <Route path="/attendance" element={<AttendancePage student={student} />} />
          <Route path="/profile" element={<ProfilePage student={student} />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <Link 
          to="/dashboard/home" 
          className={`nav-item ${currentPage === 'home' || currentPage === 'dashboard' ? 'active' : ''}`}
        >
          <span style={{ fontSize: '24px' }}>🏠</span>
          <span>Home</span>
        </Link>

        <Link 
          to="/dashboard/attendance" 
          className={`nav-item ${currentPage === 'attendance' ? 'active' : ''}`}
        >
          <span style={{ fontSize: '24px' }}>📋</span>
          <span>Attendance</span>
        </Link>

        <Link 
          to="/dashboard/profile" 
          className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
        >
          <span style={{ fontSize: '24px' }}>👤</span>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}

export default StudentDashboard