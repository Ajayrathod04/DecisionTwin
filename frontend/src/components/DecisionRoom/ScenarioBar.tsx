import React from 'react';
import type { ScenarioSlot, ScenarioSnapshot, FuturesComparison } from '../../types/decisiontwin';

type ScenarioBarProps = {
  scenarios: Record<ScenarioSlot, ScenarioSnapshot | null>;
  comparison: FuturesComparison | null;
  onLoadScenario: (slot: ScenarioSlot) => void;
  onSaveScenario: (slot: ScenarioSlot) => void;
  onCompare: () => void;
};

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  scenarios,
  comparison,
  onLoadScenario,
  onSaveScenario,
  onCompare,
}) => {
  return (
    <div className="scenario-container">
      <div className="scenario-bar glass-panel">
        <div className="scenario-intro">
          <span className="scen-tag">SCENARIO FUTURES</span>
          <b>Save states. Compare dynamic futures.</b>
        </div>

        <div className="slot-buttons-group">
          {(['A', 'B', 'C'] as ScenarioSlot[]).map((slot) => {
            const snap = scenarios[slot];
            return (
              <button
                key={slot}
                className={`slot-card ${snap ? 'is-saved' : ''}`}
                onClick={() => (snap ? onLoadScenario(slot) : onSaveScenario(slot))}
              >
                <span className="slot-badge">{slot}</span>
                <span className="slot-name">{snap ? snap.name : 'SAVE SCENARIO'}</span>
                {snap && <small className="slot-time">{snap.savedAt}</small>}
                <i className="slot-icon">{snap ? '↗' : '+'}</i>
              </button>
            );
          })}
        </div>

        <button className="btn btn-solid compare-btn btn-magnetic" onClick={onCompare}>
          COMPARE FUTURES ↗
        </button>
      </div>

      {comparison && (
        <div className="compare-table-wrap glass-panel">
          <div className="compare-summary">{comparison.summary}</div>
          <table className="compare-table">
            <thead>
              <tr>
                <th>METRIC</th>
                <th>SLOT A</th>
                <th>SLOT B</th>
                <th>SLOT C</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((r) => (
                <tr key={r.name}>
                  <td>
                    <b>{r.name}</b> <small>({r.unit})</small>
                  </td>
                  <td>{r.val_a ?? '—'}</td>
                  <td>{r.val_b ?? '—'}</td>
                  <td>{r.val_c ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
