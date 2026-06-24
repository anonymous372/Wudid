import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarDays, ChevronDown, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function UpcomingEvents({ onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(5);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/events/upcoming`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('wudid_jwt')}` }
        });
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysLeft = (dateStr) => {
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayedEvents = limit === 'All' ? events : events.slice(0, limit);

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
    }} onClick={onClose}>
      <div className="glass glass-card animate-fade-in" style={{ width: '450px', maxWidth: '90%', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <CalendarDays size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Upcoming Events</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="responsive-dropdown"
                style={{
                  display: 'flex', alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: 'var(--text-primary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                Show: {limit} <ChevronDown size={14} />
              </button>
              
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '4px', zIndex: 10, minWidth: '100px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                  {[5, 10, 'All'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setLimit(opt); setIsDropdownOpen(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', background: limit === opt ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        border: 'none', borderRadius: '4px', color: limit === opt ? 'var(--accent-primary)' : 'var(--text-primary)',
                        cursor: 'pointer', fontSize: '0.85rem'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-icon responsive-close-btn" onClick={onClose}><X /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>Loading events...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%' }}>
                <CalendarDays size={32} opacity={0.5} />
              </div>
              <div>No upcoming events scheduled.</div>
            </div>
          ) : (
            displayedEvents.map(event => {
              const daysLeftStr = getDaysLeft(event.date);
              const isSoon = daysLeftStr === 'Today' || daysLeftStr === 'Tomorrow' || parseInt(daysLeftStr.replace(/[^0-9]/g, '')) <= 3;
              
              return (
                <div key={event._id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  padding: '10px 16px', borderRadius: '12px', transition: 'all 0.2s',
                  borderLeft: isSoon ? '3px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{event.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(event.date)}</div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: isSoon ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)', 
                    color: isSoon ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                  }}>
                    <Clock size={14} />
                    {daysLeftStr}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
