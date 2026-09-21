import React, { useState } from 'react';
import type { ExtendedParams, ScenarioSlot } from '../../types/decisiontwin';

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (val: number) => void;
};

function RangeControl({ label, value, min, max, step = 1, unit, onChange }: RangeControlProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-control">
      <div className="range-head">
        <span className="control-label">{label}</span>
        <b className="control-value">
          {value}
          <small>{unit}</small>
        </b>
      </div>
      <div className="range-track-wrap">
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--range-pct': `${pct}%` } as React.CSSProperties}
        />
        <div className="range-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type ControlPanelProps = {
  params: ExtendedParams;
  onChangeParam: (key: keyof ExtendedParams, val: number) => void;
  onSimulate: () => void;
  onReset: () => void;
  onLoadStressCase: () => void;
  onSaveScenario: (slot: ScenarioSlot) => void;
  simulating: boolean;
  error?: string;
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChangeParam,
  onSimulate,
  onReset,
  onLoadStressCase,
  onSaveScenario,
  simulating,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'system' | 'ops' | 'all'>('primary');

  return (
    <aside className="control-panel glass-panel">
      <div className="panel-head">
        <div className="panel-title">
          <span className="panel-tag">LAB CONTROLS</span>
          <h3>PARAMETRIC INPUTS</h3>
        </div>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'primary' ? 'active' : ''}`}
            onClick={() => setActiveTab('primary')}
          >
            CORE (4)
          </button>
          <button
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            SYSTEM (5)
          </button>
          <button
            className={`tab-btn ${activeTab === 'ops' ? 'active' : ''}`}
            onClick={() => setActiveTab('ops')}
          >
            OPS (5)
          </button>
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            ALL (14)
          </button>
        </div>
      </div>

      <div className="sliders-scroll">
        {activeTab === 'primary' && (
          <div className="slider-group">
            <RangeControl
              label="Demand"
              value={params.demand}
              min={20}
              max={200}
              step={5}
              unit=" units"
              onChange={(v) => onChangeParam('demand', v)}
            />
            <RangeControl
              label="Inventory"
              value={params.inventory}
              min={0}
              max={160}
              step={5}
              unit=" units"
              onChange={(v) => onChangeParam('inventory', v)}
            />
            <RangeControl
              label="Capacity"
              value={params.capacity}
              min={40}
              max={220}
              step={5}
              unit=" units"
              onChange={(v) => onChangeParam('capacity', v)}
            />
            <RangeControl
              label="Lead Time"
              value={params.lead_time}
              min={1}
              max={30}
              unit=" days"
              onChange={(v) => onChangeParam('lead_time', v)}
            />
          </div>
        )}

        {activeTab === 'system' && (
          <div className="slider-group">
            <RangeControl
              label="Cost per Unit"
              value={params.cost_per_unit}
              min={100}
              max={1000}
              step={20}
              unit=" $"
              onChange={(v) => onChangeParam('cost_per_unit', v)}
            />
            <RangeControl
              label="Service Level Target"
              value={params.service_level}
              min={50}
              max={99}
              unit=" %"
              onChange={(v) => onChangeParam('service_level', v)}
            />
            <RangeControl
              label="Market Growth Rate"
              value={params.market_growth}
              min={-20}
              max={60}
              unit=" %"
              onChange={(v) => onChangeParam('market_growth', v)}
            />
            <RangeControl
              label="Disruption Risk"
              value={params.disruption_risk}
              min={0}
              max={100}
              unit=" %"
              onChange={(v) => onChangeParam('disruption_risk', v)}
            />
            <RangeControl
              label="Forecast Confidence"
              value={params.forecast_confidence}
              min={30}
              max={99}
              unit=" %"
              onChange={(v) => onChangeParam('forecast_confidence', v)}
            />
          </div>
        )}

        {activeTab === 'ops' && (
          <div className="slider-group">
            <RangeControl
              label="Supplier Reliability"
              value={params.supplier_reliability}
              min={20}
              max={100}
              unit=" %"
              onChange={(v) => onChangeParam('supplier_reliability', v)}
            />
            <RangeControl
              label="Logistics Delay"
              value={params.logistics_delay}
              min={0}
              max={15}
              unit=" days"
              onChange={(v) => onChangeParam('logistics_delay', v)}
            />
            <RangeControl
              label="Workforce Capacity"
              value={params.workforce_capacity}
              min={40}
              max={100}
              unit=" %"
              onChange={(v) => onChangeParam('workforce_capacity', v)}
            />
            <RangeControl
              label="Energy Cost Index"
              value={params.energy_cost}
              min={50}
              max={250}
              unit=" idx"
              onChange={(v) => onChangeParam('energy_cost', v)}
            />
            <RangeControl
              label="Safety Stock Reserve"
              value={params.safety_stock}
              min={10}
              max={100}
              unit=" u"
              onChange={(v) => onChangeParam('safety_stock', v)}
            />
          </div>
        )}

        {activeTab === 'all' && (
          <div className="slider-group">
            <RangeControl label="Demand" value={params.demand} min={20} max={200} step={5} unit=" units" onChange={(v) => onChangeParam('demand', v)} />
            <RangeControl label="Inventory" value={params.inventory} min={0} max={160} step={5} unit=" units" onChange={(v) => onChangeParam('inventory', v)} />
            <RangeControl label="Capacity" value={params.capacity} min={40} max={220} step={5} unit=" units" onChange={(v) => onChangeParam('capacity', v)} />
            <RangeControl label="Lead Time" value={params.lead_time} min={1} max={30} unit=" days" onChange={(v) => onChangeParam('lead_time', v)} />
            <RangeControl label="Cost per Unit" value={params.cost_per_unit} min={100} max={1000} step={20} unit=" $" onChange={(v) => onChangeParam('cost_per_unit', v)} />
            <RangeControl label="Service Level Target" value={params.service_level} min={50} max={99} unit=" %" onChange={(v) => onChangeParam('service_level', v)} />
            <RangeControl label="Market Growth Rate" value={params.market_growth} min={-20} max={60} unit=" %" onChange={(v) => onChangeParam('market_growth', v)} />
            <RangeControl label="Disruption Risk" value={params.disruption_risk} min={0} max={100} unit=" %" onChange={(v) => onChangeParam('disruption_risk', v)} />
            <RangeControl label="Forecast Confidence" value={params.forecast_confidence} min={30} max={99} unit=" %" onChange={(v) => onChangeParam('forecast_confidence', v)} />
            <RangeControl label="Supplier Reliability" value={params.supplier_reliability} min={20} max={100} unit=" %" onChange={(v) => onChangeParam('supplier_reliability', v)} />
            <RangeControl label="Logistics Delay" value={params.logistics_delay} min={0} max={15} unit=" days" onChange={(v) => onChangeParam('logistics_delay', v)} />
            <RangeControl label="Workforce Capacity" value={params.workforce_capacity} min={40} max={100} unit=" %" onChange={(v) => onChangeParam('workforce_capacity', v)} />
            <RangeControl label="Energy Cost Index" value={params.energy_cost} min={50} max={250} unit=" idx" onChange={(v) => onChangeParam('energy_cost', v)} />
            <RangeControl label="Safety Stock Reserve" value={params.safety_stock} min={10} max={100} unit=" u" onChange={(v) => onChangeParam('safety_stock', v)} />
          </div>
        )}
      </div>

      {error && (
        <div className="error-note">
          <span>{error}</span>
          <small>UI fallback engine active.</small>
        </div>
      )}

      <div className="panel-actions">
        <button
          className="btn btn-solid simulate-btn btn-magnetic"
          onClick={onSimulate}
          disabled={simulating}
        >
          {simulating ? 'PROPAGATING…' : 'RUN SIMULATION'} <span>↗</span>
        </button>

        <div className="quick-actions-row">
          <button className="btn-sub" onClick={onReset}>
            RESET
          </button>
          <button className="btn-sub" onClick={onLoadStressCase}>
            STRESS CASE
          </button>
        </div>

        <div className="save-slots-row">
          <span className="slots-label">SAVE SCENARIO:</span>
          {(['A', 'B', 'C'] as ScenarioSlot[]).map((slot) => (
            <button
              key={slot}
              className="slot-btn"
              onClick={() => onSaveScenario(slot)}
              title={`Save current parameters to slot ${slot}`}
            >
              +{slot}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
