import React from 'react';
import type { SimulationResult } from '../../types/decisiontwin';

type FallbackProps = {
  result: SimulationResult;
  activeStep: number;
  onWhy: () => void;
};

export const CausalGraphFallback: React.FC<FallbackProps> = ({ result, activeStep, onWhy }) => {
  const riskColor =
    result.risk === 'HIGH' ? '#ff5d5d' : result.risk === 'MEDIUM' ? '#f4b860' : '#6ee7a7';

  const nodes = [
    { id: 'demand', x: 12, y: 30, label: 'INPUT', title: 'Demand', value: `${result.demand} u` },
    { id: 'inventory', x: 12, y: 70, label: 'INPUT', title: 'Inventory', value: `${result.projected_inventory} u` },
    { id: 'capacity', x: 45, y: 20, label: 'NODE', title: 'Capacity', value: `${result.capacity} u` },
    { id: 'production', x: 45, y: 50, label: 'CORE', title: 'Production', value: `${Math.round(result.utilization * 100)}%` },
    { id: 'logistics', x: 45, y: 80, label: 'NODE', title: 'Logistics', value: `${result.lead_time} d` },
    { id: 'cost', x: 80, y: 35, label: 'IMPACT', title: 'Cost', value: `$${Math.round(result.cost / 1000)}k` },
    { id: 'service', x: 80, y: 68, label: 'CONSEQUENCE', title: 'Service', value: `${result.delay_days.toFixed(1)} d (${result.risk})` },
  ];

  return (
    <div className="causal-graph-2d-fallback">
      <svg className="graph-lines-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className={activeStep >= 1 ? 'pulse-line' : ''} d="M 20 30 Q 32 25 45 20" />
        <path className={activeStep >= 1 ? 'pulse-line' : ''} d="M 20 30 Q 32 40 45 50" />
        <path className={activeStep >= 1 ? 'pulse-line' : ''} d="M 20 70 Q 32 75 45 80" />
        <path className={activeStep >= 2 ? 'pulse-line' : ''} d="M 45 20 Q 62 25 80 35" style={{ stroke: riskColor }} />
        <path className={activeStep >= 2 ? 'pulse-line' : ''} d="M 45 50 Q 62 60 80 68" style={{ stroke: riskColor }} />
        <path className={activeStep >= 2 ? 'pulse-line' : ''} d="M 45 80 Q 62 74 80 68" style={{ stroke: riskColor }} />
      </svg>

      {nodes.map((n) => (
        <div key={n.id} className="fallback-node" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="node-tag">{n.label}</span>
          <b className="node-name">{n.title}</b>
          <strong className="node-val">{n.value}</strong>
        </div>
      ))}

      <div className="fallback-actions">
        <button className="btn-trace" onClick={onWhy}>
          TRACE 3D CAUSAL CHAIN ↗
        </button>
      </div>
    </div>
  );
};
