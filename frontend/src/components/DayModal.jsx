import { useState, useEffect } from 'react';
import { X, Pencil, Plus, CheckSquare, Square, Circle, Trash2, Share, Copy } from 'lucide-react';
import InlineLabelPicker from './InlineLabelPicker';
import LabelManager from './LabelManager';

const API_BASE = 'http://localhost:3001/api';

export default function DayModal({ date, labels, onUpdate, onClose, theme }) {
  const [checklist, setChecklist] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [event, setEvent] = useState(null);
  
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventInput, setEventInput] = useState('');
  
  const [showLabelManager, setShowLabelManager] = useState(false);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const isFuture = date > todayStr;

  const fetchDayData = () => {
    fetch(`${API_BASE}/day/${date}`)
      .then(res => res.json())
      .then(data => {
        setChecklist(data.checklist);
        setTasks(data.tasks);
        setEvent(data.event);
        setEventInput(data.event ? data.event.name : '');
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDayData();
  }, [date]);

  const saveEvent = () => {
    fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, name: eventInput.trim() })
    }).then(() => {
      setIsEditingEvent(false);
      fetchDayData();
      onUpdate();
    });
  };

  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (newChecklistItem.trim()) {
      fetch(`${API_BASE}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, text: newChecklistItem })
      }).then(() => {
        setNewChecklistItem('');
        fetchDayData();
        onUpdate();
      });
    }
  };

  const toggleChecklist = (id, currentStatus) => {
    if (isFuture) return;
    fetch(`${API_BASE}/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentStatus })
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, text: newTaskText, label_id: null })
      }).then(() => {
        setNewTaskText('');
        fetchDayData();
        onUpdate();
      });
    }
  };

  const updateTaskLabel = (taskId, labelId) => {
    fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label_id: labelId })
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const deleteChecklist = (id) => {
    fetch(`${API_BASE}/checklist/${id}`, {
      method: 'DELETE'
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const deleteTask = (id) => {
    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE'
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const [y, m, d] = date.split('-');
  const dateObj = new Date(y, m - 1, d);
  const monthStr = dateObj.toLocaleString('default', { month: 'short' });
  const dayStr = dateObj.toLocaleString('default', { weekday: 'short' });
  const formattedDate = `${dateObj.getDate()} ${monthStr}, ${dayStr}`;

  const incomplete = checklist.filter(i => !i.is_completed);
  const complete = checklist.filter(i => i.is_completed);

  const [copiedStatus, setCopiedStatus] = useState(false);

  const handleShare = () => {
    let text = `🚀 *Wudid Update - ${formattedDate}*\n\n`;
    if (complete.length > 0) {
      complete.forEach(item => text += `✅ ${item.text}\n`);
      text += '\n';
    }
    if (tasks.length > 0) {
      text += `📌 *Tasks Done:*\n`;
      tasks.forEach(task => text += `- ${task.text}\n`);
    }
    if (complete.length === 0 && tasks.length === 0) {
      text += `Nothing logged yet!`;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2000);
    });
  };

  const isNotebook = theme === 'notebook';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
    }} onClick={onClose}>
      
      <div 
        className={isNotebook ? 'notebook-paper' : 'glass glass-card'}
        style={{ 
          width: '90%', 
          maxWidth: isNotebook ? '520px' : '600px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          background: isNotebook ? undefined : 'rgba(15, 23, 42, 0.95)', 
          padding: isNotebook ? '0 16px 16px 16px' : '16px',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: isNotebook ? '96px' : 'auto', paddingTop: isNotebook ? '16px' : '0', paddingLeft: isNotebook ? '32px' : '0', marginBottom: isNotebook ? '0' : '24px' }}>
          <div>
            <h2 className={isNotebook ? 'notebook-font' : ''} style={{ margin: 0, fontSize: isNotebook ? '2rem' : '1.8rem', color: isNotebook ? '#f8fafc' : undefined, lineHeight: isNotebook ? '32px' : '1.2' }}>{formattedDate}</h2>
            
            {isEditingEvent ? (
              <form onSubmit={(e) => { e.preventDefault(); saveEvent(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center', height: isNotebook ? '32px' : 'auto', marginTop: isNotebook ? '0' : '8px' }}>
                <input 
                  type="text" 
                  value={eventInput} 
                  onChange={e => setEventInput(e.target.value)}
                  placeholder="Special event name (blank to remove)"
                  autoFocus
                  onBlur={saveEvent}
                  style={{ background: isNotebook ? 'transparent' : 'rgba(255,255,255,0.1)', border: 'none', borderBottom: isNotebook ? '1px dashed rgba(255,255,255,0.4)' : '1px solid var(--accent-primary)', color: '#f8fafc', padding: isNotebook ? '0' : '6px 10px', borderRadius: isNotebook ? '0' : '8px', outline: 'none', fontSize: isNotebook ? '1.1rem' : '0.85rem', width: '100%', maxWidth: '250px', fontFamily: 'inherit', lineHeight: isNotebook ? '31px' : 'normal' }}
                />
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: isNotebook ? '32px' : 'auto', marginTop: isNotebook ? '0' : '8px', minHeight: '26px' }}>
                {event && event.name ? (
                  <div className={isNotebook ? 'notebook-font' : ''} style={{ background: isNotebook ? 'transparent' : 'rgba(59, 130, 246, 0.2)', color: isNotebook ? '#fca5a5' : 'var(--accent-primary)', padding: isNotebook ? '0' : '4px 12px', borderRadius: isNotebook ? '0' : '16px', fontSize: isNotebook ? '1.2rem' : '0.85rem', fontWeight: 600, lineHeight: isNotebook ? '32px' : 'normal' }}>
                    ★ {event.name}
                  </div>
                ) : (
                  <div className={isNotebook ? 'notebook-font' : ''} style={{ color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', fontSize: isNotebook ? '1.1rem' : '0.85rem', fontStyle: 'italic', cursor: 'pointer', lineHeight: isNotebook ? '32px' : 'normal' }} onClick={() => setIsEditingEvent(true)}>
                    + Add special event
                  </div>
                )}
                {event && event.name && (
                  <button className="btn-icon" onClick={() => setIsEditingEvent(true)} style={{ padding: '4px', background: 'transparent', border: 'none' }}>
                    <Pencil size={14} color={isNotebook ? "#94a3b8" : "var(--text-secondary)"} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className={isNotebook ? '' : 'btn-icon'} 
              onClick={handleShare} 
              title="Copy progress to clipboard" 
              style={{ color: copiedStatus ? '#10b981' : (isNotebook ? '#f8fafc' : 'var(--text-secondary)'), background: 'transparent', border: 'none', cursor: 'pointer', padding: isNotebook ? '4px' : undefined, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Copy size={18} />
              <span className="desktop-only">{copiedStatus ? 'Copied!' : 'Copy'}</span>
            </button>
            <button className={isNotebook ? '' : 'btn-icon'} onClick={onClose} title="Close" style={{ color: isNotebook ? '#f8fafc' : undefined, background: 'transparent', border: 'none', cursor: 'pointer', padding: isNotebook ? '4px' : undefined }}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '0', paddingLeft: isNotebook ? '24px' : '0', flex: 1, display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '48px' }}>
          
          <section>
            <h3 className={isNotebook ? 'notebook-font' : ''} style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: 0, fontSize: isNotebook ? '1.3rem' : '1.1rem', color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', marginBottom: isNotebook ? '0' : '12px', borderBottom: isNotebook ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: isNotebook ? '0' : '8px', paddingLeft: isNotebook ? '8px' : '12px', textTransform: isNotebook ? 'none' : 'uppercase', letterSpacing: isNotebook ? '0' : '1px', lineHeight: isNotebook ? '32px' : '1.2', height: isNotebook ? '32px' : 'auto' }}>
              Checklist
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '4px' }}>
              {incomplete.map(item => (
                <div 
                  key={item.id} 
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: isNotebook ? '0 0 0 16px' : '4px 8px 4px 12px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto' }}
                  onMouseEnter={(e) => { const b = e.currentTarget.querySelector('.trash-btn'); if(b) b.style.opacity = '0.5'; }}
                  onMouseLeave={(e) => { const b = e.currentTarget.querySelector('.trash-btn'); if(b) b.style.opacity = '0'; }}
                >
                  {!isFuture ? (
                    <button onClick={() => toggleChecklist(item.id, item.is_completed)} style={{ color: isNotebook ? '#f8fafc' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px' }}>
                      <Square size={16} strokeWidth={isNotebook ? 2 : 2} />
                    </button>
                  ) : <div style={{width: '16px', height: isNotebook ? '32px' : '26px'}}/>}
                  <span className={isNotebook ? 'notebook-font' : ''} style={{ flex: 1, fontSize: isNotebook ? '1.1rem' : '1.05rem', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', marginTop: isNotebook ? '0' : '1px' }}>{item.text}</span>
                  
                  {!isFuture && (
                    <div style={{ display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px' }}>
                      <button 
                        className="trash-btn"
                        onClick={() => deleteChecklist(item.id)} 
                        style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s', padding: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Delete item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              <form onSubmit={handleAddChecklist} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isNotebook ? '0 0 0 16px' : '4px 8px 4px 20px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto', opacity: isNotebook ? 1 : 0.6 }}>
                <Plus size={16} color={isNotebook ? '#94a3b8' : undefined} />
                <input 
                  type="text" 
                  placeholder="Add a to-do... (press Enter)" 
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  className={isNotebook ? 'notebook-font' : ''}
                  style={{ background: isNotebook ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: isNotebook ? '1px solid rgba(255,255,255,0.1)' : 'none', color: isNotebook ? '#f8fafc' : '#fff', fontSize: isNotebook ? '1.05rem' : '1.05rem', outline: 'none', flex: 1, lineHeight: isNotebook ? '28px' : '1.5', height: isNotebook ? '28px' : 'auto', paddingLeft: isNotebook ? '8px' : '0', borderRadius: isNotebook ? '4px' : '0' }}
                />
              </form>

              {complete.length > 0 && (
                <div style={{ marginTop: isNotebook ? '0' : '8px', borderTop: isNotebook ? 'none' : '1px dashed rgba(255,255,255,0.1)', paddingTop: isNotebook ? '0' : '8px', display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '4px' }}>
                  {complete.map(item => (
                    <div 
                      key={item.id} 
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: isNotebook ? '0 0 0 16px' : '4px 8px 4px 12px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto', opacity: isNotebook ? 0.6 : 0.6 }}
                      onMouseEnter={(e) => { const b = e.currentTarget.querySelector('.trash-btn'); if(b) b.style.opacity = '0.8'; }}
                      onMouseLeave={(e) => { const b = e.currentTarget.querySelector('.trash-btn'); if(b) b.style.opacity = '0'; }}
                    >
                      {!isFuture && (
                        <button onClick={() => toggleChecklist(item.id, item.is_completed)} style={{ color: isNotebook ? '#fca5a5' : 'var(--success-color)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px' }}>
                          <CheckSquare size={16} strokeWidth={isNotebook ? 2 : 2} />
                        </button>
                      )}
                      <span className={isNotebook ? 'notebook-font' : ''} style={{ flex: 1, textDecoration: 'line-through', fontSize: isNotebook ? '1.1rem' : '1.05rem', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', marginTop: isNotebook ? '0' : '1px' }}>{item.text}</span>
                      
                      {!isFuture && (
                        <div style={{ display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px' }}>
                          <button 
                            className="trash-btn"
                            onClick={() => deleteChecklist(item.id)} 
                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s', padding: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {isNotebook && (
            <div style={{ height: '32px' }} />
          )}

          <section style={{ opacity: isFuture ? 0.4 : 1, pointerEvents: isFuture ? 'none' : 'auto' }}>
            <h3 className={isNotebook ? 'notebook-font' : ''} style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: 0, fontSize: isNotebook ? '1.3rem' : '1.1rem', color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', marginBottom: isNotebook ? '0' : '12px', borderBottom: isNotebook ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: isNotebook ? '0' : '8px', paddingLeft: isNotebook ? '8px' : '12px', textTransform: isNotebook ? 'none' : 'uppercase', letterSpacing: isNotebook ? '0' : '1px', lineHeight: isNotebook ? '32px' : '1.2', height: isNotebook ? '32px' : 'auto' }}>
              Tasks I Did
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '6px', paddingLeft: isNotebook ? '0' : '12px' }}>
              {tasks.map(task => {
                const label = labels.find(l => l.id === task.label_id);
                return (
                <div 
                  key={task.id} 
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: isNotebook ? 'transparent' : 'rgba(255,255,255,0.02)', padding: isNotebook ? '0 0 0 24px' : '8px 12px', borderRadius: isNotebook ? '0' : '8px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto' }}
                  onMouseEnter={(e) => { const b = e.currentTarget.querySelector('.trash-btn'); if(b) b.style.opacity = '0.6'; }}
                  onMouseLeave={(e) => { const b = e.currentTarget.querySelector('.trash-btn'); if(b) b.style.opacity = '0'; }}
                >
                  {isNotebook && (
                    <div style={{ marginTop: '13px', width: '6px', height: '6px', background: '#fff', flexShrink: 0 }} />
                  )}
                  <span className={isNotebook ? 'notebook-font' : ''} style={{ flex: 1, fontSize: isNotebook ? '1.1rem' : '1.05rem', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis' }}>{task.text}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: isNotebook ? '32px' : '26px' }}>
                    <InlineLabelPicker 
                      currentLabelId={task.label_id} 
                      labels={labels} 
                      onSelect={(labelId) => updateTaskLabel(task.id, labelId)} 
                      onManageLabels={() => setShowLabelManager(true)}
                    />
                    {!isFuture && (
                      <button 
                        className="trash-btn"
                        onClick={() => deleteTask(task.id)} 
                        style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s', padding: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )})}
              
              <form onSubmit={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isNotebook ? '0 0 0 24px' : '8px 12px', background: isNotebook ? 'transparent' : 'rgba(255,255,255,0.02)', borderRadius: isNotebook ? '0' : '8px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto' }}>
                <Plus size={16} color={isNotebook ? '#94a3b8' : "var(--text-secondary)"} />
                <input 
                  type="text" 
                  placeholder="Log a completed task... (press Enter)" 
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  className={isNotebook ? 'notebook-font' : ''}
                  style={{ background: isNotebook ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: isNotebook ? '1px solid rgba(255,255,255,0.1)' : 'none', color: isNotebook ? '#f8fafc' : '#fff', fontSize: isNotebook ? '1.05rem' : '1.05rem', outline: 'none', flex: 1, lineHeight: isNotebook ? '28px' : '1.5', height: isNotebook ? '28px' : 'auto', paddingLeft: isNotebook ? '8px' : '0', borderRadius: isNotebook ? '4px' : '0' }}
                />
              </form>
            </div>
          </section>

          {isNotebook && (
            <div style={{ height: '32px' }} />
          )}
        </div>
      </div>
      
      {showLabelManager && (
        <LabelManager 
          labels={labels} 
          fetchLabels={() => onUpdate()} 
          onUpdate={onUpdate}
          onClose={() => setShowLabelManager(false)} 
        />
      )}
    </div>
  );
}
