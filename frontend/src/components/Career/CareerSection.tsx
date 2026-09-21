import React, { useState } from 'react';
import type { Risk } from '../../types/decisiontwin';

export const CareerSection: React.FC = () => {
  const [salary, setSalary] = useState(120000);
  const [remoteDays, setRemoteDays] = useState(3);
  const [workHours, setWorkHours] = useState(42);
  const [learningDensity, setLearningDensity] = useState(8);
  const [relocate, setRelocate] = useState(false);
  const [horizon, setHorizon] = useState<'NOW' | '2 YEARS' | '5 YEARS'>('NOW');

  // Compute Career Twin system values
  const multiplier = horizon === '5 YEARS' ? 2.5 : horizon === '2 YEARS' ? 1.6 : 1.0;
  const netSavings = Math.round(
    (salary * 0.44 - (5 - remoteDays) * 3400) * multiplier
  );
  const commuteHours = Number(((5 - remoteDays) * 1.2).toFixed(1));
  const freeHours = Math.max(
    8,
    Math.round((168 - workHours - commuteHours * 5 - 56) * (relocate ? 0.85 : 1.0))
  );
  const skillScore = Math.round(
    (learningDensity * 8.5 + (workHours > 44 ? 16 : 6)) * (horizon === '5 YEARS' ? 2.2 : horizon === '2 YEARS' ? 1.4 : 1.0)
  );
  const burnoutRisk: Risk =
    workHours >= 52 || commuteHours >= 6.5 ? 'HIGH' : workHours >= 44 ? 'MEDIUM' : 'LOW';

  return (
    <section id="career" className="chapter chapter-career">
      <div className="section-head split-head">
        <div>
          <span className="overline-tag">02 • DECISIONTWIN CAREER</span>
          <h2>
            WHAT IF I <em>TAKE THIS PATH?</em>
          </h2>
          <p className="section-lede">
            Turn a career choice into a visible system: money, time, learning, mobility and burnout risk all move together.
          </p>
        </div>
      </div>

      <div className="career-stage">
        {/* Photo Card */}
        <div className="career-photo-card glass-panel">
          <img
            src="/assets/decisiontwin-career.jpg"
            alt="Human context visual for career twin"
            className="career-img"
          />
          <div className="photo-note">
            <span>HUMAN CONTEXT</span>
            <b>EVERY DECISION HAS A BODY</b>
          </div>
        </div>

        {/* Controls Deck */}
        <div className="career-controls glass-panel">
          <div className="deck-title">BUILD YOUR PATH</div>

          <div className="career-control-item">
            <div className="ctrl-head">
              <span>Salary</span>
              <b>${salary.toLocaleString()} / yr</b>
            </div>
            <input
              type="range"
              min={50000}
              max={250000}
              step={5000}
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
            />
          </div>

          <div className="career-control-item">
            <div className="ctrl-head">
              <span>Remote Days</span>
              <b>{remoteDays} days / wk</b>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              value={remoteDays}
              onChange={(e) => setRemoteDays(Number(e.target.value))}
            />
          </div>

          <div className="career-control-item">
            <div className="ctrl-head">
              <span>Work Hours</span>
              <b>{workHours} hrs / wk</b>
            </div>
            <input
              type="range"
              min={32}
              max={60}
              value={workHours}
              onChange={(e) => setWorkHours(Number(e.target.value))}
            />
          </div>

          <div className="career-control-item">
            <div className="ctrl-head">
              <span>Learning Density</span>
              <b>{learningDensity} / 10</b>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={learningDensity}
              onChange={(e) => setLearningDensity(Number(e.target.value))}
            />
          </div>

          <label className="toggle-row">
            <span>Relocate for Role</span>
            <input
              type="checkbox"
              checked={relocate}
              onChange={(e) => setRelocate(e.target.checked)}
            />
            <i className="toggle-slider" />
          </label>

          <div className="horizon-picker">
            <span className="picker-label">TIME HORIZON:</span>
            {(['NOW', '2 YEARS', '5 YEARS'] as const).map((h) => (
              <button
                key={h}
                className={`horizon-btn ${horizon === h ? 'active' : ''}`}
                onClick={() => setHorizon(h)}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Output & Path Node Visualizer */}
        <div className="career-output glass-panel">
          <div className="path-flow font-mono">
            <span className="path-node active">JOB</span>
            <i className="arrow">→</i>
            <span className="path-node">MONEY</span>
            <i className="arrow">→</i>
            <span className="path-node">TIME</span>
            <i className="arrow">→</i>
            <span className="path-node">SKILL</span>
            <i className="arrow">→</i>
            <span className="path-node">FUTURE</span>
          </div>

          <div className="career-metrics-grid">
            <div className="metric-box positive">
              <span>Net Savings</span>
              <strong>${Math.max(0, netSavings).toLocaleString()}</strong>
              <small>{horizon} projection</small>
            </div>

            <div className="metric-box neutral">
              <span>Free Hours</span>
              <strong>{freeHours} hrs / wk</strong>
              <small>After work & commute</small>
            </div>

            <div className="metric-box positive">
              <span>Skill Compounding</span>
              <strong>{skillScore} pts</strong>
              <small>Learning density index</small>
            </div>

            <div className={`metric-box risk-${burnoutRisk.toLowerCase()}`}>
              <span>Burnout Risk</span>
              <strong>{burnoutRisk} RISK</strong>
              <small>{workHours} hrs + {commuteHours}h commute</small>
            </div>
          </div>

          <div className="career-interpretation">
            <span className="interp-label">LIVE SYSTEM INTERPRETATION:</span>
            <p className="interp-text">
              {burnoutRisk === 'HIGH'
                ? 'This path trades personal time for income faster than it compounds learning. Consider increasing remote flexibility.'
                : burnoutRisk === 'MEDIUM'
                ? 'This path maintains a balanced trade-off between income, free time and growth potential.'
                : 'This path leaves optimal operating headroom for time, personal well-being, and skill compounding.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
