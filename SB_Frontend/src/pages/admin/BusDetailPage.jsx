import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BusMapView from '../buses/BusMapView'
import 'leaflet/dist/leaflet.css'

const BACKEND_URL = 'http://10.99.185.23:5000'

function BusDetailPage() {
  const { busNo } = useParams()
  const navigate = useNavigate()
  const [busData, setBusData] = useState(null)
  const [busLocation, setBusLocation] = useState({ lat: 16.5764, lng: 80.6853 })
  const [busStatus, setBusStatus] = useState('Fetching...')
  const [lastUpdated, setLastUpdated] = useState('Never')

  useEffect(() => {
    fetchBusData()
    const interval = setInterval(fetchBusData, 5000)
    return () => clearInterval(interval)
  }, [busNo])

  const fetchBusData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/buses/${busNo}`)
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

  const isOnRoute = busStatus === 'On Route'
  const currentRoute = busData?.routes?.find(r => r.routeType?.toLowerCase() === busData?.currentSession?.toLowerCase())

  return (
    <div>
      <button onClick={() => navigate('/admin/buses')} style={{ background: 'white', border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}>
        ← Back to Buses
      </button>

      <div className="card">
        <h2 className="card-title">Bus {busNo} Details</h2>
        <p style={{ color: '#666' }}>Real-time tracking and student information</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 className="card-title" style={{ margin: '0 0 8px 0' }}>Live Location</h3>
            <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Bus Number: <span style={{ fontWeight: 'bold', color: '#333' }}>{busNo || 'N/A'}</span></p>
          </div>
          <div style={{ padding: '6px 12px', background: isOnRoute ? '#e8f5e9' : '#ffebee', color: isOnRoute ? '#2e7d32' : '#c62828', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
            {busStatus}
          </div>
        </div>

        <BusMapView
          busLocation={busLocation}
          busNo={busNo}
          routes={busData?.routes || []}
          currentSession={busData?.currentSession || 'Morning'}
          mapHeight="400px"
        />

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {isOnRoute ? `📡 Live • ${lastUpdated}` : `⚠️ Offline • ${lastUpdated}`}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px' }}>
        <div className="card" style={{ flex: 1, marginRight: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: isOnRoute ? '#4CAF50' : '#f44336' }}>{isOnRoute ? '✓' : '✗'}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Status</div>
          <div style={{ fontWeight: 'bold', color: isOnRoute ? '#4CAF50' : '#f44336', marginTop: '4px' }}>{busStatus}</div>
        </div>
        <div className="card" style={{ flex: 1, marginLeft: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>🕒</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Session</div>
          <div style={{ fontWeight: 'bold', color: '#FF9800', marginTop: '4px' }}>{busData?.currentSession || 'N/A'}</div>
        </div>
      </div>
    </div>
  )
}

export default BusDetailPage