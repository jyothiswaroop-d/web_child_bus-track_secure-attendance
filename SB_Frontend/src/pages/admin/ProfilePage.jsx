function ProfilePage({ admin }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div>
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '60px' }}>👨‍💼</div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {admin.name || 'N/A'}
            </h2>
            <p style={{ color: '#666' }}>{admin.designation || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3', marginBottom: '16px' }}>
          Account Details
        </h3>
        <div className="info-row">
          <span className="info-label">Username:</span>
          <span className="info-value">{admin.user_name || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Date of Birth:</span>
          <span className="info-value">{formatDate(admin.dob)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Work Experience:</span>
          <span className="info-value">{admin.work_experience ? `${admin.work_experience} years` : 'N/A'}</span>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3', marginBottom: '16px' }}>
          System Information
        </h3>
        <div className="info-row">
          <span className="info-label">Account Created:</span>
          <span className="info-value">{formatDate(admin.createdAt)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Last Updated:</span>
          <span className="info-value">{formatDate(admin.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage