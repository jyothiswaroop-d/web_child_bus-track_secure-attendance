import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjMzZTY2ZGZmNzE0MTRkMjE4MWYwMzc0N2QzMTUwMjRmIiwiaCI6Im11cm11cjY0In0='

function AutoFitBounds({ routeLine, busLocation }) {
  const map = useMap()
  const [fitted, setFitted] = useState(false)
  
  useEffect(() => {
    if (routeLine.length > 0 && !fitted) {
      const allPoints = [...routeLine]
      if (busLocation) {
        allPoints.push([busLocation.lat, busLocation.lng])
      }
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
      setFitted(true)
    }
  }, [routeLine, busLocation, map, fitted])
  
  return null
}

function BusMapView({ busLocation, busNo, routes = [], currentSession = 'Morning', mapHeight = '350px' }) {
  const [roadRouteLine, setRoadRouteLine] = useState([])
  const [straightRouteLine, setStraightRouteLine] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const fetchedRouteRef = useRef(null)
  const timeoutRef = useRef(null)
  
  const currentRoute = routes.find(r => r.routeType?.toLowerCase() === currentSession.toLowerCase())

  useEffect(() => {
    if (currentRoute) {
      const routeKey = JSON.stringify({
        start: currentRoute.start_point,
        stops: currentRoute.stops,
        dest: currentRoute.destination_point
      })
      
      if (fetchedRouteRef.current !== routeKey) {
        fetchedRouteRef.current = routeKey
        setRetryCount(0)
        createStraightLine()
        fetchRoadRoute()
      }
    }
  }, [currentRoute])

  const createStraightLine = () => {
    if (!currentRoute) return
    
    const points = []
    
    if (currentRoute.start_point) {
      points.push([currentRoute.start_point.lat, currentRoute.start_point.lng])
    }
    
    if (currentRoute.stops && currentRoute.stops.length > 0) {
      currentRoute.stops.forEach(stop => {
        points.push([stop.lat, stop.lng])
      })
    }
    
    if (currentRoute.destination_point) {
      points.push([currentRoute.destination_point.lat, currentRoute.destination_point.lng])
    }
    
    setStraightRouteLine(points)
    console.log('✅ Straight line fallback created with', points.length, 'points')
  }

  const fetchRoadRoute = async () => {
    if (!currentRoute) return
    
    setLoading(true)
    setError(null)
    
    const coords = []
    
    if (currentRoute.start_point) {
      coords.push([currentRoute.start_point.lng, currentRoute.start_point.lat])
    }
    
    if (currentRoute.stops && currentRoute.stops.length > 0) {
      currentRoute.stops.forEach(stop => {
        coords.push([stop.lng, stop.lat])
      })
    }
    
    if (currentRoute.destination_point) {
      coords.push([currentRoute.destination_point.lng, currentRoute.destination_point.lat])
    }
    
    if (coords.length < 2) {
      setLoading(false)
      setError('Not enough points')
      return
    }

    console.log('🚌 Fetching road route through', coords.length, 'waypoints')

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('⏱️ API timeout - using fallback')
        setLoading(false)
        setError('Using direct route')
      }
    }, 8000)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000)

      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method: 'POST',
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: coords,
          instructions: false,
          preference: 'shortest',
          radiuses: coords.map(() => -1),
          continue_straight: false
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      clearTimeout(timeoutRef.current)
      
      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features[0] && data.features[0].geometry) {
          const path = data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
          console.log('✅ Road route loaded:', path.length, 'points')
          setRoadRouteLine(path)
          setError(null)
        } else {
          console.log('⚠️ No route in response, using fallback')
          setError('Using direct route')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API error:', response.status, errorData)
        
        if (retryCount < 2) {
          console.log('🔄 Retrying...', retryCount + 1)
          setRetryCount(retryCount + 1)
          setTimeout(() => fetchRoadRoute(), 2000)
        } else {
          setError('Using direct route')
        }
      }
    } catch (err) {
      clearTimeout(timeoutRef.current)
      console.error('❌ Network error:', err.name, err.message)
      
      if (retryCount < 2 && err.name !== 'AbortError') {
        console.log('🔄 Retrying...', retryCount + 1)
        setRetryCount(retryCount + 1)
        setTimeout(() => fetchRoadRoute(), 2000)
      } else {
        setError('Using direct route')
      }
    } finally {
      setLoading(false)
    }
  }

  const startIcon = L.divIcon({
    html: '<div style="background:#4CAF50;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);font-size:18px">🏁</div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    className: ''
  })

  const stopIcon = () => L.divIcon({
    html: '<div style="background:#2196F3;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px">📍</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    className: ''
  })

  const destIcon = L.divIcon({
    html: '<div style="background:#f44336;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);font-size:18px">🏫</div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    className: ''
  })

  const busIcon = L.divIcon({
    html: '<div style="background:#FF9800;color:white;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(255,152,0,0.6);font-size:20px;animation:pulse 2s infinite">🚌</div><style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    className: ''
  })

  const center = currentRoute?.start_point 
    ? [currentRoute.start_point.lat, currentRoute.start_point.lng] 
    : [16.5064, 80.6853]

  const displayRouteLine = roadRouteLine.length > 0 ? roadRouteLine : straightRouteLine

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={{ 
          padding: '10px 16px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          borderRadius: '10px', 
          marginBottom: '10px', 
          textAlign: 'center', 
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
        }}>
          <span style={{ marginRight: '8px' }}>🔄</span>
          Loading optimal route...
        </div>
      )}
      
      {error && !loading && (
        <div style={{ 
          padding: '10px 16px', 
          background: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)', 
          color: 'white', 
          borderRadius: '10px', 
          marginBottom: '10px', 
          textAlign: 'center', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ℹ️ {error}
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: mapHeight, borderRadius: '12px', zIndex: 1 }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {displayRouteLine.length > 0 && (
          <AutoFitBounds routeLine={displayRouteLine} busLocation={busLocation} />
        )}

        {displayRouteLine.length > 0 && (
          <Polyline 
            positions={displayRouteLine}
            pathOptions={{
              color: roadRouteLine.length > 0 ? '#1976D2' : '#2196F3',
              weight: roadRouteLine.length > 0 ? 6 : 5,
              opacity: roadRouteLine.length > 0 ? 0.85 : 0.7,
              dashArray: roadRouteLine.length > 0 ? null : '10, 10',
              lineJoin: 'round',
              lineCap: 'round'
            }}
          />
        )}

        {currentRoute?.start_point && (
          <Marker 
            position={[currentRoute.start_point.lat, currentRoute.start_point.lng]} 
            icon={startIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <strong style={{ fontSize: '15px' }}>🏁 Start</strong>
                <div style={{ marginTop: '6px', color: '#4CAF50', fontWeight: 'bold', fontSize: '13px' }}>
                  {currentRoute.start_point.name}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {currentRoute?.stops?.map((stop, i) => (
          <Marker 
            key={i} 
            position={[stop.lat, stop.lng]} 
            icon={stopIcon(i + 1)}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <strong style={{ fontSize: '15px' }}>Stop {i + 1}</strong>
                <div style={{ marginTop: '6px', color: '#2196F3', fontWeight: 'bold', fontSize: '13px' }}>
                  {stop.name}
                </div>
                {stop.visited && (
                  <div style={{ marginTop: '6px', color: '#4CAF50', fontSize: '12px', fontWeight: '600' }}>
                    ✓ Visited
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {currentRoute?.destination_point && (
          <Marker 
            position={[currentRoute.destination_point.lat, currentRoute.destination_point.lng]} 
            icon={destIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <strong style={{ fontSize: '15px' }}>🏫 Destination</strong>
                <div style={{ marginTop: '6px', color: '#f44336', fontWeight: 'bold', fontSize: '13px' }}>
                  {currentRoute.destination_point.name}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {busLocation && (
          <Marker 
            position={[busLocation.lat, busLocation.lng]} 
            icon={busIcon}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <strong style={{ fontSize: '15px', color: '#FF9800' }}>🚌 Bus {busNo}</strong>
                <div style={{ marginTop: '6px', color: '#666', fontSize: '13px' }}>Live Location</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {currentRoute && (
        <div 
        className="card"
        style={{
          marginTop: '12px',
          padding: '14px',
          background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(36, 82, 122, 0.3)',
          color: 'white'
        }}
      >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '17px', fontWeight: 'bold' }}>
                {currentSession} Route
              </div>
              <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.95 }}>
                {currentRoute.start_point?.name} → {currentRoute.destination_point?.name}
              </div>
            </div>
            {displayRouteLine.length > 0 && (
              <div style={{ 
                fontSize: '11px', 
                background: 'rgba(255,255,255,0.25)', 
                color: 'white', 
                padding: '6px 12px', 
                borderRadius: '14px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
              }}>
                {roadRouteLine.length > 0 ? '🛣️ Road Route' : '📍 Direct Route'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BusMapView