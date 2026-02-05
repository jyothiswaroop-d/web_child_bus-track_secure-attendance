import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import BusesPage from './BusesPage'
import ProfilePage from './ProfilePage'
import BusDetailPage from './BusDetailPage'
import AttendanceDashboard from './AttendanceDashboard'

function AdminDashboard({ admin, onLogout }) {
  const location = useLocation()
  const pathParts = location.pathname.split('/')
  const currentPage = pathParts[pathParts.length - 1]

  // Check if we're on profile page
  const isProfilePage = currentPage === 'profile'
  
  // Check if we're on bus detail page
  const isBusDetailPage = pathParts.includes('bus') && pathParts.length > 3

  return (
    <div className="dashboard">
      {/* Top Navigation Bar - Only show on profile page */}
      {isProfilePage && (
        <div className="navbar">
          <div className="navbar-title">Admin Portal</div>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      )}

      {/* Page Content */}
      <div className="content" style={{ paddingTop: isProfilePage ? '60px' : '0' }}>
        <Routes>
  <Route path="/" element={<Navigate to="/admin/buses" />} />
  <Route path="/dashboard" element={<Navigate to="/admin/buses" />} />
  <Route path="/buses" element={<BusesPage />} />
  <Route path="/bus/:busNo" element={<BusDetailPage />} />
  <Route path="/bus/:busNo/attendance" element={<AttendanceDashboard />} />
  <Route path="/profile" element={<ProfilePage admin={admin} />} />
</Routes>
      </div>

      {/* Bottom Navigation - Hide on bus detail pages */}
      {!isBusDetailPage && !location.pathname.includes('/attendance') && (
        <div className="bottom-nav">
          <Link 
            to="/admin/buses" 
            className={`nav-item ${currentPage === 'buses' || currentPage === 'admin' || currentPage === 'dashboard' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '24px' }}>🚌</span>
            <span>Buses</span>
          </Link>

          <Link 
            to="/admin/profile" 
            className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '24px' }}>👤</span>
            <span>Profile</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard