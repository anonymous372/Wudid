import { useState } from 'react';
import { Plus, Tag, Settings } from 'lucide-react';
import LabelManager from './LabelManager';

const API_BASE = 'http://localhost:3001/api';

export default function TaskLog({ date, tasks, labels, fetchLabels, onUpdate }) {
  const [newTask, setNewTask] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [showLabelManager, setShowLabelManager] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        date, 
        text: newTask,
        label_id: selectedLabel || null
      })
    }).then(() => {
      setNewTask('');
      onUpdate();
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Tasks I Did</h3>
        <button className="btn-icon" onClick={() => setShowLabelManager(true)} title="Manage Labels">
          <Settings size={18} />
        </button>
      </div>
      
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value={newTask} 
          onChange={e => setNewTask(e.target.value)}
          placeholder="What did you get done today?" 
          className="input-field"
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={selectedLabel} 
            onChange={e => setSelectedLabel(e.target.value)}
            className="input-field"
            style={{ flex: 1, padding: '10px' }}
          >
            <option value="">No Label</option>
            {labels.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add
          </button>
        </div>
      </form>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map(task => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ flex: 1 }}>{task.text}</div>
            {task.label_name && (
              <div style={{ 
                background: `${task.label_color}20`, 
                color: task.label_color, 
                border: `1px solid ${task.label_color}40`,
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '0.8rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Tag size={12} />
                {task.label_name}
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No logged tasks for today.</div>}
      </div>

      {showLabelManager && (
        <LabelManager 
          labels={labels} 
          fetchLabels={fetchLabels} 
          onClose={() => setShowLabelManager(false)} 
        />
      )}
    </div>
  );
}
