import React, { useState, useEffect } from 'react';

type NavbarProps = {
  activeSection: number;
};

export const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { n: '01', label: 'Decision Room', href: '#decision-room' },
    { n: '02', label: 'Career Twin', href: '#career' },
    { n: '03', label: 'Notice → Action', href: '#notice' },
    { n: '04', label: 'Verify', href: '#verify' },
  ];

  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="topbar-inner">
        <a href="#hero" className="brand">
          <svg viewBox="0 0 42 42" aria-hidden="true">
            <circle cx="8" cy="21" r="4" />
            <path d="M12 21C18 21 17 10 25 10M12 21C18 21 17 32 25 32M25 10C30 10 30 21 35 21M25 32C30 32 30 21 35 21" />
            <circle cx="35" cy="21" r="3" />
          </svg>
          <span><b>DECISION</b>TWIN</span>
        </a>

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          {navItems.map((item, idx) => {
            const isActive = activeSection === idx + 1;
            return (
              <a
                key={item.n}
                className={`nav-link ${isActive ? 'is-active' : ''}`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-num">{item.n}</span>
                <span className="nav-text">{item.label}</span>
                {isActive && <span className="nav-indicator" />}
              </a>
            );
          })}
        </nav>

        <div className="top-status">
          <span className="live-dot" />
          <span className="status-text">AWS · CAUSAL ENGINE</span>
          <b className="section-counter">0{activeSection} / 04</b>
        </div>

        <button
          className="mobile-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`bar ${menuOpen ? 'open-1' : ''}`} />
          <span className={`bar ${menuOpen ? 'open-2' : ''}`} />
        </button>
      </div>
    </header>
  );
};
