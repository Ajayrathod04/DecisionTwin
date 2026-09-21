import React, { useState, useCallback } from 'react';
import type {
  SimulationResult,
  ExtendedParams,
  ScenarioSlot,
  ScenarioSnapshot,
  FuturesComparison,
  Explanation,
} from '../../types/decisiontwin';

import { ControlPanel } from './ControlPanel';
import { ImpactDeck } from './ImpactDeck';
import { TracePanel } from './TracePanel';
import { ScenarioBar } from './ScenarioBar';
import { CausalGraph3D } from '../CausalGraph3D/CausalGraph3D';

const API_BASE = 'http://decisiontwin-api.eba-pzpi4y9c.ap-south-1.elasticbeanstalk.com';

const initialParams: ExtendedParams = {
  demand: 100,
  inventory: 60,
  capacity: 100,
  lead_time: 7,
  cost_per_unit: 500,
  service_level: 95,
  market_growth: 10,
  disruption_risk: 25,
  supplier_reliability: 90,
  logistics_delay: 0,
  workforce_capacity: 100,
  energy_cost: 100,
  safety_stock: 30,
  forecast_confidence: 90,
};

const initialResult: SimulationResult = {
  demand: 100,
  inventory: 60,
  capacity: 100,
  lead_time: 7,
  utilization: 1.0,
  projected_inventory: 60,
  delay_days: 7,
  cost: 62000,
  risk: 'MEDIUM',
  bottleneck: null,
  causal_chain: [
    { step: 1, label: 'Demand Level', trend: 'EQUAL', symbol: '=', value: '100 units', detail: 'Demand matches current operational capacity baseline.' },
    { step: 2, label: 'Capacity Status', trend: 'EQUAL', symbol: '=', value: '100% Limit', detail: 'Capacity operates at limit with no spare headroom.' },
    { step: 3, label: 'Utilization', trend: 'EQUAL', symbol: '=', value: '100%', detail: 'System operating at threshold limit.' },
    { step: 4, label: 'Inventory Buffer', trend: 'EQUAL', symbol: '=', value: '60 units', detail: 'Inventory reserve preserved at baseline.' },
    { step: 5, label: 'Delay Impact', trend: 'EQUAL', symbol: '=', value: '7 days', detail: 'Base lead time remains unchanged.' },
    { step: 6, label: 'Risk Level', trend: 'UP', symbol: '↑', value: 'MEDIUM RISK', detail: 'Zero headroom leaves system vulnerable to unexpected order spikes.' },
  ],
  causal_summary: 'Demand matches capacity, operating at 100% utilization with MEDIUM system risk.',
  counterfactuals: [],
  state_change: { has_previous: false, summary: 'Baseline state', deltas: [] },
};

type DecisionRoomSectionProps = {
  presetParams?: Partial<ExtendedParams> | null;
};

export const DecisionRoomSection: React.FC<DecisionRoomSectionProps> = ({ presetParams }) => {
  const [params, setParams] = useState<ExtendedParams>(initialParams);
  const [result, setResult] = useState<SimulationResult>(initialResult);
  const [simulating, setSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [whyOpen, setWhyOpen] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [scenarios, setScenarios] = useState<Record<ScenarioSlot, ScenarioSnapshot | null>>({
    A: null,
    B: null,
    C: null,
  });
  const [comparison, setComparison] = useState<FuturesComparison | null>(null);

  // Sync external presets (e.g. from scenario selection or radial event click)
  React.useEffect(() => {
    if (presetParams) {
      setParams((prev) => {
        const next = { ...prev, ...presetParams };
        void runSimulation(next);
        return next;
      });
    }
  }, [presetParams]);

  const triggerPropagation = useCallback(() => {
    setActiveStep(1);
    setTimeout(() => setActiveStep(2), 200);
    setTimeout(() => setActiveStep(3), 400);
    setTimeout(() => setActiveStep(4), 700);
    setTimeout(() => setActiveStep(0), 1200);
  }, []);

  const runSimulation = useCallback(
    async (nextParams?: ExtendedParams) => {
      const p = nextParams || params;
      setSimulating(true);
      setError('');
      setExplanation(null);
      triggerPropagation();

      try {
        const res = await fetch(`${API_BASE}/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demand: p.demand,
            inventory: p.inventory,
            capacity: p.capacity,
            lead_time: p.lead_time,
            previous_state: result,
          }),
        });

        if (!res.ok) throw new Error(`Engine HTTP ${res.status}`);
        const data = (await res.json()) as SimulationResult;
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Backend engine offline.');
        // Fallback simulation calculation
        const util = p.demand / Math.max(p.capacity, 1);
        const riskLevel = util >= 1.25 ? 'HIGH' : util >= 1.0 ? 'MEDIUM' : 'LOW';
        const delay = p.lead_time + (Math.max(p.demand - p.capacity, 0) / p.capacity) * p.lead_time + p.logistics_delay;
        const projectedInv = Math.max(p.inventory - Math.max(p.demand - p.capacity, 0), 0);
        const costVal = p.demand * p.cost_per_unit + Math.max(p.demand - p.inventory, 0) * 300;

        setResult({
          ...result,
          demand: p.demand,
          inventory: p.inventory,
          capacity: p.capacity,
          lead_time: p.lead_time,
          utilization: util,
          delay_days: delay,
          cost: costVal,
          risk: riskLevel,
          projected_inventory: projectedInv,
          bottleneck: p.demand > p.capacity ? 'Capacity Deficit' : null,
          causal_summary: `Demand of ${p.demand}u against ${p.capacity}u capacity creates ${Math.round(util * 100)}% utilization and ${riskLevel} risk.`,
        });
      } finally {
        setSimulating(false);
      }
    },
    [params, result, triggerPropagation]
  );

  const handleParamChange = (key: keyof ExtendedParams, val: number) => {
    const next = { ...params, [key]: val };
    setParams(next);
    triggerPropagation();
  };

  const handleReset = () => {
    setParams(initialParams);
    void runSimulation(initialParams);
  };

  const handleLoadStressCase = () => {
    const stress: ExtendedParams = {
      ...params,
      demand: 145,
      capacity: 90,
      inventory: 35,
      lead_time: 14,
      disruption_risk: 75,
      supplier_reliability: 50,
      logistics_delay: 4,
    };
    setParams(stress);
    void runSimulation(stress);
  };

  const fetchExplanation = async () => {
    setExplainLoading(true);
    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: params, result, scenarios }),
      });
      if (!res.ok) throw new Error('Explanation endpoint error');
      setExplanation(await res.json());
      setWhyOpen(true);
    } catch {
      setWhyOpen(true);
    } finally {
      setExplainLoading(false);
    }
  };

  const saveScenario = (slot: ScenarioSlot) => {
    const nameMap = { A: 'BASELINE', B: 'HIGH DEMAND', C: 'LOW CAPACITY' };
    const now = new Date();
    const snap: ScenarioSnapshot = {
      id: `scen_${now.getTime()}_${slot.toLowerCase()}`,
      createdAt: now.toISOString(),
      sourceState: 'AWS_API',
      slot,
      name: nameMap[slot],
      demand: params.demand,
      inventory: params.inventory,
      capacity: params.capacity,
      lead_time: params.lead_time,
      result,
      savedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const nextScen = { ...scenarios, [slot]: snap };
    setScenarios(nextScen);
    void fetchComparison(nextScen);
  };

  const fetchComparison = async (scenObj: Record<ScenarioSlot, ScenarioSnapshot | null>) => {
    try {
      const res = await fetch(`${API_BASE}/compare-futures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenObj),
      });
      if (res.ok) setComparison(await res.json());
    } catch {
      /* Graceful fallback */
    }
  };

  const loadScenario = (slot: ScenarioSlot) => {
    const s = scenarios[slot];
    if (!s) return;
    const next: ExtendedParams = {
      ...params,
      demand: s.demand,
      inventory: s.inventory,
      capacity: s.capacity,
      lead_time: s.lead_time,
    };
    setParams(next);
    setResult(s.result);
    triggerPropagation();
  };

  return (
    <section id="decision-room" className="chapter chapter-decision-room">
      <div className="section-head">
        <div className="head-copy">
          <span className="overline-tag">01 • DECISION ROOM</span>
          <h2>
            THE CAUSAL <em>FIELD IS LIVE.</em>
          </h2>
        </div>
        <div className="live-status-badge">
          <span className="pulse-dot" />
          <span>AWS ELASTIC BEANSTALK • AP-SOUTH-1</span>
        </div>
      </div>

      <div className="room-grid">
        <ControlPanel
          params={params}
          onChangeParam={handleParamChange}
          onSimulate={() => void runSimulation()}
          onReset={handleReset}
          onLoadStressCase={handleLoadStressCase}
          onSaveScenario={saveScenario}
          simulating={simulating}
          error={error}
        />

        <div className="center-stage glass-panel">
          <div className="stage-head">
            <span className="stage-title">3D CAUSAL GRAPH</span>
            <b className="stage-step-tag">
              {simulating ? 'PROPAGATING...' : 'STABLE FIELD'} • STEP {activeStep || '—'}
            </b>
          </div>

          <CausalGraph3D
            result={result}
            activeStep={activeStep}
            onWhy={() => void fetchExplanation()}
          />
        </div>

        <ImpactDeck
          result={result}
          params={params}
          onExplain={() => void fetchExplanation()}
          explainLoading={explainLoading}
          whyOpen={whyOpen}
        />
      </div>

      {whyOpen && (
        <TracePanel
          result={result}
          explanation={explanation}
          onClose={() => setWhyOpen(false)}
        />
      )}

      <ScenarioBar
        scenarios={scenarios}
        comparison={comparison}
        onLoadScenario={loadScenario}
        onSaveScenario={saveScenario}
        onCompare={() => void fetchComparison(scenarios)}
      />
    </section>
  );
};
