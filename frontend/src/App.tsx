import { useCallback, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './App.css'

const API_BASE = 'http://decisiontwin-api.eba-pzpi4y9c.ap-south-1.elasticbeanstalk.com'

type CausalStep = {
  step: number
  label: string
  trend: 'UP' | 'DOWN' | 'EQUAL' | 'ALERT'
  symbol: string
  value: string
  detail: string
}

type CounterfactualOption = {
  id: string
  title: string
  action: string
  target_field: 'capacity' | 'demand' | 'inventory' | 'lead_time'
  recommended_value: number
  delta: number
  impact_summary: string
  projected_risk: 'LOW' | 'MEDIUM' | 'HIGH'
  projected_utilization: number
  projected_delay_days: number
  projected_cost: number
}

type MetricDelta = {
  name: string
  previous: string
  current: string
  delta: string
  direction: 'INCREASE' | 'DECREASE' | 'UNCHANGED' | 'SHIFT'
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
}

type StateChange = {
  has_previous: boolean
  summary: string
  deltas: MetricDelta[]
}

type SimulationResult = {
  demand: number
  inventory: number
  capacity: number
  lead_time: number
  utilization: number
  projected_inventory: number
  delay_days: number
  cost: number
  risk: string
  bottleneck: string | null
  causal_chain: CausalStep[]
  causal_summary: string
  counterfactuals: CounterfactualOption[]
  state_change: StateChange
}

type ScenarioSlot = 'A' | 'B' | 'C'

type ScenarioSnapshot = {
  slot: ScenarioSlot
  name: string
  demand: number
  inventory: number
  capacity: number
  lead_time: number
  result: SimulationResult
  savedAt: string
}

type MetricComparisonRow = {
  name: string
  unit: string
  val_a: string | null
  val_b: string | null
  val_c: string | null
  diff_b_vs_a: string | null
  diff_c_vs_a: string | null
}

type FuturesComparisonResult = {
  active_slots: string[]
  summary: string
  rows: MetricComparisonRow[]
}

type EvidenceTraceItem = {
  metric_name: string
  exact_value: string
  source_component: string
  description: string
}

type DecisionExplanation = {
  provider_used: string
  is_ai_generated: boolean
  what_happened: string
  why_it_happened: string
  primary_driver: string
  important_consequence: string
  relevant_trade_off: string
  deterministic_facts: string[]
  evidence_trace: EvidenceTraceItem[]
}

type DecisionNodeProps = {
  title: string
  value: string
  detail?: string
  status?: string
  nodeType?: 'input' | 'dependency' | 'output'
  riskLevel?: string
  isHighlighted?: boolean
  onWhyClick?: () => void
  showWhyButton?: boolean
}

function DecisionNode({
  title,
  value,
  detail,
  status,
  nodeType = 'dependency',
  riskLevel,
  isHighlighted,
  onWhyClick,
  showWhyButton,
}: DecisionNodeProps) {
  const typeClass = `node-${nodeType}`
  const riskClass = riskLevel ? `risk-${riskLevel.toLowerCase()}` : ''

  return (
    <div className={`decision-node ${typeClass} ${riskClass} ${isHighlighted ? 'highlighted-node' : ''}`}>
      <Handle type="target" position={Position.Left} className="custom-handle" />
      <div className="node-header-row">
        <span className="node-kicker">{status ?? 'MODEL'}</span>
        {showWhyButton && (
          <button
            className="node-why-btn"
            onClick={onWhyClick}
            title="Trace causal breakdown"
            aria-label="Trace causal breakdown"
          >
            Trace Why
          </button>
        )}
      </div>
      <div className="node-title">{title}</div>
      <div className="node-value">{value}</div>
      {detail && <div className="node-detail">{detail}</div>}
      <Handle type="source" position={Position.Right} className="custom-handle" />
    </div>
  )
}

const initialResult: SimulationResult = {
  demand: 100,
  inventory: 60,
  capacity: 100,
  lead_time: 7,
  utilization: 1,
  projected_inventory: 60,
  delay_days: 7,
  cost: 62000,
  risk: 'MEDIUM',
  bottleneck: null,
  causal_chain: [
    {
      step: 1,
      label: 'Demand Level',
      trend: 'EQUAL',
      symbol: '=',
      value: '100 units',
      detail: 'Requested demand of 100 units vs 100 units capacity limit.',
    },
    {
      step: 2,
      label: 'Capacity Status',
      trend: 'EQUAL',
      symbol: '=',
      value: 'At Limit',
      detail: 'Capacity is sufficient to process incoming demand.',
    },
    {
      step: 3,
      label: 'Utilization',
      trend: 'EQUAL',
      symbol: '=',
      value: '100%',
      detail: 'System operating at healthy 100% utilization.',
    },
    {
      step: 4,
      label: 'Inventory Pressure',
      trend: 'EQUAL',
      symbol: '=',
      value: '60 units',
      detail: 'Inventory buffer preserved at 60 units.',
    },
    {
      step: 5,
      label: 'Delay Impact',
      trend: 'EQUAL',
      symbol: '=',
      value: '7.0 days',
      detail: 'Fulfillment timeline remains at standard 7 day lead time.',
    },
    {
      step: 6,
      label: 'Risk Level',
      trend: 'UP',
      symbol: '↑',
      value: 'MEDIUM RISK',
      detail: 'MEDIUM risk due to 100% capacity threshold.',
    },
  ],
  causal_summary:
    'Demand of 100 units matches available capacity (100 units), resulting in 100% utilization with 0 unit buffer and MEDIUM risk.',
  counterfactuals: [
    {
      id: 'opt_capacity',
      title: 'Expand Operating Capacity',
      action: 'Increase Capacity to 120 units',
      target_field: 'capacity',
      recommended_value: 120,
      delta: 20,
      impact_summary:
        'Increase capacity by 20 units to reduce utilization from 100% to 83% and clear bottleneck risk.',
      projected_risk: 'LOW',
      projected_utilization: 0.8333,
      projected_delay_days: 7,
      projected_cost: 50000,
    },
    {
      id: 'opt_demand',
      title: 'Cap Input Demand',
      action: 'Adjust Demand to 95 units',
      target_field: 'demand',
      recommended_value: 95,
      delta: -5,
      impact_summary: 'Cap demand at 95 units to bring utilization down to 95% and achieve LOW risk.',
      projected_risk: 'LOW',
      projected_utilization: 0.95,
      projected_delay_days: 7,
      projected_cost: 47500,
    },
  ],
  state_change: {
    has_previous: false,
    summary: 'Baseline simulation established. Adjust decision sliders and re-run to compare state changes.',
    deltas: [],
  },
}

function App() {
  const [demand, setDemand] = useState(100)
  const [inventory, setInventory] = useState(60)
  const [capacity, setCapacity] = useState(100)
  const [leadTime, setLeadTime] = useState(7)
  const [result, setResult] = useState<SimulationResult>(initialResult)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [justSimulated, setJustSimulated] = useState(false)

  const [activeTab, setActiveTab] = useState<'none' | 'why' | 'whatif' | 'whatchanged' | 'scenarios' | 'futures' | 'explanation'>('none')

  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  const [scenarios, setScenarios] = useState<Record<ScenarioSlot, ScenarioSnapshot | null>>({
    A: null,
    B: null,
    C: null,
  })
  const [activeScenario, setActiveScenario] = useState<ScenarioSlot | null>(null)
  const [futuresComparison, setFuturesComparison] = useState<FuturesComparisonResult | null>(null)

  async function simulate() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demand,
          inventory,
          capacity,
          lead_time: leadTime,
          previous_state: result,
        }),
      })

      if (!response.ok) {
        throw new Error(`Simulation failed (${response.status})`)
      }

      const data = (await response.json()) as SimulationResult
      setResult(data)
      setExplanation(null)
      setJustSimulated(true)
      setTimeout(() => setJustSimulated(false), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the simulation engine API.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCompareFutures(activeScenarios: Record<ScenarioSlot, ScenarioSnapshot | null>) {
    try {
      const response = await fetch(`${API_BASE}/compare-futures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeScenarios),
      })

      if (!response.ok) return

      const data = (await response.json()) as FuturesComparisonResult
      setFuturesComparison(data)
    } catch {
      // Fail gracefully
    }
  }

  const fetchExplanation = useCallback(async () => {
    setLoadingExplanation(true)
    try {
      const response = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: {
            demand,
            inventory,
            capacity,
            lead_time: leadTime,
          },
          result,
          scenarios,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate explanation')
      const data = (await response.json()) as DecisionExplanation
      setExplanation(data)
    } catch {
      // Graceful fallback handled backend-side
    } finally {
      setLoadingExplanation(false)
    }
  }, [capacity, demand, inventory, leadTime, result, scenarios])

  const toggleTab = useCallback(
    (tab: 'why' | 'whatif' | 'whatchanged' | 'scenarios' | 'futures' | 'explanation') => {
      if (activeTab === tab) {
        setActiveTab('none')
      } else {
        setActiveTab(tab)
        if (tab === 'futures') {
          void fetchCompareFutures(scenarios)
        } else if (tab === 'explanation' && !explanation) {
          void fetchExplanation()
        }
      }
    },
    [activeTab, explanation, fetchExplanation, scenarios]
  )

  function applyRecommendation(opt: CounterfactualOption) {
    if (opt.target_field === 'capacity') setCapacity(opt.recommended_value)
    else if (opt.target_field === 'demand') setDemand(opt.recommended_value)
    else if (opt.target_field === 'inventory') setInventory(opt.recommended_value)
    else if (opt.target_field === 'lead_time') setLeadTime(opt.recommended_value)
  }

  function saveScenario(slot: ScenarioSlot) {
    const defaultNames: Record<ScenarioSlot, string> = {
      A: 'BASELINE',
      B: 'HIGH DEMAND',
      C: 'LOW CAPACITY',
    }
    const newSnapshot: ScenarioSnapshot = {
      slot,
      name: defaultNames[slot],
      demand,
      inventory,
      capacity,
      lead_time: leadTime,
      result,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = { ...scenarios, [slot]: newSnapshot }
    setScenarios(updated)
    setActiveScenario(slot)
    void fetchCompareFutures(updated)
  }

  function loadScenario(slot: ScenarioSlot) {
    const sc = scenarios[slot]
    if (!sc) return
    setDemand(sc.demand)
    setInventory(sc.inventory)
    setCapacity(sc.capacity)
    setLeadTime(sc.lead_time)
    setResult(sc.result)
    setActiveScenario(slot)
  }

  function clearScenario(slot: ScenarioSlot) {
    const updated = { ...scenarios, [slot]: null }
    setScenarios(updated)
    if (activeScenario === slot) {
      setActiveScenario(null)
    }
    void fetchCompareFutures(updated)
  }

  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'input',
        type: 'decision',
        position: { x: 40, y: 160 },
        data: {
          title: 'Input Demand',
          value: `${demand} units`,
          detail: `${leadTime} day lead time`,
          status: 'INPUT',
          nodeType: 'input',
          isHighlighted: activeTab === 'why',
        },
      },
      {
        id: 'capacity',
        type: 'decision',
        position: { x: 340, y: 60 },
        data: {
          title: 'Operating Capacity',
          value: `${capacity} units`,
          detail: `${Math.round(result.utilization * 100)}% utilization`,
          status: 'DEPENDENCY',
          nodeType: 'dependency',
          isHighlighted: activeTab === 'why',
        },
      },
      {
        id: 'inventory',
        type: 'decision',
        position: { x: 340, y: 270 },
        data: {
          title: 'Inventory Buffer',
          value: `${inventory} units`,
          detail: `${result.projected_inventory} units projected`,
          status: 'DEPENDENCY',
          nodeType: 'dependency',
          isHighlighted: activeTab === 'why',
        },
      },
      {
        id: 'consequence',
        type: 'decision',
        position: { x: 670, y: 160 },
        data: {
          title: 'System Consequence',
          value: `${result.delay_days} days`,
          detail: `${result.risk} Risk • $${result.cost.toLocaleString()}`,
          status: 'OUTPUT',
          nodeType: 'output',
          riskLevel: result.risk,
          isHighlighted: activeTab === 'why',
          showWhyButton: true,
          onWhyClick: () => toggleTab('why'),
        },
      },
    ],
    [demand, inventory, capacity, leadTime, result, activeTab, toggleTab]
  )

  const edges = useMemo<Edge[]>(
    () => [
      {
        id: 'e-input-capacity',
        source: 'input',
        target: 'capacity',
        animated: justSimulated,
        style: { stroke: '#38bdf8', strokeWidth: 1.5 },
      },
      {
        id: 'e-input-inventory',
        source: 'input',
        target: 'inventory',
        animated: justSimulated,
        style: { stroke: '#38bdf8', strokeWidth: 1.5 },
      },
      {
        id: 'e-capacity-consequence',
        source: 'capacity',
        target: 'consequence',
        animated: justSimulated,
        style: {
          stroke: result.risk === 'HIGH' ? '#f85149' : result.risk === 'MEDIUM' ? '#d29922' : '#2ea043',
          strokeWidth: 1.5,
        },
      },
      {
        id: 'e-inventory-consequence',
        source: 'inventory',
        target: 'consequence',
        animated: justSimulated,
        style: {
          stroke: result.risk === 'HIGH' ? '#f85149' : result.risk === 'MEDIUM' ? '#d29922' : '#2ea043',
          strokeWidth: 1.5,
        },
      },
    ],
    [result.risk, justSimulated]
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">DECISIONTWIN / DECISION SIMULATION ENGINE</div>
          <h1>See the consequences before you commit.</h1>
          <p className="subtitle">
            A deterministic decision simulation instrument for modeling operational dependencies and risk propagation.
          </p>
        </div>
        <div className="status-pill" aria-label="AWS Elastic Beanstalk Live API Status">
          <span className="live-dot" />
          <span>AWS • LIVE API</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel" aria-label="Decision Controls Console">
          <div className="section-label">DECISION INPUTS</div>

          <div className="control-item">
            <div className="control-heading">
              <span>Demand</span>
              <div className="control-val-group">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setDemand((prev) => Math.max(20, prev - 5))}
                  aria-label="Decrease demand"
                >
                  -
                </button>
                <strong>{demand} units</strong>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setDemand((prev) => Math.min(200, prev + 5))}
                  aria-label="Increase demand"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={demand}
              aria-label="Demand slider"
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${((demand - 20) / 180) * 100}%, #21262d ${((demand - 20) / 180) * 100}%, #21262d 100%)`,
              }}
              onChange={(event) => setDemand(Number(event.target.value))}
            />
          </div>

          <div className="control-item">
            <div className="control-heading">
              <span>Inventory</span>
              <div className="control-val-group">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setInventory((prev) => Math.max(0, prev - 5))}
                  aria-label="Decrease inventory"
                >
                  -
                </button>
                <strong>{inventory} units</strong>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setInventory((prev) => Math.min(200, prev + 5))}
                  aria-label="Increase inventory"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={inventory}
              aria-label="Inventory slider"
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${(inventory / 200) * 100}%, #21262d ${(inventory / 200) * 100}%, #21262d 100%)`,
              }}
              onChange={(event) => setInventory(Number(event.target.value))}
            />
          </div>

          <div className="control-item">
            <div className="control-heading">
              <span>Capacity</span>
              <div className="control-val-group">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setCapacity((prev) => Math.max(20, prev - 5))}
                  aria-label="Decrease capacity"
                >
                  -
                </button>
                <strong>{capacity} units</strong>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setCapacity((prev) => Math.min(200, prev + 5))}
                  aria-label="Increase capacity"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={capacity}
              aria-label="Capacity slider"
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${((capacity - 20) / 180) * 100}%, #21262d ${((capacity - 20) / 180) * 100}%, #21262d 100%)`,
              }}
              onChange={(event) => setCapacity(Number(event.target.value))}
            />
          </div>

          <div className="control-item">
            <div className="control-heading">
              <span>Lead time</span>
              <div className="control-val-group">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setLeadTime((prev) => Math.max(1, prev - 1))}
                  aria-label="Decrease lead time"
                >
                  -
                </button>
                <strong>{leadTime} days</strong>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setLeadTime((prev) => Math.min(30, prev + 1))}
                  aria-label="Increase lead time"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={leadTime}
              aria-label="Lead time slider"
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${((leadTime - 1) / 29) * 100}%, #21262d ${((leadTime - 1) / 29) * 100}%, #21262d 100%)`,
              }}
              onChange={(event) => setLeadTime(Number(event.target.value))}
            />
          </div>

          <button
            className="simulate-button"
            onClick={simulate}
            disabled={loading}
            aria-label="Run simulation"
          >
            {loading ? 'Simulating...' : 'Run simulation'}
          </button>

          {error && (
            <div className="error-inline" role="alert">
              <span>⚠️ {error}</span>
              <button className="error-retry" onClick={simulate}>Retry</button>
            </div>
          )}

          <div className="quick-scenarios">
            <div className="section-label">SAVE SCENARIOS</div>
            <div className="slot-tabs">
              {(['A', 'B', 'C'] as ScenarioSlot[]).map((slot) => {
                const sc = scenarios[slot]
                const isActive = activeScenario === slot
                return (
                  <button
                    key={slot}
                    className={`slot-tab ${sc ? 'has-data' : ''} ${isActive ? 'is-active' : ''}`}
                    onClick={() => saveScenario(slot)}
                    title={sc ? `Saved at ${sc.savedAt}` : `Save current state as Scenario ${slot}`}
                    aria-label={`Save scenario ${slot}`}
                  >
                    Slot {slot} {sc ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="console-footer">
            <span>DETERMINISTIC SIMULATION</span>
            <p>Propagation, causal traces, & futures computed directly by backend engine.</p>
          </div>
        </aside>

        <section className="graph-room">
          <div className="graph-topbar">
            <div className="graph-title-block">
              <span className="section-label">CAUSAL SYSTEM MAP</span>
              <h2>Decision Room</h2>
            </div>

            {/* Restrained Tab Bar Controls */}
            <div className="analysis-tabs" role="tablist">
              <button
                className={`tab-item ${activeTab === 'why' ? 'active' : ''}`}
                onClick={() => toggleTab('why')}
                role="tab"
                aria-selected={activeTab === 'why'}
              >
                WHY? Trace
              </button>
              <button
                className={`tab-item ${activeTab === 'whatif' ? 'active' : ''}`}
                onClick={() => toggleTab('whatif')}
                role="tab"
                aria-selected={activeTab === 'whatif'}
              >
                Counterfactuals
              </button>
              <button
                className={`tab-item ${activeTab === 'whatchanged' ? 'active' : ''}`}
                onClick={() => toggleTab('whatchanged')}
                role="tab"
                aria-selected={activeTab === 'whatchanged'}
              >
                What Changed
              </button>
              <button
                className={`tab-item ${activeTab === 'scenarios' ? 'active' : ''}`}
                onClick={() => toggleTab('scenarios')}
                role="tab"
                aria-selected={activeTab === 'scenarios'}
              >
                Scenarios
              </button>
              <button
                className={`tab-item ${activeTab === 'futures' ? 'active' : ''}`}
                onClick={() => toggleTab('futures')}
                role="tab"
                aria-selected={activeTab === 'futures'}
              >
                Compare Futures
              </button>
              <button
                className={`tab-item ${activeTab === 'explanation' ? 'active' : ''}`}
                onClick={() => toggleTab('explanation')}
                role="tab"
                aria-selected={activeTab === 'explanation'}
              >
                Context Explanation
              </button>
            </div>

            <div className={`risk-tag risk-${result.risk.toLowerCase()}`}>
              {result.risk} RISK
            </div>
          </div>

          <div className={`graph-container ${justSimulated ? 'state-pulse' : ''}`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={{
                decision: ({ data }) => (
                  <DecisionNode
                    title={String(data.title)}
                    value={String(data.value)}
                    detail={String(data.detail)}
                    status={String(data.status)}
                    nodeType={data.nodeType as 'input' | 'dependency' | 'output' | undefined}
                    riskLevel={data.riskLevel as string | undefined}
                    isHighlighted={Boolean(data.isHighlighted)}
                    showWhyButton={Boolean(data.showWhyButton)}
                    onWhyClick={data.onWhyClick as (() => void) | undefined}
                  />
                ),
              }}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background color="#21262d" gap={24} size={1} />
              <MiniMap style={{ background: '#0d1117' }} nodeColor="#30363d" />
              <Controls />
            </ReactFlow>
          </div>

          <div className="metric-strip">
            <div className="metric-item">
              <span className="metric-lbl">PROJECTED INVENTORY</span>
              <strong className="metric-val">{result.projected_inventory} units</strong>
            </div>
            <div className="metric-item">
              <span className="metric-lbl">UTILIZATION</span>
              <strong className="metric-val">{Math.round(result.utilization * 100)}%</strong>
            </div>
            <div className="metric-item">
              <span className="metric-lbl">QUEUE DELAY</span>
              <strong className="metric-val">{result.delay_days} days</strong>
            </div>
            <div className="metric-item">
              <span className="metric-lbl">ESTIMATED COST</span>
              <strong className="metric-val">${result.cost.toLocaleString()}</strong>
            </div>
            <div className="metric-item">
              <span className="metric-lbl">BOTTLENECK</span>
              <strong className={`metric-val ${result.bottleneck ? 'is-bottleneck' : ''}`}>
                {result.bottleneck ? result.bottleneck.toUpperCase() : 'NONE'}
              </strong>
            </div>
          </div>

          {/* Analysis Panels visually integrated below graph */}
          {activeTab === 'why' && (
            <div className="analysis-panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">CAUSAL BREAKDOWN</span>
                  <h3>Why did this outcome occur?</h3>
                </div>
                <button className="panel-close-btn" onClick={() => setActiveTab('none')}>✕ Close</button>
              </div>

              <div className="narrative-block">
                <span className="block-label">ENGINE SUMMARY</span>
                <p>{result.causal_summary}</p>
              </div>

              <div className="causal-steps-list">
                {result.causal_chain.map((step) => (
                  <div key={step.step} className={`step-row trend-${step.trend.toLowerCase()}`}>
                    <span className="step-num">0{step.step}</span>
                    <span className="step-lbl">{step.label}</span>
                    <span className="step-val">{step.value}</span>
                    <span className="step-desc">{step.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'whatif' && (
            <div className="analysis-panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">COUNTERFACTUAL OPTIONS</span>
                  <h3>What if you made a different decision?</h3>
                </div>
                <button className="panel-close-btn" onClick={() => setActiveTab('none')}>✕ Close</button>
              </div>

              <div className="options-grid">
                {result.counterfactuals.map((opt) => (
                  <div key={opt.id} className="option-card">
                    <div className="option-top">
                      <strong className="option-title">{opt.title}</strong>
                      <span className={`risk-tag risk-${opt.projected_risk.toLowerCase()}`}>
                        {opt.projected_risk} RISK
                      </span>
                    </div>

                    <div className="option-action">{opt.action}</div>
                    <p className="option-desc">{opt.impact_summary}</p>

                    <div className="option-metrics">
                      <div>
                        <span>UTILIZATION</span>
                        <strong>{Math.round(opt.projected_utilization * 100)}%</strong>
                      </div>
                      <div>
                        <span>DELAY</span>
                        <strong>{opt.projected_delay_days}d</strong>
                      </div>
                      <div>
                        <span>COST</span>
                        <strong>${opt.projected_cost.toLocaleString()}</strong>
                      </div>
                    </div>

                    {opt.delta !== 0 && (
                      <button
                        className="apply-btn"
                        onClick={() => applyRecommendation(opt)}
                      >
                        Apply Choice ({opt.delta > 0 ? `+${opt.delta}` : opt.delta})
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'whatchanged' && (
            <div className="analysis-panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">STATE CHANGE COMPARISON</span>
                  <h3>What changed since the last simulation?</h3>
                </div>
                <button className="panel-close-btn" onClick={() => setActiveTab('none')}>✕ Close</button>
              </div>

              {!result.state_change.has_previous ? (
                <div className="panel-empty-state">
                  <p>Baseline simulation established. Modify inputs and run simulation again to compare deltas.</p>
                </div>
              ) : (
                <>
                  <div className="narrative-block">
                    <span className="block-label">STATE DELTAS</span>
                    <p>{result.state_change.summary}</p>
                  </div>

                  <div className="deltas-list">
                    {result.state_change.deltas.map((d) => (
                      <div key={d.name} className="delta-row">
                        <span className="d-name">{d.name}</span>
                        <span className="d-prev">{d.previous}</span>
                        <span className="d-arrow">→</span>
                        <span className="d-curr">{d.current}</span>
                        <span className={`d-diff ${d.direction.toLowerCase()}`}>{d.delta}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="analysis-panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">SAVED FUTURE SCENARIOS</span>
                  <h3>Scenario Management (A / B / C)</h3>
                </div>
                <button className="panel-close-btn" onClick={() => setActiveTab('none')}>✕ Close</button>
              </div>

              <div className="scenarios-compact-list">
                {(['A', 'B', 'C'] as ScenarioSlot[]).map((slot) => {
                  const sc = scenarios[slot]
                  const isActive = activeScenario === slot
                  return (
                    <div key={slot} className={`scenario-row ${isActive ? 'is-active' : ''}`}>
                      <div className="sc-info">
                        <strong>SLOT {slot}</strong>
                        <span>{sc ? sc.name : 'EMPTY'}</span>
                      </div>
                      {sc ? (
                        <div className="sc-metrics">
                          <span>Demand: {sc.demand}</span>
                          <span>Cap: {sc.capacity}</span>
                          <span>Delay: {sc.result.delay_days}d</span>
                          <span>Cost: ${sc.result.cost.toLocaleString()}</span>
                          <span className={`risk-tag risk-${sc.result.risk.toLowerCase()}`}>{sc.result.risk}</span>
                        </div>
                      ) : (
                        <span className="sc-empty-lbl">No state saved in Slot {slot}</span>
                      )}
                      <div className="sc-actions">
                        {sc ? (
                          <>
                            <button className="sc-btn" onClick={() => loadScenario(slot)}>Load</button>
                            <button className="sc-btn" onClick={() => saveScenario(slot)}>Overwrite</button>
                            <button className="sc-btn sc-del" onClick={() => clearScenario(slot)}>Clear</button>
                          </>
                        ) : (
                          <button className="sc-btn" onClick={() => saveScenario(slot)}>Save Current</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'futures' && (
            <div className="analysis-panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">FACTUAL TRADEOFF MATRIX</span>
                  <h3>Side-by-Side Future Comparison</h3>
                </div>
                <button className="panel-close-btn" onClick={() => setActiveTab('none')}>✕ Close</button>
              </div>

              {!futuresComparison || futuresComparison.active_slots.length < 2 ? (
                <div className="panel-empty-state">
                  <p>Save at least 2 scenarios (e.g. Slot A and Slot B) using the control console to compare trade-offs side-by-side.</p>
                </div>
              ) : (
                <>
                  <div className="narrative-block">
                    <span className="block-label">TRADEOFF SUMMARY</span>
                    <p>{futuresComparison.summary}</p>
                  </div>

                  <div className="matrix-table-wrapper">
                    <table className="matrix-table">
                      <thead>
                        <tr>
                          <th>METRIC</th>
                          <th>SCENARIO A</th>
                          <th>SCENARIO B</th>
                          <th>SCENARIO C</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futuresComparison.rows.map((row) => (
                          <tr key={row.name}>
                            <td className="m-name">{row.name}</td>
                            <td>{row.val_a ?? '-'}</td>
                            <td>
                              {row.val_b ?? '-'}
                              {row.diff_b_vs_a && row.diff_b_vs_a !== '-' && row.diff_b_vs_a !== '=' && (
                                <span className="m-diff">{row.diff_b_vs_a}</span>
                              )}
                            </td>
                            <td>
                              {row.val_c ?? '-'}
                              {row.diff_c_vs_a && row.diff_c_vs_a !== '-' && row.diff_c_vs_a !== '=' && (
                                <span className="m-diff">{row.diff_c_vs_a}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'explanation' && (
            <div className="analysis-panel">
              <div className="panel-header">
                <div>
                  <span className="section-label">SYSTEM CONTEXT EXPLANATION</span>
                  <h3>Deterministic Decision Explanation</h3>
                </div>
                <button className="panel-close-btn" onClick={() => setActiveTab('none')}>✕ Close</button>
              </div>

              {loadingExplanation ? (
                <div className="panel-loading">Synthesizing engine context...</div>
              ) : explanation ? (
                <div className="explanation-layout">
                  <div className="causal-hierarchy">
                    <div className="c-section">
                      <span className="c-label">WHAT CHANGED / WHAT HAPPENED</span>
                      <p>{explanation.what_happened}</p>
                    </div>

                    <div className="c-section">
                      <span className="c-label">WHY IT CHANGED</span>
                      <p>{explanation.why_it_happened}</p>
                    </div>

                    <div className="c-section">
                      <span className="c-label">PRIMARY SYSTEM DRIVER</span>
                      <p>{explanation.primary_driver}</p>
                    </div>

                    <div className="c-section">
                      <span className="c-label">DOWNSTREAM EFFECTS & CONSEQUENCES</span>
                      <p>{explanation.important_consequence}</p>
                    </div>

                    <div className="c-section">
                      <span className="c-label">RELEVANT TRADE-OFF</span>
                      <p>{explanation.relevant_trade_off}</p>
                    </div>
                  </div>

                  <div className="facts-box">
                    <span className="block-label">ENGINE IMMUTABLE FACTS</span>
                    <ul>
                      {explanation.deterministic_facts.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
