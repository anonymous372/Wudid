import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Activity, Flame, Heart, Droplets, Dumbbell, BookOpen, Moon, CheckCircle2, Smile, Star, Zap, Coffee, Footprints, Bike, Utensils, Apple, BedDouble, Target, Timer } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const ICONS = {
  Activity: <Activity size={20} />,
  Flame: <Flame size={20} />,
  Heart: <Heart size={20} />,
  Droplets: <Droplets size={20} />,
  Dumbbell: <Dumbbell size={20} />,
  Footprints: <Footprints size={20} />,
  Bike: <Bike size={20} />,
  Utensils: <Utensils size={20} />,
  Apple: <Apple size={20} />,
  Moon: <Moon size={20} />,
  BedDouble: <BedDouble size={20} />,
  BookOpen: <BookOpen size={20} />,
  CheckCircle2: <CheckCircle2 size={20} />,
  Smile: <Smile size={20} />,
  Star: <Star size={20} />,
  Zap: <Zap size={20} />,
  Coffee: <Coffee size={20} />,
  Target: <Target size={20} />,
  Timer: <Timer size={20} />
};

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

export default function HabitModal({ onClose, onSave, initialHabit = null }) {
  const [name, setName] = useState(initialHabit ? initialHabit.name : '');
  const [type, setType] = useState(initialHabit ? initialHabit.type : 'boolean');
  const [unit, setUnit] = useState(initialHabit ? initialHabit.unit : '');
  const [targetValue, setTargetValue] = useState(initialHabit && initialHabit.target_value !== null ? initialHabit.target_value : '');
  const [targetType, setTargetType] = useState(initialHabit && initialHabit.target_type ? initialHabit.target_type : 'daily_quota');
  const [icon, setIcon] = useState(initialHabit ? initialHabit.icon : 'Activity');
  const [color, setColor] = useState(initialHabit ? initialHabit.color : '#3b82f6');
  const [frequency, setFrequency] = useState(initialHabit ? initialHabit.frequency : 'daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      target_type: type === 'numeric' ? targetType : null,
      icon,
      color,
      frequency
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
              placeholder="e.g. Drink Water, Skincare, Weight"
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
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Checklist routine (Gym, Skincare)</span>
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
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Log numbers (Weight, Water, Sleep)</span>
              </button>
            </div>
          </div>

          {type === 'numeric' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Unit (e.g. mL, kg, hrs)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="mL, kg, pages"
                    className="input-field"
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Target Goal
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    placeholder="e.g. 2500, 72, 8"
                    className="input-field no-spinner"
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Goal Tracking Behavior
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTargetType('daily_quota')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${targetType === 'daily_quota' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                      background: targetType === 'daily_quota' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: targetType === 'daily_quota' ? '#60a5fa' : 'var(--text-secondary)',
                      fontSize: '0.85rem', transition: 'all 0.2s', textAlign: 'center'
                    }}
                  >
                    Daily Quota / Fill Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('milestone')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${targetType === 'milestone' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                      background: targetType === 'milestone' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: targetType === 'milestone' ? '#60a5fa' : 'var(--text-secondary)',
                      fontSize: '0.85rem', transition: 'all 0.2s', textAlign: 'center'
                    }}
                  >
                    Milestone / Trend Line
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Icon
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.keys(ICONS).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  style={{
                    width: '42px', height: '42px', borderRadius: '10px', cursor: 'pointer',
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
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                    backgroundColor: c,
                    border: color === c ? '3px solid white' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 12px ${c}80` : 'none',
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
