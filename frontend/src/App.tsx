import { useState, useEffect } from 'react';
import type { ExtendedParams } from './types/decisiontwin';
import { useLenis } from './hooks/useLenis';

import { Navbar } from './components/Navigation/Navbar';
import { HeroSection } from './components/Hero/HeroSection';
import { DecisionRoomSection } from './components/DecisionRoom/DecisionRoomSection';
import { StickyShowcaseSection } from './components/StickyShowcase/StickyShowcaseSection';
import { NoticeSection } from './components/NoticeToAction/NoticeSection';
import { CareerSection } from './components/Career/CareerSection';
import { VerifySection } from './components/Verify/VerifySection';
import { GuideModal } from './components/Guide/GuideModal';

import './App.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(1);
  const [activePreset, setActivePreset] = useState<Partial<ExtendedParams> | null>(null);

  // Initialize Lenis Smooth Scroll
  useLenis();

  // Initial Preloader
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for Active Section Tracking
  useEffect(() => {
    const sectionEls = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id === 'hero' || id === 'decision-room' || id === 'sticky-showcase') {
              setActiveSection(1);
            } else if (id === 'career') {
              setActiveSection(2);
            } else if (id === 'notice') {
              setActiveSection(3);
            } else if (id === 'verify') {
              setActiveSection(4);
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSelectPreset = (preset: Partial<ExtendedParams>) => {
    setActivePreset(preset);
  };

  return (
    <div className="site-shell">
      {/* Preloader */}
      {loading && (
        <div className="preloader">
          <div className="preloader-core">
            <div className="brand brand-compact">
              <svg viewBox="0 0 42 42" aria-hidden="true">
                <circle cx="8" cy="21" r="4" />
                <path d="M12 21C18 21 17 10 25 10M12 21C18 21 17 32 25 32M25 10C30 10 30 21 35 21M25 32C30 32 30 21 35 21" />
                <circle cx="35" cy="21" r="3" />
              </svg>
              <span><b>DECISION</b>TWIN</span>
            </div>
            <div className="preloader-word">CALIBRATING 3D CAUSAL FIELD</div>
            <div className="loader-line">
              <i />
            </div>
            <small className="font-mono">INITIALIZING ENGINE • AWS AP-SOUTH-1</small>
          </div>
        </div>
      )}

      {/* Main Top Navbar */}
      <Navbar activeSection={activeSection} />

      {/* Left Scroll Rail */}
      <aside className="rail font-mono">
        <span>SCROLL TO EXPLORE SYSTEM</span>
        <i className="rail-line" />
      </aside>

      {/* Page Sections */}
      <main className="main-content">
        <HeroSection />

        <DecisionRoomSection presetParams={activePreset} />

        <StickyShowcaseSection onSelectScenario={handleSelectPreset} />

        <NoticeSection onSelectEventParams={handleSelectPreset} />

        <CareerSection />

        <VerifySection />
      </main>

      {/* Footer */}
      <footer className="footer-bar">
        <div className="footer-inner">
          <div className="brand">
            <svg viewBox="0 0 42 42" aria-hidden="true">
              <circle cx="8" cy="21" r="4" />
              <path d="M12 21C18 21 17 10 25 10M12 21C18 21 17 32 25 32M25 10C30 10 30 21 35 21M25 32C30 32 30 21 35 21" />
              <circle cx="35" cy="21" r="3" />
            </svg>
            <span><b>DECISION</b>TWIN</span>
          </div>

          <div className="footer-message">
            <span>CHANGE ONE DECISION.</span>
            <b>SEE WHAT FOLLOWS IN 3D.</b>
          </div>

          <div className="footer-meta font-mono">
            DECISIONTWIN • AWS ELASTIC BEANSTALK • AP-SOUTH-1
            <br />
            Built as a production-grade deterministic decision system.
          </div>
        </div>
      </footer>

      {/* Floating System Guide Modal */}
      <GuideModal />
    </div>
  );
}
