import React, { useState } from 'react';
import type { GuideDoc } from '../../types/decisiontwin';

const guideDocs: GuideDoc[] = [
  {
    id: 'decision',
    title: '01 — DecisionTwin Room',
    keywords: ['decision', 'capacity', 'demand', 'inventory', 'cost', 'delay', 'operations', 'supply'],
    answer: 'Use DecisionTwin when one controllable assumption can propagate through dependent variables and you need to see the consequence before acting.',
    action: 'Open live Decision Room',
    href: '#decision-room',
  },
  {
    id: 'career',
    title: '02 — DecisionTwin Career',
    keywords: ['job', 'career', 'salary', 'remote', 'hours', 'commute', 'learning', 'relocation'],
    answer: 'Use Career Twin when comparing a job or career path across money, time, learning, mobility and risk.',
    action: 'Explore Career Twin',
    href: '#career',
  },
  {
    id: 'notice',
    title: '03 — Notice → Action',
    keywords: ['notice', 'college', 'deadline', 'document', 'exam', 'hostel', 'placement', 'submission'],
    answer: 'Use Notice → Action when an important notice contains requirements, dates and actions that are easy to miss.',
    action: 'Open Notice Transformer',
    href: '#notice',
  },
  {
    id: 'verify',
    title: '04 — Opportunity Verification',
    keywords: ['internship', 'hackathon', 'job', 'opportunity', 'scam', 'verify', 'verification', 'eligibility'],
    answer: 'Use Opportunity Verification when you need to inspect an opportunity and separate claims from evidence.',
    action: 'Open Verification Workspace',
    href: '#verify',
  },
];

export const GuideModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState<GuideDoc | null>(null);

  const handleAsk = () => {
    const q = inputVal.toLowerCase();
    const best = guideDocs
      .map((d) => ({
        ...d,
        score: d.keywords.reduce((s, k) => s + (q.includes(k) ? 2 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score)[0];
    setResult(best.score > 0 ? best : guideDocs[0]);
  };

  return (
    <>
      <button
        className="guide-fab btn-magnetic"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open DecisionTwin Guide System"
      >
        <span className="fab-icon">✦</span>
        <span className="fab-text">ASK THE SYSTEM</span>
      </button>

      {isOpen && (
        <div className="guide-pop glass-panel">
          <div className="guide-pop-head">
            <div className="brand-mini">
              <span><b>DECISION</b>TWIN GUIDE</span>
            </div>
            <button className="close-pop-btn" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <p className="pop-desc">
            Describe your problem in plain text. I will route you to the appropriate workflow.
          </p>

          <div className="pop-input-row">
            <input
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAsk();
              }}
              placeholder="e.g. should I accept this internship?"
            />
            <button className="pop-submit-btn" onClick={handleAsk}>
              ↗
            </button>
          </div>

          {result && (
            <div className="pop-result-box">
              <span className="res-title">{result.title}</span>
              <p className="res-text">{result.answer}</p>
              <a
                href={result.href}
                className="res-link"
                onClick={() => setIsOpen(false)}
              >
                {result.action} ↗
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
};
