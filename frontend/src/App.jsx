import { useEffect, useState, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { CheckSquare, CheckCircle2, BarChart2, User, LogOut, Edit2, Check, X } from 'lucide-react'
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
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
        setIsEditingName(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = sessionStorage.getItem('wudid_dashboard_view_mode');
      return saved ? saved : 'calendar';
    } catch (e) {
      return 'calendar';
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('wudid_dashboard_view_mode', viewMode);
  }, [viewMode]);

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
        if (data.user) {
          setUser(data.user);
          setTempName(data.user.name || '');
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

  const handleSaveName = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, name: data.name }));
        setIsEditingName(false);
      }
    } catch (err) {
      console.error('Failed to update name:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wudid_jwt');
    navigate('/login');
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', letterSpacing: '-1px', fontWeight: 800 }}>
          Wudid
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Pill Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                background: (viewMode === 'calendar' || viewMode === 'analytics') ? 'var(--accent-primary)' : 'transparent',
                color: (viewMode === 'calendar' || viewMode === 'analytics') ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: (viewMode === 'calendar' || viewMode === 'analytics') ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <CheckSquare size={16} />
              Tasks
            </button>
            <button
              onClick={() => setViewMode('habits')}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                background: viewMode === 'habits' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'habits' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: viewMode === 'habits' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <CheckCircle2 size={16} />
              Habits
            </button>
          </div>

          {/* Profile Circle Icon */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title="Profile & Settings"
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff', fontWeight: 700, fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
            </button>

            {/* Profile Dropdown Modal */}
            {isProfileOpen && (
              <div
                style={{
                  position: 'absolute', top: '54px', right: 0,
                  width: '215px', background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px', padding: '14px',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
                  zIndex: 999, display: 'flex', flexDirection: 'column', gap: '12px',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleSaveName();
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setTempName(user?.name || '');
                          }
                        }}
                        placeholder="Your Name"
                        autoFocus
                        style={{
                          width: '100%', padding: '6px 10px', borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, outline: 'none'
                        }}
                      />
                    ) : (
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Hey {user?.name || 'Friend'}!
                        <button onClick={() => { setTempName(user?.name || ''); setIsEditingName(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }} title="Edit Name">
                          <Edit2 size={13} />
                        </button>
                      </h3>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {user?.email || ''}
                  </p>
                </div>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

                <button
                  onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px',
                    color: '#ef4444', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
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
            isModalOpen={!!selectedDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
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
          onNavigate={(newDate) => setSelectedDate(newDate)}
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
