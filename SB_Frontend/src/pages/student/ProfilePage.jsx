function ProfilePage({ student, onLogout }) {
  const generateEmail = (parentName) => {
    if (!parentName) return 'N/A'
    return `${parentName.toLowerCase().replace(/\s+/g, '')}@gmail.com`
  }

  return (
    <div>
      
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '60px' }}>👨‍🎓</div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {student?.stu_name || 'N/A'}
            </h2>
            <p style={{ color: '#666' }}>Student ID: {student?.stu_id || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Academic Details */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3', marginBottom: '16px' }}>
          Personal Details
        </h3>
        <div className="info-row">
          <span className="info-label">Class & Section:</span>
          <span className="info-value">{student?.class_section || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Roll Number:</span>
          <span className="info-value">{student?.stu_id || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Gender:</span>
          <span className="info-value">{student?.gender || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Academic Year:</span>
          <span className="info-value">2025-26</span>
        </div>
        <div className="info-row">
          <span className="info-label">Home Address:</span>
          <span className="info-value">{student?.address || 'N/A'}</span>
        </div>
      </div>


      {/* Parent/Guardian Details */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3', marginBottom: '16px' }}>
          👨‍👩‍👦Parent/Guardian Details
        </h3>
        <div className="info-row">
          <span className="info-label">Parent Name:</span>
          <span className="info-value">{student?.parent_name || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Phone Number:</span>
          <span className="info-value">{student?.parents_phone_number || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Email:</span>
          <span className="info-value">{generateEmail(student?.parent_name)}</span>
        </div>
      </div>

      {/* Transport Details */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3', marginBottom: '16px' }}>
          🚌 Bus & Transport Details
        </h3>
        <div className="info-row">
          <span className="info-label">Bus Number:</span>
          <span className="info-value">{student?.bus_no || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Bus Student:</span>
          <span className="info-value">{student?.is_bus_student ? 'Yes' : 'No'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Bus Stop:</span>
          <span className="info-value">{student?.bus_stop_address || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Route:</span>
          <span className="info-value">{student?.route || 'N/A'}</span>
        </div>
      </div>

      

      {/* Address Details */}
      
    </div>
  )
}

export default ProfilePage