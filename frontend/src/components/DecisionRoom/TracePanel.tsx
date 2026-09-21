import React from 'react';
import type { SimulationResult, Explanation } from '../../types/decisiontwin';

type TracePanelProps = {
  result: SimulationResult;
  explanation: Explanation | null;
  onClose: () => void;
};

export const TracePanel: React.FC<TracePanelProps> = ({ result, explanation, onClose }) => {
  return (
    <div className="trace-panel glass-panel">
      <div className="trace-head">
        <div>
          <span className="overline-tag">CAUSAL TRACE</span>
          <h3>Nothing moved without a reason.</h3>
          <p className="trace-lede">
            {explanation?.what_happened || result.causal_summary}
          </p>
        </div>
        <button className="close-trace-btn" onClick={onClose} aria-label="Close causal trace panel">
          ×
        </button>
      </div>

      <div className="trace-chain-grid">
        {result.causal_chain.map((step) => (
          <div key={step.step} className={`trace-step-card trend-${step.trend.toLowerCase()}`}>
            <div className="step-header">
              <span className="step-num">0{step.step}</span>
              <span className="step-symbol">{step.symbol}</span>
            </div>
            <b className="step-label">{step.label}</b>
            <strong className="step-val">{step.value}</strong>
            <p className="step-detail">{step.detail}</p>
          </div>
        ))}
      </div>

      {explanation && (
        <div className="explanation-grid">
          <div className="exp-card">
            <span className="exp-label">PRIMARY DRIVER</span>
            <b className="exp-val">{explanation.primary_driver}</b>
          </div>
          <div className="exp-card">
            <span className="exp-label">KEY CONSEQUENCE</span>
            <b className="exp-val">{explanation.important_consequence}</b>
          </div>
          <div className="exp-card">
            <span className="exp-label">TRADE-OFF</span>
            <b className="exp-val">{explanation.relevant_trade_off}</b>
          </div>
        </div>
      )}
    </div>
  );
};
