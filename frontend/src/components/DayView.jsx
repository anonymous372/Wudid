import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import Checklist from './Checklist';
import TaskLog from './TaskLog';

const API_BASE = 'http://localhost:3001/api';

export default function DayView({ labels, fetchLabels }) {
  const { date } = useParams();
  const navigate = useNavigate();
  
  const [checklist, setChecklist] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [event, setEvent] = useState(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;

  const fetchDayData = () => {
    fetch(`${API_BASE}/day/${date}`)
      .then(res => res.json())
      .then(data => {
        setChecklist(data.checklist);
        setTasks(data.tasks);
        setEvent(data.event);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDayData();
  }, [date]);

  const addEvent = () => {
    const eventName = prompt("Enter special event name for this day:");
    if (eventName) {
      fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, name: eventName })
      }).then(fetchDayData);
    }
  };

  // Convert YYYY-MM-DD to a local date while avoiding timezone shifts
  const [y, m, d] = date.split('-');
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button className="btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>{formattedDate}</h2>
          {event && (
            <div style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem', marginTop: '8px', fontWeight: 600 }}>
              ★ {event.name}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={addEvent} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', boxShadow: 'none' }}>
          <Plus size={18} />
          {event ? 'Edit Event' : 'Add Event'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="glass glass-card">
          <Checklist 
            date={date} 
            items={checklist} 
            isFuture={isFuture} 
            onUpdate={fetchDayData} 
          />
        </div>
        
        <div className="glass glass-card" style={{ opacity: isFuture ? 0.5 : 1, pointerEvents: isFuture ? 'none' : 'auto' }}>
          <TaskLog 
            date={date} 
            tasks={tasks} 
            labels={labels} 
            fetchLabels={fetchLabels}
            onUpdate={fetchDayData}
          />
        </div>
      </div>
    </div>
  );
}
