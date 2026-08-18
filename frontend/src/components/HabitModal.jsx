import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Activity, Flame, Heart, Droplets, Dumbbell, BookOpen, Moon, CheckCircle2, Smile, Star, Zap, Coffee, Footprints, Bike, Utensils, Apple, BedDouble, Target, Timer, Link2, Unlink, Tag, ChevronDown, Bath, ShowerHead, Scale, Gauge, Sparkles, Brush, Shirt, Phone } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const ICONS = {
  Activity: <Activity size={20} />,
  Flame: <Flame size={20} />,
  Heart: <Heart size={20} />,
  Droplets: <Droplets size={20} />,
  ShowerHead: <ShowerHead size={20} />,
  Dumbbell: <Dumbbell size={20} />,
  Footprints: <Footprints size={20} />,
  Bike: <Bike size={20} />,
  Gauge: <Gauge size={20} />,
  Utensils: <Utensils size={20} />,
  Apple: <Apple size={20} />,
  Moon: <Moon size={20} />,
  BedDouble: <BedDouble size={20} />,
  Sparkles: <Sparkles size={20} />,
  Brush: <Brush size={20} />,
  Shirt: <Shirt size={20} />,
  BookOpen: <BookOpen size={20} />,
  Smile: <Smile size={20} />,
  Star: <Star size={20} />,
  Zap: <Zap size={20} />,
  Coffee: <Coffee size={20} />,
  Target: <Target size={20} />,
  Timer: <Timer size={20} />,
  Phone: <Phone size={20} />
};

const COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#64748b'  // Slate
];

function CustomLabelDropdown({ value, onChange, labels, placeholder = "-- Not Linked --" }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selectedLabel = labels.find(l => (l._id || l.id) === value);

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="input-field"
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: selectedLabel ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.3)',
          border: selectedLabel ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.12)',
          color: selectedLabel ? '#60a5fa' : 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.88rem',
          fontWeight: selectedLabel ? 600 : 400
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Tag size={15} style={{ color: selectedLabel ? selectedLabel.color || '#60a5fa' : 'var(--text-secondary)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedLabel ? selectedLabel.name : placeholder}
          </span>
        </div>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {isOpen && createPortal(
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${Math.max(coords.width, 200)}px`,
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '14px',
              padding: '6px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
              zIndex: 99999,
              maxHeight: '220px',
              overflowY: 'auto'
            }}
            className="sleek-scrollbar"
          >
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.86rem',
                color: !value ? '#ffffff' : '#ef4444',
                background: !value ? 'rgba(255,255,255,0.08)' : 'transparent',
                fontWeight: !value ? 600 : 500
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = !value ? 'rgba(255,255,255,0.08)' : 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {value ? <Unlink size={15} style={{ color: '#ef4444' }} /> : <Link2 size={15} style={{ opacity: 0.5 }} />}
                <span>{value ? 'Unlink Label' : placeholder}</span>
              </div>
              {!value && <Check size={14} color="#60a5fa" />}
            </div>

            {labels.map(l => {
              const isSelected = (l._id || l.id) === value;
              return (
                <div
                  key={l._id || l.id}
                  onClick={() => {
                    onChange(l._id || l.id);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem',
                    color: '#ffffff',
                    background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    fontWeight: isSelected ? 600 : 400
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={15} style={{ color: l.color || '#60a5fa' }} />
                    <span>{l.name}</span>
                  </div>
                  {isSelected && <Check size={14} color="#60a5fa" />}
                </div>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default function HabitModal({ onClose, onSave, initialHabit = null, labels = [] }) {
  const [name, setName] = useState(initialHabit ? initialHabit.name : '');
  const [type, setType] = useState(initialHabit ? initialHabit.type : 'boolean');
  const [unit, setUnit] = useState(initialHabit ? initialHabit.unit : '');
  const [targetValue, setTargetValue] = useState(initialHabit && initialHabit.target_value !== null ? initialHabit.target_value : '');
  const [targetType, setTargetType] = useState(initialHabit && initialHabit.target_type ? initialHabit.target_type : null);
  const [icon, setIcon] = useState(initialHabit ? initialHabit.icon : 'Activity');
  const [color, setColor] = useState(initialHabit ? initialHabit.color : '#3b82f6');
  const [frequency, setFrequency] = useState(initialHabit ? initialHabit.frequency : 'daily');
  const [linkedLabelId, setLinkedLabelId] = useState(() => {
    if (!initialHabit || !initialHabit.linked_label_id) return '';
    if (typeof initialHabit.linked_label_id === 'object') return initialHabit.linked_label_id._id || initialHabit.linked_label_id.id || '';
    return initialHabit.linked_label_id || '';
  });
  const [availableLabels, setAvailableLabels] = useState(labels || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (labels && labels.length > 0) {
      setAvailableLabels(labels);
    } else {
      const token = localStorage.getItem('wudid_token');
      fetch(`${API_BASE}/labels`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAvailableLabels(data);
        })
        .catch(() => {});
    }
  }, [labels]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('wudid_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const body = {
      name: name.trim(),
      type,
      unit: type === 'numeric' ? unit.trim() : '',
      target_value: type === 'numeric' && targetValue !== '' ? Number(targetValue) : null,
      target_type: type === 'numeric' ? 'daily_quota' : null,
      icon,
      color,
      frequency,
      linked_label_id: type === 'boolean' && linkedLabelId ? linkedLabelId : null
    };

    try {
      const url = initialHabit ? `${API_BASE}/habits/${initialHabit._id || initialHabit.id}` : `${API_BASE}/habits`;
      const method = initialHabit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save habit');
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="glass glass-card" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        background: 'var(--bg-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {initialHabit ? 'Edit Habit' : 'Create New Habit'}
          </h3>
          <button onClick={onClose} className="btn-icon" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Habit Name"
              className="input-field"
              style={{ width: '100%', padding: '12px 14px', fontSize: '0.95rem' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Habit Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setType('boolean')}
                style={{
                  padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  border: `1px solid ${type === 'boolean' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                  background: type === 'boolean' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: type === 'boolean' ? '#60a5fa' : 'var(--text-secondary)',
                  fontWeight: type === 'boolean' ? 600 : 400, transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>Yes / No Toggle</span>
              </button>

              <button
                type="button"
                onClick={() => setType('numeric')}
                style={{
                  padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  border: `1px solid ${type === 'numeric' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                  background: type === 'numeric' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: type === 'numeric' ? '#60a5fa' : 'var(--text-secondary)',
                  fontWeight: type === 'numeric' ? 600 : 400, transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>Numeric Tracker</span>
              </button>
            </div>
          </div>

          {type === 'numeric' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Target Goal
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    placeholder=""
                    className="input-field no-spinner"
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. kg, mL, hrs"
                    className="input-field"
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Icon
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: '8px' }}>
              {Object.keys(ICONS).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  style={{
                    width: '100%', height: '42px', borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${icon === key ? color : 'rgba(255,255,255,0.08)'}`,
                    background: icon === key ? `${color}25` : 'rgba(255,255,255,0.03)',
                    color: icon === key ? color : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {ICONS[key]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Theme Color
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: '10px' }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '100%', height: '32px', borderRadius: '50%', cursor: 'pointer',
                    background: c, border: `2px solid ${color === c ? '#fff' : 'transparent'}`,
                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.95rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ flex: 2, padding: '12px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600 }}
            >
              {isSubmitting ? 'Saving...' : initialHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
