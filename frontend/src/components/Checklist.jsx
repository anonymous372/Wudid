import { useState } from 'react';
import { Plus, CheckSquare, Square } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function Checklist({ date, items, isFuture, onUpdate }) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    fetch(`${API_BASE}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, text: newItem })
    }).then(() => {
      setNewItem('');
      onUpdate();
    });
  };

  const toggleItem = (id, currentStatus) => {
    if (isFuture) return;
    fetch(`${API_BASE}/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentStatus })
    }).then(onUpdate);
  };

  const incomplete = items.filter(i => !i.is_completed);
  const complete = items.filter(i => i.is_completed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>Checklist</h3>
      
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value={newItem} 
          onChange={e => setNewItem(e.target.value)}
          placeholder="Add a new to-do..." 
          className="input-field"
        />
        <button type="submit" className="btn-primary" style={{ padding: '12px' }}><Plus size={20} /></button>
      </form>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {incomplete.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', transition: 'all 0.2s' }}>
              {!isFuture && (
                <button onClick={() => toggleItem(item.id, item.is_completed)} style={{ color: 'var(--text-secondary)' }}>
                  <Square size={20} />
                </button>
              )}
              <span style={{ flex: 1 }}>{item.text}</span>
            </div>
          ))}
          {incomplete.length === 0 && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No pending tasks.</div>}
        </div>

        {complete.length > 0 && (
          <div style={{ marginTop: '16px', opacity: 0.6, borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Completed</h4>
            {complete.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px' }}>
                {!isFuture && (
                  <button onClick={() => toggleItem(item.id, item.is_completed)} style={{ color: 'var(--success-color)' }}>
                    <CheckSquare size={20} />
                  </button>
                )}
                <span style={{ flex: 1, textDecoration: 'line-through' }}>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
