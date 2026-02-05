import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '12px' }

const backButtonStyle = {
  background: 'white',
  border: '1px solid #e0e0e0',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  marginBottom: '16px',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

// Component to update map center
function ChangeView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function BusDetailPage() {
  const { busNo } = useParams()
  const navigate = useNavigate()
  const [busLocation, setBusLocation] = useState({ lat: 16.5764, lng: 80.6853 })
  const [busStatus, setBusStatus] = useState('Fetching...')
  const [lastUpdated, setLastUpdated] = useState('Never')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusData()
    fetchStudents()
    const interval = setInterval(fetchBusData, 5000)
    return () => clearInterval(interval)
  }, [busNo])

  const fetchBusData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bus/${busNo}`)
      if (response.ok) {
        const data = await response.json()
        const newLocation = { lat: data.latitude, lng: data.longitude }
        setBusLocation(newLocation)
        setBusStatus('On Route')
        setLastUpdated(formatTime(data.updatedAt))
      } else {
        setBusStatus('Offline')
      }
    } catch (err) {
      console.error('Error fetching bus data:', err)
      setBusStatus('Offline')
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/students/bus/${busNo}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
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

  const isOnRoute = busStatus === 'On Route'

  return (
    <div>
      <button onClick={() => navigate('/admin/buses')} style={backButtonStyle}>
        ← Back to Buses
      </button>

      <div className="card">
        <h2 className="card-title">Bus {busNo} Details</h2>
        <p style={{ color: '#666' }}>Real-time tracking and student information</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px', color: isOnRoute ? '#4CAF50' : '#f44336' }}>📍</span>
          <div>
            <h3 className="card-title">Live Bus Location</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Last updated: {lastUpdated}</p>
          </div>
        </div>

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
            <Popup>Bus {busNo}</Popup>
          </Marker>
          <ChangeView center={[busLocation.lat, busLocation.lng]} zoom={15} />
        </MapContainer>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: isOnRoute ? '#4CAF50' : '#f44336' }}>
              {isOnRoute ? '✓' : '✗'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Status</div>
            <div style={{ fontWeight: 'bold', color: isOnRoute ? '#4CAF50' : '#f44336' }}>
              {busStatus}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#2196F3' }}>📍</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Coordinates</div>
            <div style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '11px' }}>
              {busLocation.lat.toFixed(4)}, {busLocation.lng.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Students on Bus {busNo}</h3>
        <p style={{ color: '#666', marginBottom: '16px' }}>Total: {students.length} students</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No students found for this bus</div>
        ) : (
          <div className="students-list">
            {students.map((student, index) => (
              <div key={index} className="student-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{student.stu_name || 'N/A'}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>ID: {student.stu_id || 'N/A'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>Class: {student.class_section || 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                    <div>{student.bus_stop_address || 'N/A'}</div>
                    <div style={{ marginTop: '4px', color: '#2196F3', fontWeight: '500' }}>
                      {student.parents_phone_number || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusDetailPage