import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, Tags, Eye, Minimize2, BookOpen, LayoutTemplate, Palette, Square, CheckSquare, BarChart2, Flame, CalendarDays, ListTodo, X } from 'lucide-react';
import LabelManager from './LabelManager';
import AnalyticsGrid from './AnalyticsGrid';
import UpcomingEvents from './UpcomingEvents';
import confetti from 'canvas-confetti';

const API_BASE = 'http://localhost:3001/api';

function MobileChecklistModal({ onClose, todayData, onUpdate, modalTheme }) {
  const isNotebook = modalTheme === 'notebook';
  const themeBg = isNotebook ? 'var(--notebook-bg)' : 'var(--bg-secondary)';
  const themeBorder = isNotebook ? '1px solid var(--notebook-line)' : '1px solid var(--border-color)';

  const toggleChecklist = (id, currentStatus) => {
    fetch(`${API_BASE}/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentStatus })
    }).then(() => { onUpdate(); });
  };

  const undoneItems = todayData.checklist.filter(i => !i.is_completed);
  const doneItems = todayData.checklist.filter(i => i.is_completed);

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div
        className={isNotebook ? 'notebook-paper-mobile' : 'glass glass-card'}
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '400px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: isNotebook ? undefined : 'rgba(15, 23, 42, 0.95)',
          padding: isNotebook ? '0 16px 16px 16px' : '16px',
          overflow: 'hidden'
        }}
      >
        <div style={{
          height: isNotebook ? '64px' : 'auto',
          borderBottom: isNotebook ? 'none' : '1px solid rgba(255,255,255,0.1)',
          paddingBottom: isNotebook ? '0' : '12px',
          paddingTop: isNotebook ? '16px' : '0',
          paddingLeft: isNotebook ? '32px' : '0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: isNotebook ? '0' : '16px'
        }}>
          <h2 className={isNotebook ? 'notebook-font' : ''} style={{ margin: 0, fontSize: isNotebook ? '1.8rem' : '1.25rem', fontWeight: isNotebook ? 'normal' : 800, color: isNotebook ? 'var(--notebook-ink)' : 'var(--text-primary)', lineHeight: isNotebook ? '32px' : '1.2' }}>
            Today's Checklist
          </h2>
          <button className={isNotebook ? '' : 'btn-icon'} style={{ color: isNotebook ? 'var(--notebook-ink)' : 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: isNotebook ? '4px' : '' }} onClick={onClose}><X size={24} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0', paddingLeft: isNotebook ? '32px' : '0', display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '8px' }}>
          {undoneItems.length === 0 && doneItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No checklist items for today.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isNotebook ? '0' : '4px' }}>
              {undoneItems.length !== 0 && <div style={{ height: isNotebook ? '32px' : 'auto', display: 'flex', alignItems: 'center', paddingLeft: isNotebook ? '0' : '0' }}>
                <h3 className={isNotebook ? 'notebook-font' : ''} style={{ margin: 0, fontSize: isNotebook ? '1.2rem' : '1.2rem', color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', lineHeight: isNotebook ? '32px' : '1.5' }}>
                  Todo
                </h3>
              </div>
              }
              {undoneItems.map(item => (
                <div key={item._id || item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: isNotebook ? '0 0 0 16px' : '4px 0 4px 16px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto' }}>
                  <button onClick={() => toggleChecklist(item._id || item.id, item.is_completed)} style={{ color: isNotebook ? 'var(--notebook-ink)' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px', padding: 0 }}>
                    <Square size={16} strokeWidth={isNotebook ? 2 : 2} />
                  </button>
                  <span className={isNotebook ? 'notebook-font' : ''} style={{ flex: 1, fontSize: isNotebook ? '1.1rem' : '1.1rem', color: isNotebook ? 'var(--notebook-ink)' : 'var(--text-primary)', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', marginTop: isNotebook ? '0' : '1px' }}>{item.text}</span>
                </div>
              ))}
              {/* {doneItems.length > 0 && undoneItems.length > 0 && <div style={{ height: isNotebook ? '32px' : '1px', background: isNotebook ? 'transparent' : 'rgba(255,255,255,0.1)', margin: isNotebook ? '0' : '8px 0', opacity: 0.5 }} />} */}
              {doneItems.length > 0 && (
                <div style={{ height: isNotebook ? '32px' : 'auto', display: 'flex', alignItems: 'center', paddingLeft: isNotebook ? '0' : '0' }}>
                  <h3 className={isNotebook ? 'notebook-font' : ''} style={{ margin: 0, fontSize: isNotebook ? '1.2rem' : '1.05rem', color: isNotebook ? '#94a3b8' : 'var(--text-secondary)', lineHeight: isNotebook ? '32px' : '1.5' }}>
                    Done
                  </h3>
                </div>
              )}
              {doneItems.map(item => (
                <div key={item._id || item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: isNotebook ? '0 0 0 16px' : '4px 0 4px 16px', minHeight: isNotebook ? '32px' : 'auto', height: 'auto', opacity: 0.6, textDecoration: 'line-through' }}>
                  <button onClick={() => toggleChecklist(item._id || item.id, item.is_completed)} style={{ color: isNotebook ? '#3b82f6' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: isNotebook ? '32px' : '26px', padding: 0 }}>
                    <CheckSquare size={16} strokeWidth={isNotebook ? 2 : 2.5} />
                  </button>
                  <span className={isNotebook ? 'notebook-font' : ''} style={{ flex: 1, fontSize: isNotebook ? '1.1rem' : '1rem', color: isNotebook ? 'var(--notebook-ink)' : 'var(--text-primary)', lineHeight: isNotebook ? '32px' : '1.5', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', marginTop: isNotebook ? '0' : '1px' }}>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Dashboard({ startDate, onSelectDay, labels, fetchLabels, refreshKey, onUpdate, modalTheme, setModalTheme, isModalOpen }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState({});
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);
  const [showMobileChecklist, setShowMobileChecklist] = useState(false);
  const [peekDay, setPeekDay] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState([]);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isActiveToday, setIsActiveToday] = useState(false);
  const [justActivated, setJustActivated] = useState(false);
  const prevIsActiveRef = useRef(null);
  const pendingStreakRef = useRef(null);
  const isModalOpenRef = useRef(isModalOpen);
  const streakBadgeRef = useRef(null);
  const [viewMode, setViewMode] = useState('calendar');
  const themeMenuRef = useRef(null);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isThemeMenuOpen]);

  const changeTheme = (newTheme) => {
    setModalTheme(newTheme);
    localStorage.setItem('wudid_modal_theme', newTheme);
    setIsThemeMenuOpen(false);
  };

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const today = new Date();

  const minMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const canGoBack = currentMonthStart > minMonth;
  const canGoForward = currentMonthStart < maxMonth;

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    fetch(`${API_BASE}/month/${year}/${month}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('wudid_jwt')}` }
    })
      .then(res => res.json())
      .then(data => setMonthData(data))
      .catch(console.error);

    fetch(`${API_BASE}/stats/streak?today=${todayStr}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('wudid_jwt')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (isModalOpenRef.current) {
          pendingStreakRef.current = data;
        } else {
          setStreak(data.streak);
          if (prevIsActiveRef.current === false && data.isActiveToday === true) {
            setJustActivated(true);
            setTimeout(() => setJustActivated(false), 1500);
          }
          prevIsActiveRef.current = data.isActiveToday;
          setIsActiveToday(data.isActiveToday);
        }
      })
      .catch(console.error);
  }, [currentDate, refreshKey]);

  const triggerConfetti = () => {
    let x = 0.15;
    let y = 0.15;

    if (streakBadgeRef.current) {
      const rect = streakBadgeRef.current.getBoundingClientRect();
      x = (rect.left + rect.width / 2) / window.innerWidth;
      y = (rect.top + rect.height / 2) / window.innerHeight;
    }

    confetti({
      particleCount: 40,
      startVelocity: 20,
      spread: 100,
      angle: 90,
      ticks: 120,
      gravity: 0.8,
      scalar: 0.7,
      origin: { x, y },
      colors: ['#f97316', '#fb923c', '#fdba74']
    });
  };

  useEffect(() => {
    if (!isModalOpen && pendingStreakRef.current) {
      const data = pendingStreakRef.current;
      pendingStreakRef.current = null;

      setTimeout(() => {
        setStreak(data.streak);
        if (prevIsActiveRef.current === false && data.isActiveToday === true) {
          setJustActivated(true);
          triggerConfetti();
          setTimeout(() => setJustActivated(false), 1500);
        }
        prevIsActiveRef.current = data.isActiveToday;
        setIsActiveToday(data.isActiveToday);
      }, 700);
    }
  }, [isModalOpen]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const allDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) allDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) allDays.push(i);

  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const toggleWeek = (idx) => {
    if (idx === currentWeekIndex) return; // Current week is always expanded
    setExpandedWeeks(prev => prev.includes(idx) ? prev.filter(w => w !== idx) : [...prev, idx]);
  };

  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const currentWeekIndex = isCurrentMonth ? Math.floor((today.getDate() + firstDayOfWeek - 1) / 7) : -1;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const isAnyModalOpen = isModalOpen || showLabelManager || showUpcomingEvents || showMobileChecklist || viewMode !== 'calendar';

  const themeBg = modalTheme === 'notebook' ? 'var(--notebook-bg)' : 'var(--bg-secondary)';
  const themeBorder = modalTheme === 'notebook' ? '1px solid var(--notebook-line)' : '1px solid var(--border-color)';
  const themeColor = modalTheme === 'notebook' ? 'var(--notebook-ink)' : 'var(--text-primary)';

  const themeBgBtn = 'var(--glass-bg)';
  const themeBorderBtn = '1px solid rgba(255, 255, 255, 0.1)';
  const themeColorBtn = modalTheme === 'notebook' ? 'var(--notebook-ink)' : '#f8fafc';

  return (
    <div className="glass glass-card animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap', gap: '8px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 1, minWidth: 0, fontSize: 'clamp(1.25rem, 5vw, 1.6rem)' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear().toString().slice(-2)}
          </span>
          <div
            ref={streakBadgeRef}
            className={`streak-celebrate-wrap ${justActivated ? 'streak-celebrate' : ''}`}
            style={{
              fontSize: '0.85rem',
              background: isActiveToday ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
              color: isActiveToday ? '#f97316' : 'var(--text-secondary)',
              border: isActiveToday ? '1px solid transparent' : '1px solid rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              transition: 'all 0.3s ease'
            }}
          >
            <Flame size={14} fill={isActiveToday ? "currentColor" : "none"} strokeWidth={2} style={{ transition: 'all 0.3s ease' }} /> {streak} <span className="mobile-hide">Streak</span>
          </div>
        </h2>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setViewMode(v => v === 'calendar' ? 'analytics' : 'calendar')}
              className="btn-icon"
              title={viewMode === 'calendar' ? 'Analytics' : 'Calendar'}
              style={{ color: viewMode === 'analytics' ? 'var(--accent-primary)' : undefined }}
            >
              {viewMode === 'calendar' ? <BarChart2 size={19} /> : <CalendarIcon size={19} />}
            </button>
            <button
              onClick={() => setShowUpcomingEvents(true)}
              className="btn-icon"
              title="Upcoming Events"
              style={{}}
            >
              <CalendarDays size={19} />
            </button>
            <button
              onClick={() => setShowLabelManager(true)}
              className="btn-icon"
              title="Manage Labels"
              style={{}}
            >
              <Tags size={19} />
            </button>

            <div style={{ position: 'relative' }} ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="btn-icon"
                title="Theme Settings"
                style={{
                  background: isThemeMenuOpen ? 'rgba(255,255,255,0.1)' : undefined,
                  borderColor: isThemeMenuOpen ? 'rgba(255,255,255,0.2)' : undefined,
                  color: isThemeMenuOpen ? 'var(--accent-primary)' : 'inherit'
                }}
              >
                <Palette size={19} />
              </button>

              {isThemeMenuOpen && (
                <div className="theme-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  marginTop: '8px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  zIndex: 100,
                  width: '260px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, paddingBottom: '6px', borderBottom: '1px solid var(--glass-border)', marginBottom: '4px' }}>
                    Select Theme
                  </div>

                  <button
                    onClick={() => changeTheme('default')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '8px',
                      background: modalTheme === 'default' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      border: `1px solid ${modalTheme === 'default' ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (modalTheme !== 'default') e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (modalTheme !== 'default') e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: '54px', height: '64px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <div style={{ width: '18px', height: '4px', borderRadius: '2px', background: '#e2e8f0' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: 'var(--accent-primary)' }} />
                      </div>
                      <div style={{ flex: 1 }} />
                      <div style={{ width: '100%', height: '5px', borderRadius: '2.5px', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ width: '70%', height: '5px', borderRadius: '2.5px', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ width: '90%', height: '5px', borderRadius: '2.5px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Modern Glass</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>Default sleek design</div>
                    </div>
                  </button>

                  <button
                    onClick={() => changeTheme('notebook')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '8px',
                      background: modalTheme === 'notebook' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      border: `1px solid ${modalTheme === 'notebook' ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (modalTheme !== 'notebook') e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (modalTheme !== 'notebook') e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: '54px', height: '64px', borderRadius: '6px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: '12px', top: 0, bottom: 0, width: '1px', background: 'rgba(239, 68, 68, 0.6)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '24px', height: '1px', background: 'rgba(239, 68, 68, 0.6)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '32px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '40px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '48px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '56px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />

                      <div style={{ position: 'absolute', left: '16px', top: '8px', width: '24px', height: '4px', background: '#f8fafc', borderRadius: '2px' }} />
                      <div style={{ position: 'absolute', left: '16px', top: '15px', width: '5px', height: '5px', borderRadius: '50%', background: '#fca5a5' }} />
                      <div style={{ position: 'absolute', left: '26px', top: '35px', width: '22px', height: '3px', background: '#94a3b8', borderRadius: '1.5px' }} />
                      <div style={{ position: 'absolute', left: '26px', top: '43px', width: '18px', height: '3px', background: '#94a3b8', borderRadius: '1.5px' }} />
                      <div style={{ position: 'absolute', left: '16px', top: '34px', width: '5px', height: '5px', border: '1px solid #94a3b8', borderRadius: '1px' }} />
                      <div style={{ position: 'absolute', left: '16px', top: '42px', width: '5px', height: '5px', border: '1px solid #94a3b8', borderRadius: '1px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Notebook</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>Classic paper style</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <div className="mobile-hide" style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-icon" onClick={() => canGoBack && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} disabled={!canGoBack} style={{ opacity: canGoBack ? 1 : 0.3 }}>
                <ChevronLeft size={20} />
              </button>
              <button className="btn-icon" onClick={() => canGoForward && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} disabled={!canGoForward} style={{ opacity: canGoForward ? 1 : 0.3 }}>
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="mobile-only" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => canGoBack && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                disabled={!canGoBack}
                style={{ background: 'transparent', border: 'none', padding: '6px 8px', color: 'var(--text-primary)', cursor: canGoBack ? 'pointer' : 'not-allowed', opacity: canGoBack ? 1 : 0.3, display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={19} />
              </button>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '16px' }} />
              <button
                onClick={() => canGoForward && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                disabled={!canGoForward}
                style={{ background: 'transparent', border: 'none', padding: '6px 8px', color: 'var(--text-primary)', cursor: canGoForward ? 'pointer' : 'not-allowed', opacity: canGoForward ? 1 : 0.3, display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: '12px' }}>
          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '8px' }}>
            <button
              onClick={() => setExpandedWeeks([])}
              disabled={expandedWeeks.length === 0}
              style={{
                background: expandedWeeks.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                border: expandedWeeks.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                color: expandedWeeks.length > 0 ? '#fca5a5' : 'var(--text-secondary)',
                opacity: expandedWeeks.length > 0 ? 1 : 0.3,
                cursor: expandedWeeks.length > 0 ? 'pointer' : 'not-allowed',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Collapse All Other Weeks"
            >
              <Minimize2 size={16} />
            </button>
          </div>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header" style={{ fontWeight: 600, color: 'var(--text-secondary)', paddingBottom: '8px', textAlign: 'center' }}>
              <span className="desktop-only">{day}</span>
              <span className="mobile-only" style={{ justifyContent: 'center' }}>{day.slice(0, 1)}</span>
            </div>
          ))}

          {weeks.map((week, weekIdx) => {
            const isCurrentWeek = weekIdx === currentWeekIndex;
            const isExpanded = isCurrentWeek || expandedWeeks.includes(weekIdx);

            return (
              <React.Fragment key={weekIdx}>
                <div
                  className="mobile-hide"
                  onClick={() => toggleWeek(weekIdx)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: isCurrentWeek ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: isCurrentWeek ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    borderRadius: '8px', color: isCurrentWeek ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isCurrentWeek ? 700 : 500, fontSize: '0.8rem', transition: 'all 0.2s',
                    opacity: isCurrentWeek ? 1 : 0.6, height: isExpanded ? '140px' : '75px'
                  }}
                >
                  <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', opacity: 0.8 }}>Wk</span>
                  <span style={{ fontSize: '1.2rem' }}>{weekIdx + 1}</span>
                  {isCurrentWeek && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '6px' }} />}
                </div>
                {/* Days */}
                {week.map((day, dayIdx) => {
                  if (!day) return <div key={`empty-${dayIdx}`} />;

                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const isPast = new Date(dateStr) < new Date(todayStr);
                  const dayData = monthData[dateStr] || { checklist: [], tasks: [], event: null };

                  const completedChecklist = dayData.checklist.filter(i => i.is_completed);
                  const incompleteChecklist = dayData.checklist.filter(i => !i.is_completed);
                  const incompleteCount = incompleteChecklist.length;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => onSelectDay(dateStr)}
                      style={{
                        height: isExpanded ? '140px' : '75px',
                        borderRadius: '12px',
                        background: isToday ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isToday ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                        padding: isExpanded ? '12px' : '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible',
                        minWidth: 0,
                        zIndex: peekDay === dateStr ? 100 : 1
                      }}
                      className="calendar-day"
                    >
                      {dayData.event && (
                        <>
                          <div className="desktop-only" style={{
                            position: 'absolute', top: '-10px', left: '9px',
                            background: '#1a3056ff',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--accent-primary)', fontSize: '0.6rem', fontWeight: 700,
                            padding: '1px 6px', whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis', textTransform: 'uppercase', letterSpacing: '0.5px',
                            maxWidth: 'calc(100% - 24px)', zIndex: 15,
                            borderRadius: '12px'
                          }}>
                            ★ {dayData.event}
                          </div>
                          <div className="mobile-only" style={{
                            position: 'absolute', top: '-6px', left: '2px',
                            background: '#1f3a68ff',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#60a5fa', fontSize: '0.5rem', fontWeight: 800,
                            padding: '1px 2px', whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis', textTransform: 'uppercase', letterSpacing: '0.2px',
                            maxWidth: 'calc(100% - 4px)', zIndex: 15,
                            borderRadius: '4px', lineHeight: 1
                          }}>
                            {dayData.event}
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', zIndex: 10 }}>
                        <div className="calendar-day-number" style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: (isPast && !isToday && peekDay !== dateStr) ? 0.5 : 1 }}>
                          <span style={{ fontSize: isExpanded ? '1.2rem' : '1.05rem', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', lineHeight: 1 }}>
                            {day}
                          </span>
                        </div>
                        <div className="desktop-only"
                          onMouseEnter={(e) => { e.stopPropagation(); setPeekDay(dateStr); }}
                          onMouseLeave={(e) => { e.stopPropagation(); setPeekDay(null); }}
                          style={{ padding: '2px', display: (dayData.checklist.length > 0 || dayData.tasks.length > 0 || dayData.event) ? 'block' : 'none' }}
                        >
                          <Eye size={isExpanded ? 16 : 14} color="var(--text-secondary)" style={{ opacity: peekDay === dateStr ? 1 : 0.4, transition: 'opacity 0.2s' }} />
                        </div>
                      </div>

                      <div className="mobile-only" style={{ width: '100%', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', marginTop: 'auto' }}>
                        {(completedChecklist.length > 0 || (isPast && !isToday && incompleteCount > 0) || (isToday && incompleteCount > 0)) && (
                          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '2px', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', width: '100%' }}>
                            {(isPast && !isToday && incompleteCount > 0) && (
                              <div style={{ flexShrink: 0, width: '11px', height: '11px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(252, 165, 165, 0.3)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7.5px', fontWeight: 900, color: '#fca5a5' }}>
                                {incompleteCount}
                              </div>
                            )}
                            {(isToday && incompleteCount > 0) && (
                              <div style={{ flexShrink: 0, width: '11px', height: '11px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7.5px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.8)' }}>
                                {incompleteCount}
                              </div>
                            )}
                            {completedChecklist.slice(0, 1).map((item, i) => (
                              <CheckSquare key={'mcs' + i} size={11} color="#10b981" strokeWidth={3} style={{ flexShrink: 0 }} />
                            ))}
                            {completedChecklist.length > 1 && (
                              <div style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0px 2px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                                +{completedChecklist.length - 1}
                              </div>
                            )}
                          </div>
                        )}
                        {dayData.tasks.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '2px', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', width: '100%' }}>
                            {dayData.tasks.slice(0, 2).map((task, i) => (
                              <div key={'mts' + i} style={{ flexShrink: 0, width: '6px', height: '6px', borderRadius: '50%', background: task.label_color || 'var(--text-secondary)' }} />
                            ))}
                            {dayData.tasks.length > 2 && (
                              <div style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0px 2px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                                +{dayData.tasks.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="desktop-only" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {(isExpanded || isToday) ? (
                          <div style={{ marginTop: '6px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {(isPast && !isToday && incompleteCount > 0) && (
                              <div className="task-dot-container" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, justifyContent: 'flex-start', width: 'max-content' }}>
                                <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(252, 165, 165, 0.3)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900, color: '#fca5a5' }}>
                                  {incompleteCount}
                                </div>
                                <div className="task-dot-tooltip">{incompleteCount} pending items</div>
                              </div>
                            )}

                            {isToday && incompleteChecklist.slice(0, 3).map((item, i) => (
                              <div key={'inc' + i} style={{ flexShrink: 0, fontSize: '0.7rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>
                                <Square size={12} color="var(--text-secondary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.1' }}>{item.text}</span>
                              </div>
                            ))}

                            {completedChecklist.slice(0, 3 - Math.min(isToday ? incompleteChecklist.length : 0, 3)).map((item, i) => (
                              <div key={'c' + i} style={{ flexShrink: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9, textDecoration: isToday ? 'line-through' : 'none' }}>
                                <CheckSquare size={12} color="#10b981" strokeWidth={3} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.1' }}>{item.text}</span>
                              </div>
                            ))}

                            {dayData.tasks.slice(0, 3 - Math.min((isToday ? incompleteChecklist.length : 0) + completedChecklist.length, 3)).map((task, i) => (
                              <div key={'t' + i} style={{ flexShrink: 0, fontSize: '0.7rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.label_color || 'var(--text-secondary)', flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.1' }}>{task.text}</span>
                              </div>
                            ))}

                            {((isToday ? incompleteChecklist.length : 0) + completedChecklist.length + dayData.tasks.length > 3) && (
                              <div style={{ flexShrink: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600, paddingLeft: '15px' }}>
                                +{(isToday ? incompleteChecklist.length : 0) + completedChecklist.length + dayData.tasks.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', width: '100%', overflow: 'hidden' }}>
                            {(completedChecklist.length > 0 || (isPast && !isToday && incompleteCount > 0)) && (
                              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', width: '100%' }}>
                                {(isPast && !isToday && incompleteCount > 0) && (
                                  <div className="task-dot-container" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginRight: '2px', width: 'max-content' }}>
                                    <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(252, 165, 165, 0.3)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900, color: '#fca5a5' }}>
                                      {incompleteCount}
                                    </div>
                                    <div className="task-dot-tooltip">{incompleteCount} pending items</div>
                                  </div>
                                )}
                                {completedChecklist.slice(0, 4).map((item, i) => (
                                  <div key={'cs' + i} className="task-dot-container" style={{ flexShrink: 0, width: 'max-content' }}>
                                    <CheckSquare size={12} color="#10b981" strokeWidth={3} />
                                    <div className="task-dot-tooltip">{item.text}</div>
                                  </div>
                                ))}
                                {completedChecklist.length > 4 && (
                                  <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700, flexShrink: 0, marginLeft: '2px' }}>
                                    +{completedChecklist.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                            {dayData.tasks.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', width: '100%' }}>
                                {dayData.tasks.slice(0, 6).map((task, i) => (
                                  <div key={'ts' + i} className="task-dot-container" style={{ flexShrink: 0 }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.label_color || 'var(--text-secondary)' }} />
                                    <div className="task-dot-tooltip">
                                      {task.label_name ? task.label_name : 'Unlabeled'}
                                    </div>
                                  </div>
                                ))}
                                {dayData.tasks.length > 6 && (
                                  <div style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700, flexShrink: 0, marginLeft: '2px' }}>
                                    +{dayData.tasks.length - 6}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Peek Popover */}
                      {peekDay === dateStr && (dayData.checklist.length > 0 || dayData.tasks.length > 0 || dayData.event) && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '10px',
                          background: 'rgba(30, 41, 59, 0.85)',
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '12px',
                          padding: '16px',
                          width: '250px',
                          zIndex: 50,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          color: '#fff',
                          cursor: 'default'
                        }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                              {parseInt(dateStr.split('-')[2])} {new Date(dateStr).toLocaleString('default', { month: 'short' })}, {new Date(dateStr).toLocaleString('default', { weekday: 'short' })}
                            </h4>
                            {dayData.event && (
                              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '4px 8px', borderRadius: '6px', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '110px' }} title={dayData.event}>
                                <Star size={10} fill="currentColor" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dayData.event}</span>
                              </div>
                            )}
                          </div>

                          {dayData.checklist.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Checklist</div>
                              <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {[...dayData.checklist].sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? -1 : 1)).map((item, i) => (
                                  <div key={'cp' + i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: item.is_completed ? 0.5 : 1, textDecoration: item.is_completed ? 'line-through' : 'none', lineHeight: '1.2' }}>
                                    {item.is_completed ? <CheckSquare size={10} color="#10b981" strokeWidth={3} style={{ flexShrink: 0 }} /> : <Square size={10} color="var(--text-secondary)" strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {dayData.tasks.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasks Did</div>
                              <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {dayData.tasks.map((task, i) => (
                                  <div key={'tp' + i} style={{ fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center', lineHeight: '1.2' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.label_color || 'var(--text-secondary)', flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <AnalyticsGrid currentDate={currentDate} labels={labels} />
      )}

      {showLabelManager && <LabelManager labels={labels} fetchLabels={fetchLabels} onClose={() => setShowLabelManager(false)} onUpdate={onUpdate} />}
      {showUpcomingEvents && <UpcomingEvents onClose={() => setShowUpcomingEvents(false)} />}

      {showMobileChecklist && (
        <MobileChecklistModal
          onClose={() => setShowMobileChecklist(false)}
          todayData={monthData[`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`] || { checklist: [], tasks: [], event: null }}
          onUpdate={onUpdate}
          modalTheme={modalTheme}
        />
      )}

      {!isAnyModalOpen && createPortal(
        <button
          className="mobile-only"
          onClick={() => setShowMobileChecklist(true)}
          style={{
            position: 'fixed',
            bottom: '64px',
            right: '32px',
            width: '48px',
            height: '48px',
            padding: 0,
            borderRadius: '12px',
            background: themeBgBtn,
            backdropFilter: 'blur(16px)',
            border: themeBorderBtn,
            color: themeColorBtn,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <ListTodo size={28} />
        </button>,
        document.body
      )}
    </div>
  );
}
