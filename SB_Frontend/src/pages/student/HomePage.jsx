import { useState, useEffect } from 'react'
import BusMapView from '../buses/BusMapView'
import 'leaflet/dist/leaflet.css'

const BACKEND_URL = 'http://10.99.185.23:5000'

function HomePage({ student }) {
  const [busData, setBusData] = useState(null)
  const [busLocation, setBusLocation] = useState({ lat: 16.5764, lng: 80.6853 })
  const [busStatus, setBusStatus] = useState('Fetching...')
  const [lastUpdated, setLastUpdated] = useState('Never')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => 
    localStorage.getItem('notifications') !== 'false'
  )

  useEffect(() => {
    if (student?.bus_no) {
      fetchBusData()
      const interval = setInterval(fetchBusData, 5000)
      return () => clearInterval(interval)
    }
  }, [student])

  const fetchBusData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/buses/${student.bus_no}`)
      if (response.ok) {
        const data = await response.json()
        setBusData(data)
        setBusLocation({ lat: data.latitude, lng: data.longitude })
        
        const timeDiff = Math.abs(Date.now() - new Date(data.updatedAt)) / 1000
        setBusStatus(timeDiff <= 120 ? 'On Route' : 'Offline')
        setLastUpdated(formatTime(data.updatedAt))
      } else {
        setBusStatus('Offline')
      }
    } catch (err) {
      setBusStatus('Offline')
    }
  }

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Unknown'
    const diff = Math.floor((Date.now() - new Date(dateTime)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  const toggleNotifications = async () => {
  const newState = !notificationsEnabled;
  setNotificationsEnabled(newState);
  localStorage.setItem('notifications', newState);

  try {
    const res = await fetch(`${BACKEND_URL}/api/students/${student.stu_id}/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationsEnabled: newState }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(" Notifications updated:", data);
    } else {
      console.error(" Failed to update:", data.message);
    }
  } catch (err) {
    console.error("🚨 Network or backend error:", err);
  }
};


  const isOnRoute = busStatus === 'On Route'

  return (
    <div>
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer' }} onClick={toggleNotifications}>
        <span style={{ fontSize: '14px' }}>{notificationsEnabled ? '🔔 ON' : '🔕 OFF'}</span>
        <div style={{ width: '44px', height: '24px', background: notificationsEnabled ? '#4CAF50' : '#ccc', borderRadius: '12px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '2px', left: notificationsEnabled ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>

      {/* Welcome Card with Logo */}
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

      {/* Bus Tracking Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 className="card-title" style={{ margin: '0 0 8px 0' }}>Your Bus Location</h3>
            <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Bus Number: <span style={{ fontWeight: 'bold', color: '#333' }}>{student?.bus_no || 'N/A'}</span></p>
          </div>
          <div style={{ padding: '6px 12px', background: isOnRoute ? '#e8f5e9' : '#ffebee', color: isOnRoute ? '#2e7d32' : '#c62828', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
            {busStatus}
          </div>
        </div>

        <BusMapView
          busLocation={busLocation}
          busNo={student?.bus_no}
          routes={busData?.routes || []}
          currentSession={busData?.currentSession || 'Morning'}
          mapHeight="350px"
        />

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {isOnRoute ? `📡 Live • ${lastUpdated}` : `⚠️ Offline • ${lastUpdated}`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px' }}>📍</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Bus Stop</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>{student?.bus_stop_address || 'N/A'}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px' }}>🎓</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Class</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>{student?.class_section || 'N/A'}</div>
        </div>
      </div>

      
    </div>
  )
}

export default HomePage