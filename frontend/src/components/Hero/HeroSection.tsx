import React, { useEffect, useRef } from 'react';
import { DragDeck } from './DragDeck';
import { gsap } from '../../lib/animations';

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-eyebrow', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from('.hero-title-line', {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power4.out',
        delay: 0.2,
      });

      gsap.from('.hero-lede', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.6,
      });

      gsap.from('.hero-actions', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.8,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={heroRef} className="hero-section">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="badge-tag">01</span>
            <span>SIMULATE • UNDERSTAND • DECIDE • ACT</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">SEE WHAT</span>
            <span className="hero-title-line highlight-text">HAPPENS</span>
            <span className="hero-title-line">BEFORE YOU</span>
            <span className="hero-title-line">COMMIT.</span>
          </h1>

          <p className="hero-lede">
            Change one assumption. Watch the entire system react in real time — then inspect the deterministic causal chain that made it happen.
          </p>

          <div className="hero-actions">
            <a href="#live-room" className="btn btn-solid btn-magnetic">
              ENTER DECISION ROOM <span>↓</span>
            </a>
            <a href="#sticky-showcase" className="btn btn-ghost btn-magnetic">
              WATCH OVERVIEW <span>↘</span>
            </a>
          </div>

          <div className="hero-proof">
            <span>DETERMINISTIC ENGINE</span>
            <span className="dot">•</span>
            <span>LIVE AWS API</span>
            <span className="dot">•</span>
            <span>3D CAUSAL TRACE</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card">
            <div className="hero-image-wrap">
              <img
                src="/assets/decisiontwin-hero.jpg"
                alt="DecisionTwin logistics and decision system visual"
                className="hero-img"
              />
              <div className="hero-img-overlay" />
              <div className="image-caption">
                SYSTEM IN MOTION • PHYSICAL WORLD CAUSAL LAYER
              </div>
            </div>

            <div className="hero-signal-badge">
              <span>ONE INPUT</span>
              <b className="arrow">→</b>
              <span>MANY CONSEQUENCES</span>
            </div>

            <DragDeck />
          </div>
        </div>
      </div>

      <div className="story-strip">
        <div className="strip-item">
          <span className="strip-label">THE PRINCIPLE</span>
          <b className="strip-text">One variable should never feel isolated.</b>
        </div>
        <div className="strip-arrow">↓</div>
        <div className="strip-item">
          <span className="strip-label">THE INTERACTION</span>
          <b className="strip-text">Move it. Simulate it. Trace the 3D chain.</b>
        </div>
      </div>
    </section>
  );
};
