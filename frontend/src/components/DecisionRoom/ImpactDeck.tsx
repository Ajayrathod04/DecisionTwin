import React from 'react';
import type { SimulationResult, ExtendedParams } from '../../types/decisiontwin';

type ImpactDeckProps = {
  result: SimulationResult;
  params: ExtendedParams;
  onExplain: () => void;
  explainLoading: boolean;
  whyOpen: boolean;
};

export const ImpactDeck: React.FC<ImpactDeckProps> = ({
  result,
  params,
  onExplain,
  explainLoading,
  whyOpen,
}) => {
  const isDelayHigh = result.delay_days > params.lead_time;
  const isUtilHigh = result.utilization > 1;

  const costTotal = Math.round(result.cost * (params.cost_per_unit / 500));
  const serviceComputed = Math.max(
    50,
    Math.min(99, Math.round(100 - (result.utilization > 1 ? (result.utilization - 1) * 80 : 0) - params.logistics_delay * 2))
  );

  return (
    <aside className="impact-deck glass-panel">
      <div className="deck-head">
        <span className="deck-tag">DYNAMIC IMPACT</span>
        <h4>SYSTEM CONSEQUENCES</h4>
      </div>

      <div className="metrics-grid">
        <div className={`metric-card ${isDelayHigh ? 'negative' : 'neutral'}`}>
          <span className="metric-label">System Delay</span>
          <strong className="metric-val">{result.delay_days.toFixed(1)} d</strong>
          <small className="metric-sub">
            {isDelayHigh ? `+${(result.delay_days - params.lead_time).toFixed(1)} d queue` : 'On schedule'}
          </small>
        </div>

        <div className={`metric-card ${isUtilHigh ? 'negative' : 'positive'}`}>
          <span className="metric-label">Utilization</span>
          <strong className="metric-val">{Math.round(result.utilization * 100)}%</strong>
          <small className="metric-sub">{isUtilHigh ? 'Over capacity' : 'Safe headroom'}</small>
        </div>

        <div className="metric-card neutral">
          <span className="metric-label">Projected Cost</span>
          <strong className="metric-val">${Math.round(costTotal / 1000)}k</strong>
          <small className="metric-sub">Unit ${params.cost_per_unit}</small>
        </div>

        <div className="metric-card positive">
          <span className="metric-label">Projected Stock</span>
          <strong className="metric-val">{Math.round(result.projected_inventory)} u</strong>
          <small className="metric-sub">Safety buffer {params.safety_stock}u</small>
        </div>

        <div className="metric-card neutral">
          <span className="metric-label">Service Level</span>
          <strong className="metric-val">{serviceComputed}%</strong>
          <small className="metric-sub">Target {params.service_level}%</small>
        </div>

        <div className={`metric-card ${result.risk === 'HIGH' ? 'negative' : result.risk === 'MEDIUM' ? 'warning' : 'positive'}`}>
          <span className="metric-label">System Risk</span>
          <strong className="metric-val">{result.risk}</strong>
          <small className="metric-sub">Disruption {params.disruption_risk}%</small>
        </div>
      </div>

      <button className="btn btn-solid trace-btn btn-magnetic" onClick={onExplain}>
        {explainLoading ? 'READING TRACE…' : whyOpen ? 'CLOSE TRACE' : 'WHY DID THIS HAPPEN?'} <span>↗</span>
      </button>
    </aside>
  );
};
