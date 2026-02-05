import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// const BACKEND_URL = 'http://192.168.1.3:5000'

const BACKEND_URL = 'http://192.168.1.3:5000'


const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '12px'
}

// Component to update map center
function ChangeView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function HomePage({ student }) {
  const [busLocation, setBusLocation] = useState({ lat: 16.5764, lng: 80.6853 })
  const [busStatus, setBusStatus] = useState('Fetching...')
  const [statusMessage, setStatusMessage] = useState('Checking bus status...')
  const [lastUpdated, setLastUpdated] = useState('Never')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => 
    localStorage.getItem('notifications') !== 'false'
  )

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
        const timeDiff = Math.abs(Date.now() - new Date(data.updatedAt)) / 1000
        
        setBusLocation({ lat: data.latitude, lng: data.longitude })
        
        const newStatus = timeDiff <= 120 ? 'On Route' : 'Offline'
        if (newStatus === 'On Route' && busStatus === 'Offline' && notificationsEnabled) {
          if (Notification.permission === 'granted') {
            new Notification('Bus Started', { body: `Bus ${student.bus_no} is on route!` })
          }
        }
        
        if (timeDiff <= 120) {
          setBusStatus('On Route')
          setStatusMessage('Tracker is active,Bus is Running')
        } else {
          setBusStatus('Offline')
          setStatusMessage('Bus has not started')
        }
        setLastUpdated(formatTime(data.updatedAt))
      } else {
        setBusStatus('Offline')
        setStatusMessage('Bus has not started')
      }
    } catch (err) {
      console.error('Error fetching bus location:', err)
      setBusStatus('Offline')
      setStatusMessage('Unable to connect to server')
    }
  }

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Unknown'
    const diff = Math.floor((Date.now() - new Date(dateTime)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled
    setNotificationsEnabled(newState)
    localStorage.setItem('notifications', newState)

    try {
      const response = await fetch(`${BACKEND_URL}/api/students/${student.stu_id}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationsEnabled: newState })
      })

      const data = await response.json()
      if (!response.ok) {
        console.error("Failed to update notifications:", data.message)
      } else {
        console.log("Notification updated:", data)
      }
    } catch (err) {
      console.error("Error updating notifications:", err)
    }
  }

  return (
    <div>
      {/* Notification Toggle */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'white', padding: '8px 16px', borderRadius: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer'
      }} onClick={toggleNotifications}>
        <span style={{ fontSize: '14px' }}>{notificationsEnabled ? 'SMS \n Notification🔔ON' : 'SMS \n Notification🔕OFF'}</span>
        <div style={{
          position: 'relative', width: '44px', height: '24px',
          background: notificationsEnabled ? '#4CAF50' : '#ccc',
          borderRadius: '12px', transition: 'background 0.3s'
        }}>
          <div style={{
            position: 'absolute', top: '2px',
            left: notificationsEnabled ? '22px' : '2px',
            width: '20px', height: '20px', background: 'white',
            borderRadius: '50%', transition: 'left 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        </div>
      </div>

      {/* Welcome Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', color: 'white', padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <div style={{ flexShrink: 0 }}>
            <img src="/vite.svg" alt="Smart Bus Logo" style={{ width: '120px', height: '120px', display: 'block' }} />
          </div>
          <div style={{ flex: 1, padding: '20px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 'bold', margin: '0' }}>
              CHILD BUS TRACK
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              padding: '6px 12px',
              background: busStatus === 'On Route' ? '#e8f5e9' : '#ffebee',
              color: busStatus === 'On Route' ? '#2e7d32' : '#c62828',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              {busStatus}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              {statusMessage}
            </div>
          </div>
        </div>

        {/* Map */}
        <MapContainer
          center={[busLocation.lat, busLocation.lng]}
          zoom={15}
          style={mapContainerStyle}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite + Labels">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.3}
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <Marker position={[busLocation.lat, busLocation.lng]}>
            <Popup>Bus {student?.bus_no}</Popup>
          </Marker>
          <ChangeView center={[busLocation.lat, busLocation.lng]} zoom={15} />
        </MapContainer>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {busStatus === 'On Route' ? (
            <>📡 Live tracking active • Last updated: {lastUpdated}</>
          ) : (
            <>⚠️ Last known location • Updated: {lastUpdated}</>
          )}
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