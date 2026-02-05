import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'


// const BACKEND_URL = 'http://192.168.1.3:5000'

const BACKEND_URL = 'http://10.99.185.23:5000'


function AttendanceDashboard() {
  const { busNo } = useParams()
  const navigate = useNavigate()
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('morning')

  useEffect(() => {
    fetchAttendance(selectedDate)
  }, [selectedDate, busNo])

  function getWeekStart(date) {
    const d = new Date(date)
    d.setDate(d.getDate() - d.getDay())
    return d
  }

  function getWeekDays(weekStart) {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      return day
    })
  }

  const fetchAttendance = async (date) => {
    try {
      setLoading(true)
      const dateStr = date.toISOString().split('T')[0]
      const response = await fetch(`${BACKEND_URL}/api/attendance/bus/${busNo}?date=${dateStr}`)
      setAttendanceData(response.ok ? await response.json() : null)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendanceData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'
  const isToday = (date) => date.toDateString() === new Date().toDateString()
  const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString()
  const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'short' })
  const navigateWeek = (dir) => setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + (dir * 7))))

  const getMorningAttendance = () => attendanceData?.present?.filter(a => a.session === 'Morning') || []
  const getEveningAttendance = () => attendanceData?.present?.filter(a => a.session === 'Evening') || []
  const getMissingStudents = () => {
    const morning = getMorningAttendance()
    const evening = getEveningAttendance()
    return morning.filter(m => !evening.some(e => e.student._id === m.student._id))
  }

  const weekDays = getWeekDays(currentWeekStart)
  const tabs = [
    // { icon: '☀️', label: 'Morning', count: getMorningAttendance().length, key: 'morning' },
    {label: 'Morning', count: getMorningAttendance().length, key: 'morning' },
    {label: 'Evening', count: getEveningAttendance().length, key: 'evening' },
    {label: 'Missing Students', count: getMissingStudents().length, key: 'missingstudent' },
    {label: 'Fully Absent', count: attendanceData?.absent?.length || 0, key: 'absent' }
  ]

  const renderStudentCard = (record, type) => {
    const isAbsent = type === 'absent'
    const isMissingStudent = type === 'missingstudent'
    const student = isAbsent ? record : record.student
    
    return (
      <div key={student._id || student.stu_id} style={{
        padding: '16px', background: isMissingStudent ? '#fff3e0' : '#f9f9f9',
        borderRadius: '8px', border: isMissingStudent ? '2px solid #ff9800' : '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px' }}>{isAbsent ? '✗' : isMissingStudent ? '⚠️' : '✓'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: isMissingStudent ? '#d32f2f' : 'inherit' }}>
              {student.stu_name}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              ID: {student.stu_id} • {student.class_section}
            </div>
            {isMissingStudent && (
              <div style={{ fontSize: '13px', marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontWeight: '500' }}>
                  Morning: Present ({formatTime(record.date)})
                </span>
                <span style={{ padding: '4px 10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontWeight: '500' }}>
                  Evening: Absent
                </span>
              </div>
            )}
          </div>
          {!isAbsent && !isMissingStudent && (
            <div style={{ 
              padding: '6px 14px',
              background: type === 'morning' ? '#e8f5e9' : '#e3f2fd',
              color: type === 'morning' ? '#2e7d32' : '#1565c0',
              borderRadius: '6px', fontSize: '14px', fontWeight: 'bold'
            }}>
              {formatTime(record.date)}
            </div>
          )}
          {isAbsent && (
            <div style={{ padding: '6px 14px', background: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
              No attendance
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>Loading attendance...</div>
    if (!attendanceData) return <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>No attendance data found for {formatDate(selectedDate)}</div>

    const contentMap = {
      morning: { data: getMorningAttendance(), title: 'Morning Session', emptyMsg: 'No morning attendance recorded' },
      evening: { data: getEveningAttendance(), title: 'Evening Session', emptyMsg: 'No evening attendance recorded' },
      missingstudent: { data: getMissingStudents(), title: 'Missing Students (Incomplete Attendance)', emptyMsg: 'No missing students - All students completed their day!', subtitle: 'Students present in morning but absent in evening' },
      absent: { data: attendanceData.absent || [], title: 'Fully Absent Students', emptyMsg: 'No fully absent students - Great attendance!' }
    }

    const content = contentMap[activeTab]
    return (
      <>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: activeTab === 'missingstudent' || activeTab === 'absent' ? '#d32f2f' : 'inherit' }}>
          {content.title}
        </h3>
        {content.subtitle && <p style={{ fontSize: '14px', marginBottom: '20px', color: '#666' }}>{content.subtitle}</p>}
        {content.data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>{content.emptyMsg}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {content.data.map(item => renderStudentCard(item, activeTab))}
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <button onClick={() => navigate('/admin/buses')} style={{ background: 'white', border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ← Back to Buses
      </button>

      <div style={{ background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(93, 172, 189, 0.3)', marginBottom: '20px', color: 'white' }}>
        <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold' }}>Bus {busNo} - Attendance</h2>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigateWeek(-1)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            ← Previous Week
          </button>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', textAlign: 'center' }}>
            Week: {formatDate(weekDays[0])} - {formatDate(weekDays[6])}, {currentWeekStart.getFullYear()}
          </div>
          <button onClick={() => navigateWeek(1)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Next Week →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {weekDays.map((day, i) => (
            <div key={i} onClick={() => setSelectedDate(day)} style={{
              padding: '12px', background: isSameDay(day, selectedDate) ? 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)' : 'white',
              color: isSameDay(day, selectedDate) ? 'white' : '#333', border: isToday(day) ? '2px solid #4CAF50' : '1px solid #e0e0e0',
              borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{getDayName(day)}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{day.getDate()}</div>
              {isToday(day) && <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>TODAY</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {[0, 2].map(startIdx => (
          <div key={startIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: startIdx === 0 ? '12px' : '0' }}>
            {tabs.slice(startIdx, startIdx + 2).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: '12px 16px',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)' : 'white',
                color: activeTab === tab.key ? 'white' : '#333',
                border: activeTab === tab.key ? 'none' : '2px solid #e0e0e0',
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px',
                fontWeight: activeTab === tab.key ? 'bold' : '500',
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(93, 172, 189, 0.3)' : 'none',
                transform: activeTab === tab.key ? 'translateY(-2px)' : 'translateY(0)'
              }}>
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span style={{ background: activeTab === tab.key ? 'rgba(255, 255, 255, 0.25)' : '#e0e0e0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default AttendanceDashboard