import React, { useState } from 'react';
import { EVENTS } from '../../data/events';
import type { EventItem, ExtendedParams } from '../../types/decisiontwin';

type RadialCatalogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (params: Partial<ExtendedParams>) => void;
};

export const RadialEventCatalog: React.FC<RadialCatalogProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<EventItem>(EVENTS[0]);

  if (!isOpen) return null;

  const totalEvents = EVENTS.length;

  return (
    <div className="radial-catalog-overlay glass-panel">
      <div className="radial-catalog-modal">
        <div className="radial-modal-head">
          <div className="head-text">
            <span className="overline-tag">CIRCULAR CATALOG</span>
            <h3>EXPLORE SYSTEM EVENTS</h3>
          </div>
          <button className="close-radial-btn" onClick={onClose} aria-label="Close event catalog">
            ×
          </button>
        </div>

        <div className="radial-stage">
          {/* Central Control Hub */}
          <div className="radial-center-hub">
            <div className="hub-img-wrap">
              <img src={selectedEvent.image} alt={selectedEvent.title} className="hub-img" />
              <div className="hub-overlay" />
            </div>
            <div className="hub-info">
              <span className="hub-badge">{selectedEvent.badge}</span>
              <h4 className="hub-title">{selectedEvent.title}</h4>
              <p className="hub-desc">{selectedEvent.description}</p>
              <p className="hub-impact">
                <b>IMPACT:</b> {selectedEvent.impact}
              </p>

              <a
                href="#decision-room"
                className="btn btn-solid run-event-btn btn-magnetic"
                onClick={() => {
                  onSelectEvent(selectedEvent.params);
                  onClose();
                }}
              >
                RUN EVENT IN DECISION ROOM ↗
              </a>
            </div>
          </div>

          {/* Radial Orbit Container */}
          <div className="radial-orbit-ring">
            {EVENTS.map((evt, idx) => {
              const angle = (idx / totalEvents) * 360 - 90;
              const radius = 240; // px offset in orbit
              const isSelected = selectedEvent.id === evt.id;

              const style = {
                transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
              };

              return (
                <button
                  key={evt.id}
                  className={`orbit-item-node ${isSelected ? 'is-selected' : ''}`}
                  style={style}
                  onClick={() => setSelectedEvent(evt)}
                  title={evt.title}
                >
                  <div className="node-icon-dot" />
                  <span className="node-label">{evt.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
