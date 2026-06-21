import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag } from 'lucide-react';

export default function InlineLabelPicker({ currentLabelId, labels, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!isOpen && pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current && !pickerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const currentLabel = labels.find(l => l.id === currentLabelId);

  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      <button 
        onClick={toggleOpen}
        style={{
          background: currentLabel ? `${currentLabel.color}20` : 'transparent',
          color: currentLabel ? currentLabel.color : 'var(--text-secondary)',
          border: `1px solid ${currentLabel ? currentLabel.color + '40' : 'transparent'}`,
          padding: currentLabel ? '2px 6px' : '2px 4px',
          borderRadius: '12px',
          fontSize: '0.65rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          opacity: currentLabel ? 1 : 0.4,
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
        onMouseEnter={(e) => { if (!currentLabel) e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={(e) => { if (!currentLabel) e.currentTarget.style.opacity = '0.4'; }}
      >
        <Tag size={currentLabel ? 12 : 14} />
        {currentLabel && <span>{currentLabel.name}</span>}
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 9999,
            minWidth: '140px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <button 
            onClick={() => { onSelect(null); setIsOpen(false); }}
            style={{ textAlign: 'left', padding: '8px', fontSize: '0.85rem', borderRadius: '6px', background: !currentLabelId ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'var(--text-primary)' }}
          >
            No Label
          </button>
          {labels.map(l => (
            <button 
              key={l.id}
              onClick={() => { onSelect(l.id); setIsOpen(false); }}
              style={{ 
                textAlign: 'left', 
                padding: '8px', 
                fontSize: '0.85rem', 
                borderRadius: '6px', 
                background: currentLabelId === l.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: '8px',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
              {l.name}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
