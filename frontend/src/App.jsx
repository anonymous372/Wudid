import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import DayModal from './components/DayModal'
import Login from './components/Login'
import Verify from './components/Verify'

const API_BASE = 'http://localhost:3001/api'

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('wudid_jwt');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function MainApp() {
  const [startDate, setStartDate] = useState(null);
  const [labels, setLabels] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalTheme, setModalTheme] = useState(() => {
    return localStorage.getItem('wudid_modal_theme') || 'default';
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('wudid_modal_theme', modalTheme);
  }, [modalTheme]);

  useEffect(() => {
    fetch(`${API_BASE}/status`)
      .then(res => res.json())
      .then(data => {
        if (data.startDate) {
          setStartDate(new Date(data.startDate));
        } else {
          setStartDate(new Date());
        }
      })
      .catch(console.error);
      
    fetchLabels();
  }, []);

  const fetchLabels = () => {
    fetch(`${API_BASE}/labels`)
      .then(res => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
      })
      .then(data => setLabels(data))
      .catch(console.error);
  };

  const handleLogout = () => {
    localStorage.removeItem('wudid_jwt');
    navigate('/login');
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', letterSpacing: '-1px', fontWeight: 800 }}>
          Wudid
        </h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </header>

      <main>
        {startDate && (
          <Dashboard 
            startDate={startDate} 
            onSelectDay={setSelectedDate} 
            labels={labels} 
            fetchLabels={fetchLabels}
            refreshKey={refreshKey}
            onUpdate={() => setRefreshKey(k => k + 1)}
            modalTheme={modalTheme}
            setModalTheme={setModalTheme}
          />
        )}
      </main>

      {selectedDate && (
        <DayModal 
          date={selectedDate} 
          labels={labels} 
          onUpdate={() => {
            setRefreshKey(k => k + 1);
            fetchLabels();
          }}
          onClose={() => setSelectedDate(null)} 
          theme={modalTheme}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
