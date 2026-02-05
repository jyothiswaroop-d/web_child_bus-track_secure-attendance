import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// const BACKEND_URL = 'http://192.168.1.3:5000'

const BACKEND_URL = 'http://10.99.185.23:5000'

function LoginPage({ setStudent, setAdmin }) {
  const [userType, setUserType] = useState('student')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (userType === 'student') {
        // Student/Parent Login
        // Check if username and password are the same
        if (username !== password) {
          setError('Enter the correct Password')
          setLoading(false)
          return
        }

        const response = await fetch(`${BACKEND_URL}/api/students/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stu_id: username.trim() }),
        })

        const data = await response.json()

        if (data.success) {
          setStudent(data.student);

  // ✅ Save student ID for attendance & route protection
  localStorage.setItem("studentId", data.student.stu_id || data.student.studentId);

  // Optional: store name or token if you want
  localStorage.setItem("studentName", data.student.name);

  navigate('/dashboard/home');
}
 else {
          setError(data.message || 'Login failed')
        }
      } else {
        // Admin Login
        const response = await fetch(`${BACKEND_URL}/api/admin/${username.trim()}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // Extract year from DOB and verify password
          const birthYear = new Date(data.dob).getFullYear().toString()
          
          if (password === birthYear) {
            setAdmin(data)
            navigate('/admin/dashboard')
          } else {
            setError('Invalid password')
          }
        } else if (response.status === 404) {
          setError('Admin not found')
        } else {
          setError('Login failed')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Connection error. Please check your network.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box" style={{ paddingTop: '20px', paddingBottom: '30px' }}>
      
        <div style={{ 
  textAlign: 'center', 
  margin: '0', 
  padding: '0',
  lineHeight: '0'
}}>
  <img 
    src="/vite.svg" 
    alt="Smart Bus Logo" 
    style={{ 
      width: '200px', 
      height: '200px', 
      display: 'block', 
      margin: '0 auto',
      objectFit: 'contain'
    }} 
  />
</div>

        <h1 className="login-title" style={{ marginTop: '0px', marginBottom: '25px' }}>Smart Bus Login</h1>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>User Type</label>
            <select
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value)
                setError('')
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #070101ff',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="student">Student / Parent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={userType === 'student' ? 'Enter student ID' : 'Enter admin username'}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={userType === 'student' ? 'Enter student ID' : 'Enter year of birth'}
              required
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#917979ff', marginTop: '20px' }}>
          {userType === 'student' 
            ? 'Enter Username and password of student'
            : 'Admin: Password is your year of birth'}
        </p>
      </div>
    </div>
  )
}

export default LoginPage