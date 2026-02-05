import { useState, useEffect } from 'react';


// const BACKEND_URL = 'http://192.168.1.3:5000'

const BACKEND_URL = 'http://10.99.185.23:5000'

function AttendancePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({ present: 0, total: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const studentId = localStorage.getItem('studentId');

  if (!studentId) {
  console.warn("No student ID found — redirecting to login");
  window.location.href = "/login";
}

  useEffect(() => {
    console.log('🔍 Student ID:', studentId);
    console.log('📅 Selected Date:', selectedDate.toISOString().split('T')[0]);
    fetchAttendanceForDate(selectedDate);
    fetchMonthlyStats();
    fetchWeeklyStats();
  }, [selectedDate]);

  function getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function getWeekDays(weekStart) {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });
  }

  const fetchAttendanceForDate = async (date) => {
    try {
      setLoading(true);
      setError('');
      const dateStr = date.toISOString().split('T')[0];
      const url = `${BACKEND_URL}/api/attendance/student/${studentId}?date=${dateStr}`;
      console.log('📡 Fetching:', url);
      const response = await fetch(url);
      console.log('📥 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Received data:', data);
        setAttendanceData(data);
      } else {
        console.log('❌ Response not OK');
        setAttendanceData(null);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const response = await fetch(`${BACKEND_URL}/api/attendance/student/${studentId}/stats?year=${year}&month=${month}`);
      if (response.ok) {
        setMonthlyStats(await response.json());
      }
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];
      const response = await fetch(`${BACKEND_URL}/api/attendance/student/${studentId}/weekly?weekStart=${weekStart}`);
      if (response.ok) {
        setWeeklyStats(await response.json());
      }
    } catch (err) {
      console.error('Error fetching weekly stats:', err);
    }
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();
  const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });

  const navigateWeek = (dir) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + dir * 7);
    setCurrentWeekStart(newDate);
  };

  const weekDays = getWeekDays(currentWeekStart);
  const monthlyPercent = monthlyStats.total > 0 ? Math.round((monthlyStats.present / monthlyStats.total) * 100) : 0;
  const weeklyPercent = weeklyStats.total > 0 ? Math.round((weeklyStats.present / weeklyStats.total) * 100) : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(93, 172, 189, 0.3)', marginBottom: '20px', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>🎓 Student Attendance</h2>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Monitor your daily attendance records</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '5px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>This Month</div>
          <div style={{ fontWeight: 'bold', fontSize: '20px', margin: '8px 0' }}>{monthlyStats.present}/{monthlyStats.total} Days</div>
          <div style={{ fontWeight: 'bold', fontSize: '24px', color: monthlyPercent >= 75 ? '#4CAF50' : '#f44336' }}>{monthlyPercent}%</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📆</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>This Week</div>
          <div style={{ fontWeight: 'bold', fontSize: '20px', margin: '8px 0' }}>{weeklyStats.present}/{weeklyStats.total} Days</div>
          <div style={{ fontWeight: 'bold', fontSize: '24px', color: weeklyPercent >= 75 ? '#2196F3' : '#f44336' }}>{weeklyPercent}%</div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigateWeek(-1)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>← Previous Week</button>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', textAlign: 'center' }}>Week: {formatDate(weekDays[0])} - {formatDate(weekDays[6])}, {currentWeekStart.getFullYear()}</div>
          <button onClick={() => navigateWeek(1)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Next Week →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {weekDays.map((day, i) => (
            <div key={i} onClick={() => setSelectedDate(day)} style={{
              padding: '12px',
              background: isSameDay(day, selectedDate) ? 'linear-gradient(135deg, #5dacbd 0%, #24527a 100%)' : 'white',
              color: isSameDay(day, selectedDate) ? 'white' : '#333',
              border: isToday(day) ? '2px solid #4CAF50' : '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{getDayName(day)}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{day.getDate()}</div>
              {isToday(day) && <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>TODAY</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}>Attendance for {formatDate(selectedDate)}</h3>
        {(() => {
          console.log('🎨 Render Check - Loading:', loading, 'Error:', error, 'Data:', attendanceData);
          if (loading) {
            return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading attendance...</div>;
          }
          if (error) {
            return <div style={{ textAlign: 'center', padding: '40px', color: '#f44336' }}>{error}</div>;
          }
          if (!attendanceData || (!attendanceData.morning && !attendanceData.evening)) {
            return (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                
                <div style={{ fontSize: '16px', fontWeight: '600' }}>No attendance recorded</div>
              </div>
            );
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {attendanceData.morning ? (
                <div style={{ padding: '16px', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #4CAF50' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* <div style={{ fontSize: '32px' }}>☀️</div> */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2e7d32' }}>Morning Session - Present</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Boarding Time: {formatTime(attendanceData.morning.boardingTime)}</div>
                    </div>
                    <div style={{ padding: '6px 14px', background: '#4CAF50', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>✓ Present</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#ffebee', borderRadius: '8px', border: '2px solid #f44336' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* <div style={{ fontSize: '32px' }}>☀️</div> */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#c62828' }}>Morning Session - Absent</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>No attendance recorded</div>
                    </div>
                    <div style={{ padding: '6px 14px', background: '#f44336', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>✗ Absent</div>
                  </div>
                </div>
              )}
              {attendanceData.evening ? (
                <div style={{ padding: '16px', background: '#e3f2fd', borderRadius: '8px', border: '2px solid #2196F3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>🌙</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1565c0' }}>Evening Session - Present</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Board Time: {formatTime(attendanceData.evening.boardingTime || attendanceData.evening.dropTime)}</div>
                    </div>
                    <div style={{ padding: '6px 14px', background: '#2196F3', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>✓ Present</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#ffebee', borderRadius: '8px', border: '2px solid #f44336' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>🌙</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#c62828' }}>Evening Session - Absent</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>No attendance recorded</div>
                    </div>
                    <div style={{ padding: '6px 14px', background: '#f44336', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>✗ Absent</div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default AttendancePage;