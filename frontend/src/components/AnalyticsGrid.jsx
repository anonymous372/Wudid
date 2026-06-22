import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Rectangle, Sector } from 'recharts';
import { BarChart2, TrendingUp, Activity, ChevronDown } from 'lucide-react';
import YearlyHeatmap from './YearlyHeatmap';

const API_BASE = 'http://localhost:3001/api';

export default function AnalyticsGrid({ currentDate }) {
  const [viewScope, setViewScope] = useState('month'); // 'week' or 'month'
  const [stats, setStats] = useState({ totalTasks: 0, totalCompletedChecklist: 0, dailyData: [], labelData: [], rawTasks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState(-1);
  const [chartType, setChartType] = useState('bar'); // 'bar', 'line', 'smooth'
  const [isChartMenuOpen, setIsChartMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    fetch(`${API_BASE}/stats/monthly/${year}/${month}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('wudid_jwt')}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [currentDate]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const weekTitle = isCurrentMonth ? 'Past 7 Days' : 'First 7 Days';

  const getFullRangeDates = () => {
    const dates = [];
    if (viewScope === 'week') {
      let endDate;
      if (isCurrentMonth) {
        endDate = new Date(today);
      } else {
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 7);
      }
      for (let i = 6; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        dates.push(d);
      }
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(new Date(year, month, i));
      }
    }
    return dates;
  };

  const chartData = getFullRangeDates().map(d => {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayData = stats.dailyData.find(item => item.date === dateStr);
    const dateFormatted = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    const tasksCount = dayData ? dayData.tasksCount : 0;
    const checklistCount = dayData ? dayData.checklistCount : 0;
    return {
      dateNum: d.getDate(),
      dateFormatted,
      Tasks: tasksCount,
      Checklist: checklistCount,
      Total: tasksCount + checklistCount
    };
  });

  let displayLabelData = stats.labelData;
  if (viewScope === 'week' && stats.rawTasks) {
    const labelDataMap = {};
    let endDate;
    if (isCurrentMonth) {
      endDate = new Date(today);
    } else {
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 7);
    }
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    for (const task of stats.rawTasks) {
      if (task.date >= startStr && task.date <= endStr) {
        const lblName = task.label_name || 'Unlabeled';
        const lblColor = task.label_color || '#94a3b8';
        if (!labelDataMap[lblName]) labelDataMap[lblName] = { name: lblName, color: lblColor, value: 0 };
        labelDataMap[lblName].value++;
      }
    }
    displayLabelData = Object.values(labelDataMap).sort((a, b) => b.value - a.value);
  }

  const TasksShape = (props) => {
    const { x, y, width, height, fill, payload } = props;
    if (height === 0 || !height) return null;
    const r = payload.Checklist > 0 ? 0 : 4;
    return <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[r, r, 0, 0]} />;
  };

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#fff" fontSize="1.5rem" fontWeight="700" dominantBaseline="central">
          {value}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill={fill} fontSize="0.65rem" fontWeight="600" letterSpacing="0.5px" dominantBaseline="central">
          {payload.name ? payload.name.toUpperCase() : ''}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ outline: 'none' }}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const container = document.getElementById('analytics-tooltip-container');
      if (!container) return null;
      
      return createPortal(
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.65rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'row',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            {data.dateFormatted}
          </div>
          <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />
              <span>{data.Checklist} Checklists</span>
            </div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
              <span>{data.Tasks} Tasks</span>
            </div>
          </div>
        </div>,
        container
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
          <button 
            onClick={() => setViewScope('week')}
            style={{ 
              padding: '6px 16px', 
              background: viewScope === 'week' ? 'var(--accent-primary)' : 'transparent', 
              color: viewScope === 'week' ? '#fff' : 'var(--text-secondary)',
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {weekTitle}
          </button>
          <button 
            onClick={() => setViewScope('month')}
            style={{ 
              padding: '6px 16px', 
              background: viewScope === 'month' ? 'var(--accent-primary)' : 'transparent', 
              color: viewScope === 'month' ? '#fff' : 'var(--text-secondary)',
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Full Month
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading analytics...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '8px' }}>
            <div className="glass glass-card" style={{ height: '300px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Activity ({viewScope === 'week' ? weekTitle : currentMonthName})</h3>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setIsChartMenuOpen(!isChartMenuOpen)}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    {chartType === 'bar' ? <BarChart2 size={12} /> : chartType === 'line' ? <TrendingUp size={12} /> : <Activity size={12} />}
                    <span style={{ margin: '0 2px' }}>{chartType === 'bar' ? 'Bar Chart' : chartType === 'line' ? 'Line Chart' : 'Smooth Line'}</span>
                    <ChevronDown size={12} />
                  </button>
                  {isChartMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '4px',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      minWidth: '140px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}>
                      <button onClick={() => { setChartType('bar'); setIsChartMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'left', background: chartType === 'bar' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                        <BarChart2 size={14} /> Bar Chart
                      </button>
                      <button onClick={() => { setChartType('line'); setIsChartMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'left', background: chartType === 'line' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                        <TrendingUp size={14} /> Line Chart
                      </button>
                      <button onClick={() => { setChartType('smooth'); setIsChartMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'left', background: chartType === 'smooth' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                        <Activity size={14} /> Smooth Line
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div id="analytics-tooltip-container" style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}></div>

              {chartData.length > 0 ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={chartData}>
                        <XAxis dataKey="dateNum" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="Tasks" stackId="a" fill="var(--accent-primary)" shape={TasksShape} />
                        <Bar dataKey="Checklist" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <XAxis dataKey="dateNum" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line name="Total Contributions" type={chartType === 'smooth' ? 'monotone' : 'linear'} dataKey="Total" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--accent-primary)", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0, fill: "var(--accent-primary)" }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No data for this period.
                </div>
              )}
            </div>

            <div className="glass glass-card" style={{ height: '300px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Label Breakdown ({viewScope === 'week' ? weekTitle : currentMonthName})</h3>

              {displayLabelData.length > 0 ? (
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart style={{ outline: 'none' }}>
                      <Pie
                        data={displayLabelData}
                        cx="40%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(-1)}
                      >
                        {displayLabelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right" 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '12px' }} 
                        formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No labeled tasks for this month.
                </div>
              )}
            </div>
          </div>

          <YearlyHeatmap year={currentDate.getFullYear()} />
        </>
      )}
    </div>
  );
}
