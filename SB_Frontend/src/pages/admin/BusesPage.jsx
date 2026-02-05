import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


// const BACKEND_URL = 'http://192.168.1.3:5000'

const BACKEND_URL = 'http://10.99.185.23:5000'

const STATUS_COLORS = {
  Active: { bg: '#e8f5e9', text: '#2e7d32' },
  Inactive: { bg: '#fff3e0', text: '#e65100' },
  Offline: { bg: '#ffebee', text: '#c62828' }
}

const buttonStyle = {
  flex: 1,
  padding: '12px',
  background: 'white',
  color: '#24527a',
  border: '2px solid #5dacbd',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'transform 0.2s, box-shadow 0.2s'
}

const iconStyle = {
  fontSize: '48px',
  background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)',
  borderRadius: '12px',
  width: '80px',
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

function BusesPage() {
  const navigate = useNavigate()
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalBuses: 0, totalStudents: 0, activeBuses: 0 })

  useEffect(() => { fetchBusesData() }, [])

  const fetchBusesData = async () => {
    try {
      setLoading(true)
      const busResponse = await fetch(`${BACKEND_URL}/api/buses`)
      const busData = await busResponse.json()
      
      const busesWithStudents = await Promise.all(
        busData.map(async (bus) => {
          try {
            const busNo = bus.busId || bus.bus_no.replace('BUS-', '')
            const studentsResponse = await fetch(`${BACKEND_URL}/api/students/bus/${busNo}`)
            const studentsData = await studentsResponse.json()
            const isActive = (new Date() - new Date(bus.updatedAt)) / 60000 < 5
            
            return {
              busNo,
              route: `Route ${busNo}`,
              students: studentsData.students?.length || 0,
              status: isActive ? 'Active' : 'Inactive'
            }
          } catch {
            return {
              busNo: bus.busId || bus.bus_no.replace('BUS-', ''),
              route: `Route ${bus.busId}`,
              students: 0,
              status: 'Offline'
            }
          }
        })
      )
      
      setBuses(busesWithStudents)
      setStats({
        totalBuses: busesWithStudents.length,
        totalStudents: busesWithStudents.reduce((sum, bus) => sum + bus.students, 0),
        activeBuses: busesWithStudents.filter(bus => bus.status === 'Active').length
      })
    } catch (error) {
      console.error('Error fetching buses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHover = (e, enter) => {
    e.currentTarget.style.transform = enter ? 'translateY(-2px)' : 'translateY(0)'
    e.currentTarget.style.boxShadow = enter ? '0 4px 12px rgba(93, 172, 189, 0.4)' : 'none'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚌</div>
        Loading buses...
      </div>
    )
  }

  return (
    <div>
      <div style={{
  background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(93, 172, 189, 0.3)',
  marginBottom: '20px',
  color: 'white'
}}>
  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>School Buses</h2>
  <p style={{ marginTop: 8, opacity: 0.9 }}>Monitor all buses in real-time</p>
</div>


      <div style={{ display: 'grid', gap: '16px' }}>
        {buses.map((bus) => {
          const statusColors = STATUS_COLORS[bus.status] || { bg: '#f5f5f5', text: '#757575' }
          
          return (
            <div key={bus.busNo} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={iconStyle}>🚌</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                    Bus {bus.busNo}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{bus.route}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 8px', background: statusColors.bg, color: statusColors.text, borderRadius: '4px', fontWeight: '500' }}>
                      {bus.status}
                    </span>
                    {/* <span style={{ color: '#666' }}>👥 {bus.students} students</span> */}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => navigate(`/admin/bus/${bus.busNo}/attendance`)}
                  style={buttonStyle}
                  onMouseEnter={(e) => handleHover(e, true)}
                  onMouseLeave={(e) => handleHover(e, false)}
                >
                  📋 Attendance
                </button>
                <button
                  onClick={() => navigate(`/admin/bus/${bus.busNo}`)}
                  style={buttonStyle}
                  onMouseEnter={(e) => handleHover(e, true)}
                  onMouseLeave={(e) => handleHover(e, false)}
                >
                  📍 GPS Tracking
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: '16px', background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { value: stats.totalBuses, label: 'Total Buses' },
            { value: stats.totalStudents, label: 'Total Students' },
            { value: stats.activeBuses, label: 'Active Buses' }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BusesPage