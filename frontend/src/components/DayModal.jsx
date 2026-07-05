import { useState, useEffect } from 'react';
import { X, Pencil, Plus, CheckSquare, Square, Circle, Trash2, Share, Copy, Undo2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import InlineLabelPicker from './InlineLabelPicker';
import LabelManager from './LabelManager';

const API_BASE = 'http://localhost:3001/api';

export default function DayModal({ date, labels, onUpdate, onClose, onNavigate, theme }) {
  const [tasks, setTasks] = useState([]);
  const [event, setEvent] = useState(null);

  const [newTaskText, setNewTaskText] = useState('');

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventInput, setEventInput] = useState('');

  const [showLabelManager, setShowLabelManager] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const isFuture = date > todayStr;

  const fetchDayData = () => {
    fetch(`${API_BASE}/day/${date}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks);
        setEvent(data.event);
        setEventInput(data.event ? data.event.name : '');
      })
      .catch(console.error);
  };

  const [animDir, setAnimDir] = useState('none');
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const getAdjacentDateStr = (offset) => {
    const [y, m, d] = date.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + offset);
    return `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
  };

  const handleNavigate = (offset) => {
    if (!onNavigate) return;
    setAnimDir(offset > 0 ? 'next' : 'prev');
    onNavigate(getAdjacentDateStr(offset));
  };

  useEffect(() => {
    fetchDayData();
    setEditingTaskId(null);
    setEditingTaskText('');
    setOpenMenu(null);
    setIsEditingEvent(false);
  }, [date]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        handleNavigate(-1);
      } else if (e.key === 'ArrowRight') {
        handleNavigate(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [date, onNavigate]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5 && Math.abs(distanceX) > 50) {
      if (distanceX > 0) {
        handleNavigate(1);
      } else {
        handleNavigate(-1);
      }
    }
  };

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

  const toggleTask = (id, currentStatus) => {
    if (isFuture && !currentStatus) return;
    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentStatus })
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const updateTaskLabel = (taskId, labelId) => {
    fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label_id: labelId })
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const deleteTask = (id) => {
    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE'
    }).then(() => { fetchDayData(); onUpdate(); });
  };

  const updateTaskText = (id) => {
    if (!editingTaskText.trim()) return;
    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editingTaskText })
    }).then(() => {
      setEditingTaskId(null);
      setEditingTaskText('');
      fetchDayData();
      onUpdate();
    });
  };

  const [y, m, d] = date.split('-');
  const dateObj = new Date(y, m - 1, d);
  const monthStr = dateObj.toLocaleString('default', { month: 'short' });
  const dayStr = dateObj.toLocaleString('default', { weekday: 'short' });
  const formattedDate = `${dateObj.getDate()} ${monthStr}, ${dayStr}`;

  const incomplete = tasks.filter(t => !t.is_completed);
  const complete = tasks.filter(t => t.is_completed);

  const [copiedStatus, setCopiedStatus] = useState(false);

  const handleShare = () => {
    if (tasks.length === 0) return;
    let text = `🚀 *Wudid Update - ${formattedDate}*\n\n`;
    if (complete.length > 0) {
      complete.forEach(item => {
        text += `✅ ${item.text}${item.label_name ? ` [${item.label_name}]` : ''}\n`;
      });
      text += '\n';
    }
    if (complete.length === 0) {
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

      <button
        onClick={(e) => { e.stopPropagation(); handleNavigate(-1); }}
        className={`day-nav-edge-btn day-nav-edge-btn-left ${isNotebook ? 'notebook-edge' : ''}`}
        title="Previous day (Left Arrow)"
      >
        <ChevronLeft size={44} strokeWidth={1.7} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); handleNavigate(1); }}
        className={`day-nav-edge-btn day-nav-edge-btn-right ${isNotebook ? 'notebook-edge' : ''}`}
        title="Next day (Right Arrow)"
      >
        <ChevronRight size={44} strokeWidth={1.7} />
      </button>

      <div
        key={date}
        className={`day-modal-container ${isNotebook ? 'notebook-paper' : 'glass glass-card'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '90%',
          maxWidth: isNotebook ? '520px' : '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: isNotebook ? undefined : 'rgba(15, 23, 42, 0.95)',
          padding: isNotebook ? '0 0px 16px 16px' : '16px 0px 16px 16px',
          overflow: 'hidden',
          animation: animDir === 'next'
            ? 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            : animDir === 'prev'
              ? 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'fadeIn 0.25s ease-out'
        }}
        onClick={e => {
          e.stopPropagation();
          setOpenMenu(null);
        }}
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
              onClick={handleShare}
              title="Copy progress to clipboard"
              style={{
                color: tasks.length === 0 ? '#64748b' : (copiedStatus ? '#10b981' : '#fff'),
                opacity: tasks.length === 0 ? 0.35 : 1,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                flexShrink: 0
              }}
            >
              <Copy size={18} style={{ flexShrink: 0 }} />
              <span className="desktop-only">{copiedStatus ? 'Copied!' : 'Copy'}</span>
            </button>
            <button className={isNotebook ? '' : 'btn-icon'} onClick={onClose} title="Close" style={{ color: isNotebook ? '#f8fafc' : undefined, background: 'transparent', border: 'none', cursor: 'pointer', padding: isNotebook ? '4px' : undefined }}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '0', paddingLeft: isNotebook ? '24px' : '0', flex: 1, display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '24px' }}>
          <section>
            <h3 className={isNotebook ? 'notebook-font' : ''} style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: 0, fontSize: isNotebook ? '1.3rem' : '1.1rem', color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', marginBottom: isNotebook ? '0' : '12px', borderBottom: isNotebook ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: isNotebook ? '0' : '8px', paddingLeft: isNotebook ? '8px' : '12px', textTransform: isNotebook ? 'none' : 'uppercase', letterSpacing: isNotebook ? '0' : '1px', lineHeight: isNotebook ? '32px' : '1.2', height: isNotebook ? '32px' : 'auto' }}>
              Todo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '4px' }}>
              {incomplete.map(task => (
                <div
                  key={task._id || task.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: isNotebook ? '0 0 0 16px' : '4px 8px 4px 12px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto' }}
                >
                  {isFuture ? (
                    <div style={{ color: 'var(--text-secondary)', opacity: 0.3, display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px', cursor: 'default' }} title="Cannot complete future tasks">
                      <Square size={16} strokeWidth={isNotebook ? 2 : 2} />
                    </div>
                  ) : (
                    <button onClick={() => toggleTask(task._id || task.id, task.is_completed)} style={{ color: isNotebook ? '#f8fafc' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px' }}>
                      <Square size={16} strokeWidth={isNotebook ? 2 : 2} />
                    </button>
                  )}

                  {editingTaskId === (task._id || task.id) ? (
                    <form onSubmit={(e) => { e.preventDefault(); updateTaskText(task._id || task.id); }} style={{ flex: 1, display: 'flex' }}>
                      <input
                        type="text"
                        value={editingTaskText}
                        onChange={e => setEditingTaskText(e.target.value)}
                        onBlur={() => updateTaskText(task._id || task.id)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            setEditingTaskId(null);
                            setEditingTaskText('');
                          }
                        }}
                        autoFocus
                        className={isNotebook ? 'notebook-font' : ''}
                        style={{ background: isNotebook ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: isNotebook ? '1px solid rgba(255,255,255,0.1)' : 'none', color: isNotebook ? '#f8fafc' : '#fff', fontSize: isNotebook ? '1.05rem' : '1.05rem', outline: 'none', flex: 1, lineHeight: isNotebook ? '28px' : '1.5', height: isNotebook ? '28px' : 'auto', paddingLeft: isNotebook ? '8px' : '0', borderRadius: isNotebook ? '4px' : '0' }}
                      />
                    </form>
                  ) : (
                    <span
                      className={isNotebook ? 'notebook-font' : ''}
                      onDoubleClick={() => {
                        setEditingTaskId(task._id || task.id);
                        setEditingTaskText(task.text);
                      }}
                      title="Double-click to edit"
                      style={{ flex: 1, fontSize: isNotebook ? '1.1rem' : '1.05rem', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', marginTop: isNotebook ? '0' : '1px', cursor: 'pointer' }}
                    >
                      {task.text}
                    </span>
                  )}

                  {editingTaskId !== (task._id || task.id) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: isNotebook ? '32px' : '26px' }}>
                      <InlineLabelPicker
                        currentLabelId={task.label_id || task.label_id?._id}
                        labels={labels}
                        onSelect={(labelId) => updateTaskLabel(task._id || task.id, labelId)}
                        onManageLabels={() => setShowLabelManager(true)}
                      />
                      <div style={{ position: 'relative' }}>
                        <button
                          className="more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenu?.id === (task._id || task.id)) {
                              setOpenMenu(null);
                            } else {
                              setOpenMenu({ id: task._id || task.id, rect: e.currentTarget.getBoundingClientRect(), task });
                            }
                          }}
                          style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 1, transition: 'color 0.2s', padding: '4px' }}
                          onMouseEnter={e => e.currentTarget.style.color = isNotebook ? '#f8fafc' : '#e2e8f0'}
                          onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <form onSubmit={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isNotebook ? '0 0 0 16px' : '4px 8px 4px 20px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto', opacity: isNotebook ? 1 : 0.6 }}>
                <Plus size={16} color={isNotebook ? '#94a3b8' : undefined} />
                <input
                  type="text"
                  placeholder="Add a task"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  className={isNotebook ? 'notebook-font' : ''}
                  style={{ background: isNotebook ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: isNotebook ? '1px solid rgba(255,255,255,0.1)' : 'none', color: isNotebook ? '#f8fafc' : '#fff', fontSize: isNotebook ? '1.05rem' : '1.05rem', outline: 'none', flex: 1, lineHeight: isNotebook ? '28px' : '1.5', height: isNotebook ? '28px' : 'auto', paddingLeft: isNotebook ? '8px' : '0', borderRadius: isNotebook ? '4px' : '0' }}
                />
              </form>
            </div>
          </section>

          {complete.length > 0 && (
            <section style={{ opacity: 1, pointerEvents: 'auto' }}>
              {isNotebook && <div style={{ height: '32px' }} />}
              <h3 className={isNotebook ? 'notebook-font' : ''} style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: 0, fontSize: isNotebook ? '1.3rem' : '1.1rem', color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', marginBottom: isNotebook ? '0' : '12px', borderBottom: isNotebook ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: isNotebook ? '0' : '8px', paddingLeft: isNotebook ? '8px' : '12px', textTransform: isNotebook ? 'none' : 'uppercase', letterSpacing: isNotebook ? '0' : '1px', lineHeight: isNotebook ? '32px' : '1.2', height: isNotebook ? '32px' : 'auto' }}>
                Done
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '4px' }}>
                {complete.map(task => (
                  <div
                    key={task._id || task.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: isNotebook ? '0 0 0 16px' : '4px 8px 4px 12px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto', opacity: 1 }}
                  >
                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px', cursor: 'default' }} title="Use the 3-dot menu to mark undone">
                      <CheckSquare size={16} strokeWidth={2} />
                    </div>

                    {editingTaskId === (task._id || task.id) ? (
                      <form onSubmit={(e) => { e.preventDefault(); updateTaskText(task._id || task.id); }} style={{ flex: 1, display: 'flex' }}>
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={e => setEditingTaskText(e.target.value)}
                          onBlur={() => updateTaskText(task._id || task.id)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              setEditingTaskId(null);
                              setEditingTaskText('');
                            }
                          }}
                          autoFocus
                          className={isNotebook ? 'notebook-font' : ''}
                          style={{ background: isNotebook ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: isNotebook ? '1px solid rgba(255,255,255,0.1)' : 'none', color: isNotebook ? '#f8fafc' : '#fff', fontSize: isNotebook ? '1.05rem' : '1.05rem', outline: 'none', flex: 1, lineHeight: isNotebook ? '28px' : '1.5', height: isNotebook ? '28px' : 'auto', paddingLeft: isNotebook ? '8px' : '0', borderRadius: isNotebook ? '4px' : '0' }}
                        />
                      </form>
                    ) : (
                      <span
                        className={isNotebook ? 'notebook-font' : ''}
                        onDoubleClick={() => {
                          setEditingTaskId(task._id || task.id);
                          setEditingTaskText(task.text);
                        }}
                        title="Double-click to edit"
                        style={{ flex: 1, textDecoration: 'none', fontSize: isNotebook ? '1.1rem' : '1.05rem', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', marginTop: isNotebook ? '0' : '1px', cursor: 'pointer' }}
                      >
                        {task.text}
                      </span>
                    )}

                    {editingTaskId !== (task._id || task.id) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: isNotebook ? '32px' : '26px' }}>
                        <InlineLabelPicker
                          currentLabelId={task.label_id || task.label_id?._id}
                          labels={labels}
                          onSelect={(labelId) => updateTaskLabel(task._id || task.id, labelId)}
                          onManageLabels={() => setShowLabelManager(true)}
                        />
                        <div style={{ position: 'relative' }}>
                          <button
                            className="more-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenu?.id === (task._id || task.id)) {
                                setOpenMenu(null);
                              } else {
                                setOpenMenu({ id: task._id || task.id, rect: e.currentTarget.getBoundingClientRect(), task });
                              }
                            }}
                            style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 1, transition: 'color 0.2s', padding: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.color = isNotebook ? '#f8fafc' : '#e2e8f0'}
                            onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                            title="More options"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {isNotebook && <div style={{ height: '32px' }} />}
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

      {openMenu && (
        <div
          style={{ position: 'absolute', right: window.innerWidth - openMenu.rect.right, top: openMenu.rect.bottom + 4, background: isNotebook ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 1000, minWidth: 'max-content', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setEditingTaskId(openMenu.task._id || openMenu.task.id);
              setEditingTaskText(openMenu.task.text);
              setOpenMenu(null);
            }}
            style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', justifyContent: 'flex-start' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Pencil size={14} />
            Edit
          </button>
          {openMenu.task.is_completed && (
            <button onClick={() => { toggleTask(openMenu.id, openMenu.task.is_completed); setOpenMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#f8fafc', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', width: '100%', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Undo2 size={14} />
              <span>Mark undone</span>
            </button>
          )}
          <button onClick={() => { deleteTask(openMenu.id); setOpenMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', width: '100%', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
