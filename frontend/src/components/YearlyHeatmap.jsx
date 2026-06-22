import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

export default function YearlyHeatmap({ year }) {
  const [data, setData] = useState({});
  const [hoverData, setHoverData] = useState(null);
  
  useEffect(() => {
    fetch(`${API_BASE}/stats/yearly/${year}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('wudid_jwt')}` }
    })
      .then(res => res.json())
      .then(resData => setData(resData))
      .catch(console.error);
  }, [year]);

  // Generate all days in the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const days = [];
  
  // Pad the beginning to align weeks (Sunday = 0)
  for (let i = 0; i < startDate.getDay(); i++) {
    days.push(null);
  }
  
  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    days.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  const getColor = (count) => {
    if (!count) return 'rgba(255, 255, 255, 0.05)';
    if (count === 1) return 'rgba(59, 130, 246, 0.4)';
    if (count <= 3) return 'rgba(59, 130, 246, 0.7)';
    if (count <= 6) return 'rgba(59, 130, 246, 1)';
    return '#60a5fa'; // Brightest blue for high activity
  };

  const formatHeatmapDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })}, ${d.getFullYear().toString().slice(-2)}`;
  };

  return (
    <div className="glass glass-card" style={{ marginTop: '24px', position: 'relative' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{year} Activity</h3>
      
      <div style={{ display: 'flex', gap: '8px', paddingBottom: '16px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateRows: 'repeat(7, 12px)', 
          gap: '4px',
          fontSize: '0.6rem',
          color: 'var(--text-secondary)',
          alignItems: 'center',
          textAlign: 'right',
          padding: '4px 0'
        }}>
          <div>S</div>
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
        </div>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateRows: 'repeat(7, 12px)', 
            gridAutoFlow: 'column', 
            gap: '4px',
            width: 'max-content',
            padding: '4px 2px'
          }}>
          {days.map((dateStr, i) => {
            if (!dateStr) return <div key={`pad-${i}`} style={{ width: '12px', height: '12px' }} />;
            
            const count = data[dateStr] || 0;
            return (
              <div 
                key={dateStr}
                onMouseEnter={() => setHoverData({ dateStr, count })}
                onMouseLeave={() => setHoverData(null)}
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '2px', 
                  backgroundColor: getColor(count),
                  transition: 'background 0.2s ease, transform 0.1s ease',
                  cursor: 'pointer'
                }}
                className="heatmap-cell"
              />
            );
          })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>Less</span>
        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.05)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.4)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.7)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(59, 130, 246, 1)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#60a5fa' }} />
        <span>More</span>
      </div>

      {hoverData && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '6px 8px',
          borderRadius: '4px',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <div style={{ color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            {formatHeatmapDate(hoverData.dateStr)}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#60a5fa' }} />
            <span>{hoverData.count} contributions</span>
          </div>
        </div>
      )}
      
      <style>{`
        .heatmap-cell:hover {
          transform: scale(1.2);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
