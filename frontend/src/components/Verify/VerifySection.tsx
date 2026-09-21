import React, { useState } from 'react';
import type { GuideDoc } from '../../types/decisiontwin';

const guideDocs: GuideDoc[] = [
  {
    id: 'decision',
    title: '01 — DecisionTwin Room',
    keywords: ['decision', 'capacity', 'demand', 'inventory', 'cost', 'delay', 'operations', 'supply', 'business', 'tradeoff', 'risk'],
    answer: 'Use DecisionTwin when one controllable assumption can propagate through dependent variables and you need to see the consequence before acting.',
    action: 'Open the live Decision Room.',
    href: '#decision-room',
  },
  {
    id: 'career',
    title: '02 — DecisionTwin Career',
    keywords: ['job', 'career', 'salary', 'remote', 'hours', 'commute', 'skills', 'learning', 'relocation', 'growth', 'burnout'],
    answer: 'Use Career Twin when comparing a job or career path across money, time, learning, mobility and risk.',
    action: 'Explore the career path simulator.',
    href: '#career',
  },
  {
    id: 'notice',
    title: '03 — Notice → Action',
    keywords: ['notice', 'college', 'deadline', 'document', 'exam', 'hostel', 'placement', 'requirement', 'submission', 'task'],
    answer: 'Use Notice → Action when an important notice contains requirements, dates and actions that are easy to miss.',
    action: 'Open the notice transformer.',
    href: '#notice',
  },
  {
    id: 'verify',
    title: '04 — Opportunity Verification',
    keywords: ['internship', 'hackathon', 'job', 'opportunity', 'scam', 'verify', 'verification', 'eligibility', 'source', 'company'],
    answer: 'Use Opportunity Verification when you need to inspect an opportunity and separate supplied claims from evidence checks.',
    action: 'Open the verification workspace.',
    href: '#verify',
  },
];

export const VerifySection: React.FC = () => {
  const [opp, setOpp] = useState({
    name: 'Senior AI Systems Intern',
    org: 'Global Cybernetic Labs',
    deadline: '30 Oct 2026',
    eligibility: 'ECE / CS degree students',
    url: 'https://example.org/opportunity',
  });
  const [verified, setVerified] = useState(false);

  const [routerInput, setRouterInput] = useState('');
  const [routerResult, setRouterResult] = useState<GuideDoc | null>(null);

  const runRouter = () => {
    const query = routerInput.toLowerCase();
    const best = guideDocs
      .map((d) => ({
        ...d,
        score: d.keywords.reduce((s, k) => s + (query.includes(k) ? 2 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score)[0];

    setRouterResult(best.score > 0 ? best : guideDocs[0]);
  };

  return (
    <section id="verify" className="chapter chapter-verify">
      <div className="section-head">
        <span className="overline-tag">04 • OPPORTUNITY VERIFICATION & ROUTER</span>
        <h2>
          DON'T TRUST. <em>VERIFY.</em>
        </h2>
        <p className="section-lede">
          Paste what you received. Separate identity, deadline, eligibility and claims. The interface makes uncertainty visible instead of hiding it behind a verdict.
        </p>
      </div>

      <div className="verify-grid">
        {/* Verification Form */}
        <div className="verify-form glass-panel">
          <div className="deck-title">OPPORTUNITY INPUT</div>

          <label className="input-label">
            <span>ROLE TITLE</span>
            <input
              value={opp.name}
              onChange={(e) => setOpp({ ...opp, name: e.target.value })}
            />
          </label>

          <label className="input-label">
            <span>ORGANIZATION</span>
            <input
              value={opp.org}
              onChange={(e) => setOpp({ ...opp, org: e.target.value })}
            />
          </label>

          <label className="input-label">
            <span>DEADLINE</span>
            <input
              value={opp.deadline}
              onChange={(e) => setOpp({ ...opp, deadline: e.target.value })}
            />
          </label>

          <label className="input-label">
            <span>ELIGIBILITY</span>
            <input
              value={opp.eligibility}
              onChange={(e) => setOpp({ ...opp, eligibility: e.target.value })}
            />
          </label>

          <label className="input-label">
            <span>SOURCE URL</span>
            <input
              value={opp.url}
              onChange={(e) => setOpp({ ...opp, url: e.target.value })}
            />
          </label>

          <button
            className="btn btn-solid simulate-btn btn-magnetic"
            onClick={() => setVerified(true)}
          >
            {verified ? 'RE-RUN EVIDENCE CHECKS' : 'RUN EVIDENCE CHECKS'} <span>↗</span>
          </button>
        </div>

        {/* Evidence Trail Stack */}
        <div className="evidence-field glass-panel">
          <div className="evidence-head">
            <span>EVIDENCE TRAIL STACK</span>
            <b className="status-tag font-mono">
              {verified ? 'CHECK COMPLETE' : 'WAITING FOR INPUT'}
            </b>
          </div>

          <div className="evidence-stack">
            <article className={`evidence-card ${verified ? 'checked' : ''}`}>
              <span className="card-num">01</span>
              <div>
                <b>ORGANIZATION IDENTITY</b>
                <p>Organization and role parameters captured from supplied input.</p>
              </div>
              <strong className="check-state">{verified ? 'VERIFIED' : 'PENDING'}</strong>
            </article>

            <article className={`evidence-card ${verified ? 'checked' : ''}`}>
              <span className="card-num">02</span>
              <div>
                <b>DEADLINE CONSISTENCY</b>
                <p>Compare stated date against authoritative source timetable.</p>
              </div>
              <strong className="check-state">{verified ? 'VERIFIED' : 'PENDING'}</strong>
            </article>

            <article className={`evidence-card ${verified ? 'checked' : ''}`}>
              <span className="card-num">03</span>
              <div>
                <b>ELIGIBILITY MATCH</b>
                <p>Inspect degree criteria and backlog conditions before submitting.</p>
              </div>
              <strong className="check-state">{verified ? 'VERIFIED' : 'PENDING'}</strong>
            </article>

            <article className={`evidence-card ${verified ? 'checked' : ''}`}>
              <span className="card-num">04</span>
              <div>
                <b>CLAIMS & CREDENTIALS</b>
                <p>Mark claims as verified, unverified or requiring secondary check.</p>
              </div>
              <strong className="check-state">{verified ? 'VERIFIED' : 'PENDING'}</strong>
            </article>
          </div>

          <div className={`verification-result ${verified ? 'is-shown' : ''}`}>
            <span className="res-tag">
              {verified ? 'EVIDENCE-LED RESULT' : 'READY'}
            </span>
            <p className="res-msg">
              {verified
                ? 'Review the complete evidence trail before treating the opportunity as verified.'
                : 'Add opportunity parameters and run evidence checks.'}
            </p>
          </div>
        </div>
      </div>

      {/* Problem Router Section */}
      <div className="problem-router-wrap glass-panel">
        <div className="router-copy">
          <span className="overline-tag">LOCAL KNOWLEDGE ROUTER</span>
          <h3>DON'T KNOW WHERE TO START?</h3>
          <p>
            Describe your problem in plain language. The deterministic guide matches your query to the closest DecisionTwin workflow.
          </p>
        </div>

        <div className="router-input-box">
          <div className="input-row">
            <input
              value={routerInput}
              onChange={(e) => setRouterInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runRouter();
              }}
              placeholder="e.g. 'I am comparing two job offers' or 'I missed a deadline'..."
            />
            <button className="btn btn-solid btn-magnetic" onClick={runRouter}>
              ROUTE PROBLEM ↗
            </button>
          </div>

          {routerResult && (
            <div className="router-result-card">
              <span className="res-badge">{routerResult.title}</span>
              <p className="res-answer">{routerResult.answer}</p>
              <a href={routerResult.href} className="res-action">
                {routerResult.action} ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
