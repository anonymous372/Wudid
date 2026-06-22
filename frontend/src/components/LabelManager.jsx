import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function LabelManager({ labels, fetchLabels, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    fetch(`${API_BASE}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    }).then(() => {
      setName('');
      fetchLabels();
    });
  };
  
  const startEdit = (l) => {
    setEditingId(l.id);
    setEditName(l.name);
    setEditColor(l.color);
  };
  
  const saveEdit = () => {
    if (!editName.trim()) return;
    fetch(`${API_BASE}/labels/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, color: editColor })
    }).then(() => {
      setEditingId(null);
      fetchLabels();
    });
  };
  
  const executeDelete = (id) => {
    fetch(`${API_BASE}/labels/${id}`, {
      method: 'DELETE'
    }).then(() => {
      setPendingDelete(null);
      fetchLabels();
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
    }} onClick={onClose}>
      <div className="glass glass-card" style={{ width: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Manage Labels</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input 
            type="color" 
            value={color} 
            onChange={e => setColor(e.target.value)}
            style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
          />
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="New Label Name" 
            className="input-field"
          />
          <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}><Plus size={20} /></button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {labels.map(l => (
            <div key={l.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {editingId === l.id ? (
                  <>
                    <input 
                      type="color" 
                      value={editColor} 
                      onChange={e => setEditColor(e.target.value)}
                      style={{ width: '30px', height: '30px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      className="input-field"
                      style={{ padding: '6px', flex: 1 }}
                      autoFocus
                    />
                    <button className="btn-icon" onClick={saveEdit} style={{ color: 'var(--success-color)' }}><Check size={16} /></button>
                    <button className="btn-icon" onClick={() => setEditingId(null)}><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: l.color }} />
                    <span style={{ flex: 1 }}>{l.name}</span>
                    <button className="btn-icon" onClick={() => startEdit(l)} style={{ padding: '6px' }}><Pencil size={14} /></button>
                    <button className="btn-icon" onClick={() => {
                      if (l.taskCount > 0) {
                        setPendingDelete(l);
                      } else {
                        executeDelete(l.id);
                      }
                    }} style={{ padding: '6px', color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
              
              {pendingDelete && pendingDelete.id === l.id && (
                <div style={{ padding: '10px 4px 0 4px', marginTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    This label is used by {l.taskCount} task(s). Deleting it will remove the label from those tasks.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setPendingDelete(null)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                    <button onClick={() => executeDelete(l.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {labels.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No labels created yet.</div>}
        </div>
      </div>
    </div>
  );
}
