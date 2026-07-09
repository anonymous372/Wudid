import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Flame, Star, Check, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Activity, Heart, Droplets, Dumbbell, BookOpen, Moon, CheckCircle2, Smile, Zap, Coffee, Pencil, Trash2, TrendingUp, BarChart2, BarChart3, Award, Sliders, Settings, Hash, Footprints, Bike, Utensils, Apple, BedDouble, Target, Timer, Link2, Unlink, Tag, Bath, ShowerHead, Scale, Gauge, Sparkles, Brush } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import confetti from 'canvas-confetti';
import HabitModal from './HabitModal';

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
  BookOpen: <BookOpen size={20} />,
  Smile: <Smile size={20} />,
  Star: <Star size={20} />,
  Zap: <Zap size={20} />,
  Coffee: <Coffee size={20} />,
  Target: <Target size={20} />,
  Timer: <Timer size={20} />
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* Requirement 4: Double-Click Numeric Value to Edit */
function DoubleTapNumericCell({ habit, log, onSave, isCompleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const currentNum = log && log.value_num !== null && log.value_num !== undefined ? log.value_num : null;
  const [val, setVal] = useState(currentNum !== null ? String(currentNum) : '');

  useEffect(() => {
    setVal(currentNum !== null ? String(currentNum) : '');
  }, [currentNum]);

  const handleSaveAndClose = () => {
    setIsEditing(false);
    const numVal = val === '' ? null : Number(val);
    if (numVal !== currentNum) {
      onSave(habit, val);
    }
  };

  const handleStep = (stepDelta, e) => {
    e.preventDefault();
    e.stopPropagation();
    const curr = val === '' || isNaN(Number(val)) ? 0 : Number(val);
    const nextVal = Math.max(0, Math.round((curr + stepDelta) * 10) / 10);
    setVal(String(nextVal));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveAndClose();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setVal(currentNum !== null ? String(currentNum) : '');
    }
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <input
            type="number"
            step="0.5"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleSaveAndClose}
            onKeyDown={handleKeyDown}
            className="no-spinner"
            style={{
              width: '58px', padding: '6px 4px', fontSize: '1.05rem', fontWeight: 700,
              textAlign: 'center', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', outline: 'none', boxShadow: 'none'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <button
              type="button"
              onMouseDown={(e) => handleStep(0.5, e)}
              onTouchStart={(e) => handleStep(0.5, e)}
              style={{
                background: 'transparent', border: 'none', padding: '2px 6px',
                color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Increase by 0.5"
            >
              <ChevronUp size={13} strokeWidth={3} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => handleStep(-0.5, e)}
              onTouchStart={(e) => handleStep(-0.5, e)}
              style={{
                background: 'transparent', border: 'none', padding: '2px 6px',
                color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Decrease by 0.5"
            >
              <ChevronDown size={13} strokeWidth={3} />
            </button>
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{habit.unit}</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onDoubleClick={() => setIsEditing(true)}
      title="Tap or double-click to edit numeric value"
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '10px',
        background: currentNum !== null ? `${habit.color}18` : 'rgba(255,255,255,0.04)',
        border: currentNum !== null ? `1px solid ${habit.color}50` : '1px solid var(--glass-border)',
        cursor: 'pointer', transition: 'all 0.2s',
        userSelect: 'none'
      }}
    >
      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: currentNum !== null ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {currentNum !== null ? currentNum : '—'}
      </span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        {habit.unit}
      </span>
    </div>
  );
}

function HabitChartTooltip({ active, payload, hId, unit, color, tableMonth }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const container = document.getElementById(`habit-chart-tooltip-${hId}`);
    if (!container) return null;

    const dayNumber = parseInt(data.dateString, 10);
    const dateFormatted = !isNaN(dayNumber) ? `${dayNumber} ${MONTH_NAMES[tableMonth].slice(0, 3)}` : data.dateString;

    return createPortal(
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>
          {dateFormatted}
        </div>
        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
          <span style={{ color: '#fff', fontWeight: 600 }}>{data.value} {unit}</span>
        </div>
      </div>,
      container
    );
  }
  return null;
}

function HabitNumericCard({ habit, logs, tableYear, tableMonth }) {
  const hId = habit._id || habit.id;
  const storageKey = `wudid_habit_chart_${habit.name ? habit.name.toLowerCase().replace(/\s+/g, '_') : hId}`;
  const [chartType, setChartType] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || 'line';
    } catch {
      return 'line';
    }
  });
  const [isChartMenuOpen, setIsChartMenuOpen] = useState(false);
  const menuRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsChartMenuOpen(false);
      }
    };
    if (isChartMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChartMenuOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, chartType);
    } catch { }
  }, [storageKey, chartType]);

  const monthPrefix = `${tableYear}-${String(tableMonth + 1).padStart(2, '0')}`;
  const chartData = [...logs]
    .filter(l => (l.habit_id?._id || l.habit_id || '').toString() === hId.toString() && l.value_num !== null && l.date && l.date.startsWith(monthPrefix))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(l => ({
      dateString: l.date.slice(8),
      value: l.value_num
    }));
  const allVals = chartData.map(d => d.value);
  if (habit.target_value !== null && habit.target_value !== undefined && habit.target_value !== '') {
    allVals.push(Number(habit.target_value));
  }
  let yDomain = ['auto', 'auto'];
  if (allVals.length > 0) {
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    if (minVal === maxVal) {
      yDomain = [Math.max(0, Math.floor(minVal - 2)), Math.ceil(maxVal + 2)];
    } else {
      const diff = maxVal - minVal;
      const pad = Math.max(1, Math.ceil(diff * 0.25));
      yDomain = [Math.max(0, Math.floor(minVal - pad)), Math.ceil(maxVal + pad)];
    }
  }

  return (
    <div
      className="glass glass-card"
      style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: habit.color }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {habit.name} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>({habit.unit})</span>
            </h4>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '18px' }}>
            {MONTH_NAMES[tableMonth]}
          </span>
        </div>

        {/* Chart Type Dropdown matching Tasks Dashboard */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsChartMenuOpen(!isChartMenuOpen)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {chartType === 'bar' ? <BarChart2 size={14} /> : chartType === 'line' ? <TrendingUp size={14} /> : <Activity size={14} />}
            <span>{chartType === 'bar' ? 'Bar Chart' : chartType === 'line' ? 'Line Chart' : 'Smooth Line'}</span>
            <ChevronDown size={13} />
          </button>

          {isChartMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '4px',
              zIndex: 25,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: '130px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}>
              <button
                onClick={() => { setChartType('bar'); setIsChartMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'left', background: chartType === 'bar' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
              >
                <BarChart2 size={14} /> Bar Chart
              </button>
              <button
                onClick={() => { setChartType('line'); setIsChartMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'left', background: chartType === 'line' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
              >
                <TrendingUp size={14} /> Line Chart
              </button>
              <button
                onClick={() => { setChartType('smooth'); setIsChartMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'left', background: chartType === 'smooth' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
              >
                <Activity size={14} /> Smooth Line
              </button>
            </div>
          )}
        </div>
      </div>

      <div id={`habit-chart-tooltip-${hId}`} style={{ position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }} />

      <div style={{ width: '100%', height: 180 }}>
        {chartData.length === 0 ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No logged history yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 18, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dateString" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={38} allowDecimals={false} domain={yDomain} />
                <Tooltip content={<HabitChartTooltip hId={hId} unit={habit.unit} color={habit.color} tableMonth={tableMonth} />} />
                {habit.target_value && (
                  <ReferenceLine y={habit.target_value} stroke="#10b981" strokeWidth={1} />
                )}
                <Bar dataKey="value" fill={habit.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 18, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dateString" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={38} allowDecimals={false} domain={yDomain} />
                <Tooltip content={<HabitChartTooltip hId={hId} unit={habit.unit} color={habit.color} tableMonth={tableMonth} />} />
                {habit.target_value && (
                  <ReferenceLine y={habit.target_value} stroke="#10b981" strokeWidth={1} />
                )}
                <Line
                  type={chartType === 'smooth' ? 'monotone' : 'linear'}
                  dataKey="value"
                  stroke={habit.color}
                  strokeWidth={3}
                  dot={{ r: 2, fill: habit.color }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

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

export default function HabitsModule({ refreshKey, labels: propLabels = [], onUpdate }) {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [labelsList, setLabelsList] = useState(propLabels || []);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [tableYear, setTableYear] = useState(today.getFullYear());
  const [tableMonth, setTableMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('wudid_habits_active_tab') || sessionStorage.getItem('wudid_habits_active_tab');
      return saved ? saved : 'routine';
    } catch {
      return 'routine';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wudid_habits_active_tab', activeTab);
      sessionStorage.setItem('wudid_habits_active_tab', activeTab);
    } catch { }
  }, [activeTab]);

  useEffect(() => {
    if (propLabels && propLabels.length > 0) setLabelsList(propLabels);
  }, [propLabels]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  /* Requirement 1 & 3 Modals */
  const [showManageModal, setShowManageModal] = useState(false);
  const [showLinkageModal, setShowLinkageModal] = useState(false);
  const [selectedDayModalDate, setSelectedDayModalDate] = useState(null);
  const [hoveredHabitHeader, setHoveredHabitHeader] = useState(null);
  const hoverTimeoutRef = React.useRef(null);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('wudid_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const [res, lblRes] = await Promise.all([
        fetch(`${API_BASE}/habits/data`, { headers }),
        fetch(`${API_BASE}/labels`, { headers })
      ]);
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
        setLogs(data.logs || []);
        setStats(data.stats || {});
      }
      if (lblRes.ok) {
        const lblData = await lblRes.json();
        if (Array.isArray(lblData)) setLabelsList(lblData);
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const getLogForHabit = (habitId, dateStr) => {
    return logs.find(l => (l.habit_id?._id || l.habit_id || '').toString() === (habitId?._id || habitId || '').toString() && l.date === dateStr);
  };

  const isHabitCompletedOnDate = (habit, dateStr) => {
    const log = getLogForHabit(habit._id || habit.id, dateStr);
    if (habit.type === 'boolean') {
      return log && log.value_bool === true;
    }
    return log && log.value_num !== null && log.value_num !== undefined && log.value_num > 0;
  };

  const handleToggleBoolForDate = async (habit, dateStr) => {
    const currentLog = getLogForHabit(habit._id || habit.id, dateStr);
    const newVal = !(currentLog && currentLog.value_bool === true);

    if (newVal && dateStr === todayStr) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    }

    const token = localStorage.getItem('wudid_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const res = await fetch(`${API_BASE}/habits/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          habit_id: habit._id || habit.id,
          date: dateStr,
          value_bool: newVal
        })
      });
      if (res.ok) {
        fetchData();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to log habit:', err);
    }
  };

  const handleNumericChangeForDate = async (habit, val, dateStr) => {
    const numVal = val === '' ? null : Number(val);
    const token = localStorage.getItem('wudid_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const res = await fetch(`${API_BASE}/habits/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          habit_id: habit._id || habit.id,
          date: dateStr,
          value_num: numVal
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to log habit numeric:', err);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit and all its logged history?')) return;
    const token = localStorage.getItem('wudid_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      await fetch(`${API_BASE}/habits/${habitId}`, { method: 'DELETE', headers });
      fetchData();
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const canGoForward = tableYear < today.getFullYear() || (tableYear === today.getFullYear() && tableMonth < today.getMonth());

  const canGoBack = (() => {
    if (!logs || logs.length === 0) return false;
    let earliestDate = null;
    for (const l of logs) {
      const isCompletedOrLogged = l.value_bool === true || (typeof l.value_num === 'number' && l.value_num > 0);
      if (isCompletedOrLogged) {
        if (!earliestDate || l.date < earliestDate) earliestDate = l.date;
      }
    }
    if (!earliestDate) return false;
    const earliestY = parseInt(earliestDate.slice(0, 4), 10);
    const earliestM = parseInt(earliestDate.slice(5, 7), 10) - 1;
    return tableYear > earliestY || (tableYear === earliestY && tableMonth > earliestM);
  })();

  const changeMonth = (delta) => {
    if (delta < 0 && !canGoBack) return;
    if (delta > 0 && !canGoForward) return;
    let nextM = tableMonth + delta;
    let nextY = tableYear;
    if (nextM > 11) {
      nextM = 0;
      nextY++;
    } else if (nextM < 0) {
      nextM = 11;
      nextY--;
    }
    setTableMonth(nextM);
    setTableYear(nextY);
  };

  const getMonthDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = daysInMonth; d >= 1; d--) {
      const dateObj = new Date(year, month, d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNum: d,
        weekday: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: dateObj.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dateStr === todayStr,
        isFuture: dateObj > today
      });
    }
    return days.filter(day => !day.isFuture);
  };

  const monthDays = getMonthDays(tableYear, tableMonth);
  const monthNames = MONTH_NAMES;

  const formatModalDateHeader = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      {/* Top Navigation & Actions Bar matching Tasks Module */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 1, minWidth: 0, fontSize: 'clamp(1.25rem, 5vw, 1.6rem)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {monthNames[tableMonth].slice(0, 3)} {String(tableYear).slice(-2)}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {/* Leftmost: Analytics Dashboard Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'analytics' ? 'routine' : 'analytics')}
            className="btn-icon"
            title={activeTab === 'analytics' ? "Switch to Calendar View" : "Switch to Analytics View"}
          >
            {activeTab === 'analytics' ? <CalendarIcon size={19} /> : <BarChart2 size={19} />}
          </button>

          {/* Manage Habits Button */}
          <button
            onClick={() => setShowManageModal(true)}
            className="btn-icon"
            title="Manage Habits"
          >
            <Settings size={19} />
          </button>

          {/* Link Habits to Task Labels Button */}
          <button
            onClick={() => setShowLinkageModal(true)}
            className="btn-icon"
            title="Link Habits to Task Labels (Auto-Sync)"
            style={{ position: 'relative' }}
          >
            <Link2 size={19} />
          </button>

          {/* Month Navigation - Desktop: Two circular individual buttons */}
          <div className="mobile-hide" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-icon"
              onClick={() => changeMonth(-1)}
              disabled={!canGoBack}
              title="Previous Month"
              style={{ opacity: canGoBack ? 1 : 0.25, cursor: canGoBack ? 'pointer' : 'default' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="btn-icon"
              onClick={() => changeMonth(1)}
              disabled={!canGoForward}
              title="Next Month"
              style={{ opacity: canGoForward ? 1 : 0.25, cursor: canGoForward ? 'pointer' : 'default' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Month Navigation - Mobile: Capsule button */}
          <div className="mobile-only" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => changeMonth(-1)}
              disabled={!canGoBack}
              title="Previous Month"
              style={{ background: 'transparent', border: 'none', padding: '6px 8px', color: 'var(--text-primary)', cursor: canGoBack ? 'pointer' : 'default', opacity: canGoBack ? 1 : 0.25, display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={19} />
            </button>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '16px' }} />
            <button
              onClick={() => changeMonth(1)}
              disabled={!canGoForward}
              title="Next Month"
              style={{ background: 'transparent', border: 'none', padding: '6px 8px', color: 'var(--text-primary)', cursor: canGoForward ? 'pointer' : 'default', opacity: canGoForward ? 1 : 0.25, display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your habits...</div>
      ) : habits.length === 0 ? (
        <div className="glass glass-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <Activity size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>No habits created yet</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px' }}>
              Start tracking daily routines like skincare, gym, or weight tracking to build long-term consistency.
            </p>
          </div>
          <button
            onClick={() => { setEditingHabit(null); setIsModalOpen(true); }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', fontWeight: 600 }}
          >
            <Plus size={18} />
            Create Your First Habit
          </button>
        </div>
      ) : activeTab === 'routine' ? (
        /* TABULAR VERTICAL CALENDAR TABLE matching Tasks Module */
        <div className="sleek-scrollbar" style={{ overflowX: 'auto', paddingBottom: '6px' }}>
          <table className="routine-table">
            <thead>
              <tr>
                <th className="routine-date-cell" style={{ textAlign: 'center', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap', verticalAlign: 'middle', padding: '4px 8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</span>
                </th>
                {habits.map(habit => (
                  <th
                    key={habit._id || habit.id}
                    className="routine-habit-cell"
                    style={{ borderBottom: '1px solid var(--glass-border)', position: 'relative' }}
                  >
                    <div
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredHabitHeader({
                            id: habit._id || habit.id,
                            text: `${habit.name} ${habit.unit ? `(${habit.unit})` : ''}`.trim(),
                            top: rect.top - 44,
                            left: rect.left + rect.width / 2
                          });
                        }, 350);
                      }}
                      onMouseLeave={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setHoveredHabitHeader(null);
                      }}
                      className="routine-habit-header-box"
                      style={{
                        background: `${habit.color}20`, color: habit.color,
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {ICONS[habit.icon] || <Activity size={20} />}
                      </div>
                      <span className="routine-habit-header-name" title={habit.name}>
                        {habit.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthDays.map(day => {
                return (
                  <tr
                    key={day.dateStr}
                    onClick={() => setSelectedDayModalDate(day.dateStr)}
                    title="Click to view or edit habits for this day"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Horizontal Date Cell: Date + Day in one compact row */}
                    <td className="routine-date-cell" style={{ whiteSpace: 'nowrap', padding: '3px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: day.isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                          fontSize: '0.94rem'
                        }}>
                          {day.monthName} {day.dayNum}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          color: day.isToday ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          background: day.isToday ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          padding: '1.5px 6px',
                          borderRadius: '5px',
                          fontWeight: 600
                        }}>
                          {day.weekday}
                        </span>
                      </div>
                    </td>

                    {/* Habit Columns */}
                    {habits.map(habit => {
                      const done = isHabitCompletedOnDate(habit, day.dateStr);
                      return (
                        <td key={habit._id || habit.id} className="routine-habit-cell">
                          <div
                            className="routine-habit-box"
                            style={{
                              background: done ? habit.color : 'rgba(255,255,255,0.025)',
                              border: done ? 'none' : '1px solid rgba(255,255,255,0.06)',
                              color: '#ffffff',
                              boxShadow: done ? `0 2px 8px ${habit.color}40` : 'none'
                            }}
                          >
                            {done && <Check size={14} strokeWidth={3} />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ANALYTICS & TRENDS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Streaks & Leaderboard Grid */}
          {/* Summary Cards Row - Horizontally scrollable, no scrollbar */}
          <div
            className="hide-scrollbar"
            style={{
              display: 'flex', flexDirection: 'row', gap: '16px',
              overflowX: 'auto', paddingBottom: '4px',
              scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}
          >
            {habits.map(habit => {
              const hId = habit._id || habit.id;
              const completedInMonth = monthDays.filter(day => isHabitCompletedOnDate(habit, day.dateStr)).length;

              return (
                <div
                  key={hId}
                  className="glass glass-card"
                  style={{
                    minWidth: '220px', flexShrink: 0,
                    padding: '16px', borderRadius: '18px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${habit.color}20`, color: habit.color
                      }}>
                        {ICONS[habit.icon] || <Activity size={18} />}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>{habit.name}</h4>
                    </div>

                    <div
                      title={habit.type === 'numeric' ? 'Numeric Habit' : 'Boolean Habit'}
                      style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: habit.type === 'numeric' ? '#60a5fa' : '#10b981'
                      }}
                    >
                      {habit.type === 'numeric' ? <Hash size={14} /> : <CheckCircle2 size={14} />}
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>This Month</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {completedInMonth} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{completedInMonth === 1 ? 'entry' : 'entries'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Numeric Trend Charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--accent-primary)" /> Numeric Progress Charts
            </h3>
            {habits.filter(h => h.type === 'numeric').length === 0 ? (
              <div className="glass glass-card" style={{ padding: '30px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                No numeric habits configured yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                {habits.filter(h => h.type === 'numeric').map(habit => (
                  <HabitNumericCard
                    key={habit._id || habit.id}
                    habit={habit}
                    logs={logs}
                    tableYear={tableYear}
                    tableMonth={tableMonth}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUIREMENT 3 & 4: DAY HABITS MODAL (NO EDIT/DELETE, DOUBLE-TAP NUMERIC) */}
      {selectedDayModalDate && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setSelectedDayModalDate(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
        >
          <div
            className="glass glass-card animate-scale-up"
            style={{ width: '100%', maxWidth: '520px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-color)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  {formatModalDateHeader(selectedDayModalDate)}
                </h3>
              </div>
              <button onClick={() => setSelectedDayModalDate(null)} className="btn-icon" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
              {habits.map(habit => {
                const hId = habit._id || habit.id;
                const log = getLogForHabit(hId, selectedDayModalDate);
                const isCompleted = isHabitCompletedOnDate(habit, selectedDayModalDate);
                const streakCount = stats[hId] ? stats[hId].currentStreak : 0;

                return (
                  <div
                    key={hId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '14px',
                      border: isCompleted ? `1px solid ${habit.color}50` : '1px solid var(--glass-border)',
                      background: isCompleted ? `${habit.color}10` : 'rgba(255,255,255,0.025)',
                      transition: 'all 0.2s ease', gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <button
                        onClick={() => {
                          if (habit.type === 'boolean') handleToggleBoolForDate(habit, selectedDayModalDate);
                        }}
                        style={{
                          width: '38px', height: '38px', borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isCompleted ? habit.color : `${habit.color}18`,
                          color: isCompleted ? '#ffffff' : habit.color,
                          border: 'none',
                          cursor: habit.type === 'boolean' ? 'pointer' : 'default',
                          transition: 'all 0.2s'
                        }}
                      >
                        {habit.type === 'boolean' && isCompleted ? <Check size={18} strokeWidth={3} /> : (ICONS[habit.icon] || <Activity size={18} />)}
                      </button>

                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {habit.name}
                        </div>
                      </div>
                    </div>

                    <div>
                      {habit.type === 'boolean' ? (
                        <button
                          onClick={() => handleToggleBoolForDate(habit, selectedDayModalDate)}
                          style={{
                            padding: '6px 14px', borderRadius: '10px', cursor: 'pointer',
                            border: isCompleted ? 'none' : '1px solid var(--glass-border)',
                            background: isCompleted ? habit.color : 'transparent',
                            color: isCompleted ? '#ffffff' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s'
                          }}
                        >
                          {isCompleted ? '✓ Done' : 'Check In'}
                        </button>
                      ) : (
                        <DoubleTapNumericCell
                          habit={habit}
                          log={log}
                          onSave={(h, v) => handleNumericChangeForDate(h, v, selectedDayModalDate)}
                          isCompleted={isCompleted}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REQUIREMENT 1: CIRCULAR NAV "MANAGE HABITS" MODAL */}
      {showManageModal && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowManageModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
        >
          <div
            className="glass glass-card animate-scale-up"
            style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-color)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Manage Habits
              </h3>
              <button onClick={() => setShowManageModal(false)} className="btn-icon" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
              {habits.map(habit => {
                const hId = habit._id || habit.id;
                return (
                  <div
                    key={hId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${habit.color}20`, color: habit.color
                      }}>
                        {ICONS[habit.icon] || <Activity size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {habit.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {habit.type === 'numeric' ? `Numeric (${habit.unit})` : 'Boolean Check'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setShowManageModal(false);
                          setEditingHabit(habit);
                          setIsModalOpen(true);
                        }}
                        className="btn-icon"
                        title="Edit Habit"
                        style={{ padding: '6px' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(hId)}
                        className="btn-icon"
                        title="Delete Habit"
                        style={{ padding: '6px', color: '#ef4444' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowManageModal(false);
                setEditingHabit(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', fontWeight: 600 }}
            >
              <Plus size={18} />
              Add Another Habit
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Fixed Unclipped Hover Tooltip for Habit Column Headers */}
      {hoveredHabitHeader && createPortal(
        <div style={{
          position: 'fixed',
          top: `${Math.max(12, hoveredHabitHeader.top)}px`,
          left: `${hoveredHabitHeader.left}px`,
          transform: 'translateX(-50%)',
          background: '#0f172a', color: '#f8fafc',
          padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
          whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.65)', zIndex: 99999,
          pointerEvents: 'none'
        }}>
          {hoveredHabitHeader.text}
        </div>,
        document.body
      )}

      {/* Habit to Task Label Linkage Manager Modal */}
      {showLinkageModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowLinkageModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass glass-card" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '540px', padding: '28px', borderRadius: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            background: 'var(--bg-color)', maxHeight: '85vh', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <Link2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Link Habits & Tasks
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowLinkageModal(false)} className="btn-icon" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <div className="sleek-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {habits.filter(h => h.type === 'boolean').length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No habits available yet to link with Task Labels.
                </div>
              ) : (
                habits.filter(h => h.type === 'boolean').map(habit => (
                  <div key={habit._id || habit.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: `${habit.color}25`, color: habit.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {ICONS[habit.icon] || <Activity size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {habit.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                      <CustomLabelDropdown
                        value={habit.linked_label_id || ''}
                        onChange={async (newLabelId) => {
                          const token = localStorage.getItem('wudid_token');
                          const headers = {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          };
                          try {
                            await fetch(`${API_BASE}/habits/${habit._id || habit.id}`, {
                              method: 'PUT',
                              headers,
                              body: JSON.stringify({ linked_label_id: newLabelId || null })
                            });
                            fetchData();
                            if (onUpdate) onUpdate();
                          } catch (err) {
                            console.error('Failed to update link:', err);
                          }
                        }}
                        labels={labelsList}
                        placeholder="-- Not Linked --"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLinkageModal(false)}
                className="btn-primary"
                style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Habit Modal (Create / Edit) */}
      {isModalOpen && (
        <HabitModal
          onClose={() => setIsModalOpen(false)}
          onSave={fetchData}
          initialHabit={editingHabit}
          labels={labelsList}
        />
      )}
    </div>
  );
}
