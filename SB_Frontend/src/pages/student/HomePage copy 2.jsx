import { useState, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const BACKEND_URL = 'http://10.0.61.191:5000'

// const BACKEND_URL = 'http://192.168.1.3:5000'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const mapContainerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '12px'
}

function HomePage({ student }) {
  const [busLocation, setBusLocation] = useState({ lat: 16.5764, lng: 80.6853 })
  const [busStatus, setBusStatus] = useState('Fetching...')
  const [lastUpdated, setLastUpdated] = useState('Never')

  useEffect(() => {
    if (student?.bus_no) {
      fetchBusLocation()
      const interval = setInterval(fetchBusLocation, 5000)
      return () => clearInterval(interval)
    }
  }, [student])

  const fetchBusLocation = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/buses/${student.bus_no}`)
      if (response.ok) {
        const data = await response.json()
        setBusLocation({ lat: data.latitude, lng: data.longitude })
        setBusStatus('On Route')
        setLastUpdated(formatTime(data.updatedAt))
      } else {
        setBusStatus('Offline')
      }
    } catch (err) {
      console.error('Error fetching bus location:', err)
      setBusStatus('Offline')
    }
  }

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Unknown'
    try {
      const diff = Math.floor((Date.now() - new Date(dateTime)) / 1000)
      if (diff < 60) return `${diff}s ago`
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      return `${Math.floor(diff / 3600)}h ago`
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div>
      {/* Welcome Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div >
  <img src="/vite.svg" alt="Smart Bus Logo" style={{ width: '60px', height: '60px' }} />
</div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              Child Bus Track
            </h2>
          </div>
        </div>
      </div>



      <div style={{ color: 'black' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ fontSize: '48px' }}>👋</div>
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
        Welcome, {student?.stu_name || 'Student'}!
      </h2>
      <p style={{ fontSize: '14px', opacity: 0.9 }}>
        Track your bus in real-time
      </p>
    </div>
  </div>
</div>


      {/* Bus Info Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="card-title">Your Bus Location</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Bus Number: {student?.bus_no || 'N/A'}</p>
          </div>
          <div style={{ 
            padding: '6px 12px',
            background: busStatus === 'On Route' ? '#e8f5e9' : '#ffebee',
            color: busStatus === 'On Route' ? '#2e7d32' : '#c62828',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {busStatus}
          </div>
        </div>

        {/* Map */}
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={busLocation}
            zoom={15}
          >
            <Marker position={busLocation} title={`Bus ${student?.bus_no}`} />
          </GoogleMap>
        </LoadScript>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Last updated: {lastUpdated}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Bus Stop</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginTop: '4px' }}>
            {student?.bus_stop_address || 'N/A'}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Class</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginTop: '4px' }}>
            {student?.class_section || 'N/A'}
          </div>
        </div>
      </div>

      {/* Parent Contact Card */}
      <div className="card">
        <h3 className="card-title">Emergency Contact</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <div style={{ fontSize: '32px' }}>📞</div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Parent Phone</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2196F3' }}>
              {student?.parents_phone_number || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage