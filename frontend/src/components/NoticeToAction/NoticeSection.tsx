import React, { useState } from 'react';
import { RadialEventCatalog } from './RadialEventCatalog';
import type { ExtendedParams } from '../../types/decisiontwin';

type NoticeSectionProps = {
  onSelectEventParams: (params: Partial<ExtendedParams>) => void;
};

export const NoticeSection: React.FC<NoticeSectionProps> = ({ onSelectEventParams }) => {
  const [noticeText, setNoticeText] = useState(
    'All senior degree candidates must submit final project documentation, a repository link and a 3-minute demo by October 15 at 11:59 PM. Late submissions incur a 15% grade deduction per day.'
  );
  const [noticeChecks, setNoticeChecks] = useState([true, false, false]);
  const [sampleKind, setSampleKind] = useState('ASSESSMENT NOTICE');
  const [radialOpen, setRadialOpen] = useState(false);

  const loadNoticeSample = (kind: string) => {
    setSampleKind(kind);
    setNoticeChecks([true, false, false]);
    if (kind === 'HOSTEL NOTICE') {
      setNoticeText(
        'Hostel room allocation opens October 25. Upload clearance receipts and complete biometric re-verification by October 20. Unregistered rooms move to the waitlist.'
      );
    } else if (kind === 'PLACEMENT NOTICE') {
      setNoticeText(
        'Campus placement for Core Systems Engineering starts November 1. Eligible candidates need CPI ≥ 7.5, zero active backlogs and a signed NOC before October 28.'
      );
    } else {
      setNoticeText(
        'All senior degree candidates must submit final project documentation, a repository link and a 3-minute demo by October 15 at 11:59 PM. Late submissions incur a 15% grade deduction per day.'
      );
    }
  };

  const completedCount = noticeChecks.filter(Boolean).length;

  return (
    <section id="notice" className="chapter chapter-notice">
      <div className="section-head split-head">
        <div>
          <span className="overline-tag">03 • NOTICE → ACTION</span>
          <h2>
            TURN A NOTICE <em>INTO SOMETHING YOU CAN DO.</em>
          </h2>
          <p className="section-lede">
            Drag the official paper. Edit the text source. Check off the requirements. The system transforms unstructured text into an active task queue.
          </p>
        </div>

        <div className="notice-head-actions">
          <button
            className="btn btn-solid explore-events-btn btn-magnetic"
            onClick={() => setRadialOpen(true)}
          >
            EXPLORE EVENTS <span>↗</span>
          </button>
        </div>
      </div>

      <div className="notice-samples-bar">
        <span>SAMPLE NOTICES:</span>
        {['ASSESSMENT NOTICE', 'HOSTEL NOTICE', 'PLACEMENT NOTICE'].map((kind) => (
          <button
            key={kind}
            className={`sample-btn ${sampleKind === kind ? 'active' : ''}`}
            onClick={() => loadNoticeSample(kind)}
          >
            {kind}
          </button>
        ))}
      </div>

      <div className="paper-workspace">
        {/* Draggable Paper Card */}
        <div className="paper-card glass-panel" draggable>
          <div className="paper-top font-mono">
            <span>OFFICIAL NOTICE SOURCE • 03</span>
            <b>DRAG ↗</b>
          </div>

          <textarea
            className="paper-textarea"
            value={noticeText}
            onChange={(e) => setNoticeText(e.target.value)}
            aria-label="Notice raw content"
          />

          <div className="paper-stamp">
            <b>DECISIONTWIN</b>
            <small>NOTICE TRANSFORMER</small>
          </div>
          <div className="paper-tape" />
        </div>

        {/* Action Queue Card */}
        <div className="action-queue-card glass-panel">
          <div className="queue-head">
            <span className="queue-title">ACTION QUEUE</span>
            <b className="queue-progress font-mono">
              {completedCount}/3 COMPLETE
            </b>
          </div>

          <div className="queue-list">
            {[
              'Read source notice carefully',
              'Confirm every requirement & eligibility',
              'Put submission deadline on calendar',
            ].map((task, i) => {
              const done = noticeChecks[i];
              return (
                <button
                  key={task}
                  className={`task-row ${done ? 'is-done' : ''}`}
                  onClick={() =>
                    setNoticeChecks((c) => c.map((v, j) => (j === i ? !v : v)))
                  }
                >
                  <i className="task-checkbox">{done ? '✓' : `0${i + 1}`}</i>
                  <span className="task-text">{task}</span>
                  <small className="task-state">{done ? 'DONE' : 'OPEN'}</small>
                </button>
              );
            })}
          </div>

          <div className="progress-bar-wrap">
            <div
              className="progress-fill"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <RadialEventCatalog
        isOpen={radialOpen}
        onClose={() => setRadialOpen(false)}
        onSelectEvent={onSelectEventParams}
      />
    </section>
  );
};
