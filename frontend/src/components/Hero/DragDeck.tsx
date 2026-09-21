import React, { useState, useEffect, useRef } from 'react';

type Card = {
  id: number;
  label: string;
  x: number;
  y: number;
  accent: 'cyan' | 'lime' | 'amber';
};

export const DragDeck: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([
    { id: 1, label: 'DEMAND +45%', x: 6, y: 12, accent: 'cyan' },
    { id: 2, label: 'CAPACITY -30%', x: 52, y: 6, accent: 'amber' },
    { id: 3, label: 'RISK WINDOW', x: 68, y: 62, accent: 'lime' },
  ]);

  const dragRef = useRef<{ id: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { id, ox, oy } = dragRef.current;
      setCards((cs) =>
        cs.map((c) => {
          if (c.id !== id) return c;
          const dx = ((e.clientX - ox) / window.innerWidth) * 100;
          const dy = ((e.clientY - oy) / window.innerHeight) * 100;
          return {
            ...c,
            x: Math.max(0, Math.min(80, c.x + dx)),
            y: Math.max(0, Math.min(78, c.y + dy)),
          };
        })
      );
      dragRef.current = { ...dragRef.current, ox: e.clientX, oy: e.clientY };
    };

    const up = () => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <div className="drag-deck" aria-label="Interactive draggable scenario cards">
      {cards.map((c) => (
        <button
          key={c.id}
          className={`drag-card ${c.accent}`}
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          onPointerDown={(e) => {
            dragRef.current = { id: c.id, ox: e.clientX, oy: e.clientY };
          }}
        >
          <span className="drag-tag">DRAG</span>
          <span className="drag-label">{c.label}</span>
          <i className="drag-icon">↗</i>
        </button>
      ))}
    </div>
  );
};
