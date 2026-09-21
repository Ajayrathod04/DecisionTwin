import React, { useState, useEffect, useRef } from 'react';
import { SCENARIOS } from '../../data/scenarios';
import type { ExtendedParams } from '../../types/decisiontwin';
import { gsap, ScrollTrigger } from '../../lib/animations';

type StickyShowcaseProps = {
  onSelectScenario: (preset: Partial<ExtendedParams>) => void;
};

export const StickyShowcaseSection: React.FC<StickyShowcaseProps> = ({ onSelectScenario }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.showcase-step-card');
      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) {
              setActiveIdx(i);
            }
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const activeItem = SCENARIOS[activeIdx] || SCENARIOS[0];

  return (
    <section id="sticky-showcase" ref={containerRef} className="chapter chapter-sticky-showcase">
      <div className="section-head">
        <span className="overline-tag">STICKY STORYTELLING</span>
        <h2>
          SYSTEM SCENARIOS <em>IN MOTION</em>
        </h2>
        <p className="section-lede">
          Scroll through critical operational shocks. Watch the visual state stay pinned while parameters and causal consequences evolve.
        </p>
      </div>

      <div className="sticky-layout">
        {/* Pinned Left Visual Container */}
        <div className="sticky-visual-pin">
          <div className="pinned-card glass-panel">
            <div className="pinned-img-wrap">
              <img
                src={activeItem.image}
                alt={activeItem.title}
                className="pinned-img"
              />
              <div className="img-overlay-glow" />
              <div className="pinned-badge">
                <span className="badge-cat">{activeItem.category}</span>
                <span className={`risk-badge risk-${activeItem.riskLevel.toLowerCase()}`}>
                  {activeItem.riskLevel} RISK
                </span>
              </div>
            </div>

            <div className="pinned-meta">
              <div className="meta-head">
                <span className="meta-sub">{activeItem.subtitle}</span>
                <h3 className="meta-title">{activeItem.title}</h3>
              </div>
              <p className="meta-desc">{activeItem.impactSummary}</p>

              <div className="causal-chain-mini">
                <span className="mini-tag">CAUSAL IMPACT TRACE:</span>
                <div className="mini-chain-flow">
                  {activeItem.causalChain.map((c, idx) => (
                    <div key={idx} className="chain-node">
                      <b>{c.node}</b>
                      <span>{c.effect}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#decision-room"
                className="btn btn-solid run-scen-btn btn-magnetic"
                onClick={() => onSelectScenario(activeItem.preset)}
              >
                LOAD INTO DECISION ROOM <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Scrolling Cards Right Container */}
        <div className="sticky-cards-scroll">
          {SCENARIOS.map((item, idx) => {
            const isActive = idx === activeIdx;
            return (
              <article
                key={item.id}
                className={`showcase-step-card glass-panel ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveIdx(idx)}
              >
                <div className="step-num-badge">0{idx + 1}</div>
                <div className="card-content">
                  <span className="card-category">{item.category}</span>
                  <h4 className="card-title">{item.title}</h4>
                  <p className="card-desc">{item.description}</p>

                  <div className="preset-summary-grid">
                    {item.preset.demand && (
                      <div className="preset-item">
                        <span>Demand</span>
                        <b>{item.preset.demand} u</b>
                      </div>
                    )}
                    {item.preset.capacity && (
                      <div className="preset-item">
                        <span>Capacity</span>
                        <b>{item.preset.capacity} u</b>
                      </div>
                    )}
                    {item.preset.lead_time && (
                      <div className="preset-item">
                        <span>Lead Time</span>
                        <b>{item.preset.lead_time} d</b>
                      </div>
                    )}
                  </div>

                  <a
                    href="#decision-room"
                    className="card-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScenario(item.preset);
                    }}
                  >
                    SIMULATE THIS SCENARIO ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
