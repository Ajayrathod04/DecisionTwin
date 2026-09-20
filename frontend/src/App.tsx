

import { useMemo, useState } from 'react'
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

type DecisionNodeProps = {
  title: string
  value: string
  detail?: string
  status?: string
  isHighlighted?: boolean
  onWhyClick?: () => void
  showWhyButton?: boolean
}

function DecisionNode({
  title,
  value,
  detail,
  status,
  isHighlighted,
  onWhyClick,
  showWhyButton,
}: DecisionNodeProps) {
  return (
    <div className={`decision-node ${isHighlighted ? 'highlighted-node' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-header-row">
        <div className="node-kicker">{status ?? 'MODEL'}</div>
        {showWhyButton && (
          <button className="node-why-btn" onClick={onWhyClick} title="Trace causal breakdown">
            ? WHY?
          </button>
        )}
      </div>
      <div className="node-title">{title}</div>
      <div className="node-value">{value}</div>
      {detail && <div className="node-detail">{detail}</div>}
      <Handle type="source" position={Position.Right} />
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
  const [showWhy, setShowWhy] = useState(false)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [showWhatChanged, setShowWhatChanged] = useState(false)
  const [showScenarios, setShowScenarios] = useState(false)
  const [showCompareFutures, setShowCompareFutures] = useState(false)

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
      const response = await fetch('http://127.0.0.1:8000/simulate', {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the simulation engine.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCompareFutures(activeScenarios: Record<ScenarioSlot, ScenarioSnapshot | null>) {
    try {
      const response = await fetch('http://127.0.0.1:8000/compare-futures', {
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

  function applyRecommendation(opt: CounterfactualOption) {
    if (opt.target_field === 'capacity') setCapacity(opt.recommended_value)
    else if (opt.target_field === 'demand') setDemand(opt.recommended_value)
    else if (opt.target_field === 'inventory') setInventory(opt.recommended_value)
    else if (opt.target_field === 'lead_time') setLeadTime(opt.recommended_value)
  }

  function saveScenario(slot: ScenarioSlot) {
    const newSnapshot: ScenarioSnapshot = {
      slot,
      name: `Scenario ${slot}`,
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
        position: { x: 40, y: 180 },
        data: {
          title: 'Decision',
          value: `${demand} units`,
          detail: `Demand  ${leadTime} day lead time`,
          status: 'INPUT',
          isHighlighted: showWhy,
        },
      },
      {
        id: 'capacity',
        type: 'decision',
        position: { x: 360, y: 80 },
        data: {
          title: 'Capacity',
          value: `${capacity} units`,
          detail: `${Math.round(result.utilization * 100)}% utilization`,
          status: 'DEPENDENCY',
          isHighlighted: showWhy,
        },
      },
      {
        id: 'inventory',
        type: 'decision',
        position: { x: 360, y: 280 },
        data: {
          title: 'Inventory',
          value: `${inventory} units`,
          detail: `${result.projected_inventory} projected`,
          status: 'DEPENDENCY',
          isHighlighted: showWhy,
        },
      },
      {
        id: 'consequence',
        type: 'decision',
        position: { x: 700, y: 180 },
        data: {
          title: 'Consequence',
          value: `${result.delay_days} days`,
          detail: `${result.risk} risk  $${result.cost.toLocaleString()}`,
          status: 'OUTPUT',
          isHighlighted: showWhy,
          showWhyButton: true,
          onWhyClick: () => {
            setShowWhy((prev) => !prev)
            setShowWhatIf(false)
            setShowWhatChanged(false)
            setShowScenarios(false)
            setShowCompareFutures(false)
          },
        },
      },
    ],
    [capacity, demand, inventory, leadTime, result, showWhy],
  )

  const strokeColor =
    result.risk === 'HIGH' ? '#ef4444' : result.risk === 'MEDIUM' ? '#f59e0b' : '#10b981'

  const edges: Edge[] = useMemo(
    () => [
      {
        id: 'decision-capacity',
        source: 'input',
        target: 'capacity',
        animated: true,
        style: { stroke: showWhy ? strokeColor : '#64748b', strokeWidth: showWhy ? 3 : 1.5 },
      },
      {
        id: 'decision-inventory',
        source: 'input',
        target: 'inventory',
        animated: true,
        style: { stroke: showWhy ? strokeColor : '#64748b', strokeWidth: showWhy ? 3 : 1.5 },
      },
      {
        id: 'capacity-consequence',
        source: 'capacity',
        target: 'consequence',
        animated: true,
        style: { stroke: showWhy ? strokeColor : '#64748b', strokeWidth: showWhy ? 3 : 1.5 },
      },
      {
        id: 'inventory-consequence',
        source: 'inventory',
        target: 'consequence',
        animated: true,
        style: { stroke: showWhy ? strokeColor : '#64748b', strokeWidth: showWhy ? 3 : 1.5 },
      },
    ],
    [showWhy, strokeColor],
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">DECISIONTWIN</div>
          <h1>See the consequences before you commit.</h1>
          <p className="subtitle">
            A deterministic decision simulation showing how one choice propagates through its dependencies.
          </p>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          Simulation engine online
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel">
          <div className="section-label">DECISION INPUTS</div>

          <label>
            <div className="control-heading">
              <span>Demand</span>
              <strong>{demand} units</strong>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={demand}
              onChange={(event) => setDemand(Number(event.target.value))}
            />
          </label>

          <label>
            <div className="control-heading">
              <span>Inventory</span>
              <strong>{inventory} units</strong>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={inventory}
              onChange={(event) => setInventory(Number(event.target.value))}
            />
          </label>

          <label>
            <div className="control-heading">
              <span>Capacity</span>
              <strong>{capacity} units</strong>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
            />
          </label>

          <label>
            <div className="control-heading">
              <span>Lead time</span>
              <strong>{leadTime} days</strong>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={leadTime}
              onChange={(event) => setLeadTime(Number(event.target.value))}
            />
          </label>

          <button className="simulate-button" onClick={simulate} disabled={loading}>
            {loading ? 'Simulating' : 'Run simulation'}
          </button>

          {error && <div className="error-box">{error}</div>}

          <div className="quick-scenario-section">
            <div className="section-label">SAVE CURRENT SCENARIO</div>
            <div className="scenario-quick-btn-grid">
              {(['A', 'B', 'C'] as ScenarioSlot[]).map((slot) => {
                const sc = scenarios[slot]
                const isActive = activeScenario === slot
                return (
                  <button
                    key={slot}
                    className={`quick-slot-btn ${sc ? 'has-data' : ''} ${isActive ? 'is-active' : ''}`}
                    onClick={() => saveScenario(slot)}
                    title={sc ? `Overwrite Scenario ${slot}` : `Save current state as Scenario ${slot}`}
                  >
                    {sc ? `Save ${slot} ✓` : `Save ${slot}`}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="model-note">
            <span>DETERMINISTIC MODEL</span>
            <p>
              Results, causal traces, counterfactuals, deltas & futures come directly from the simulation engine.
            </p>
          </div>
        </aside>

        <section className="graph-panel">
          <div className="graph-header">
            <div>
              <div className="section-label">CAUSAL MODEL</div>
              <h2>Decision propagation</h2>
            </div>
            <div className="header-actions">
              <button
                className={`why-toggle-button ${showWhy ? 'active' : ''}`}
                onClick={() => {
                  setShowWhy((prev) => !prev)
                  setShowWhatIf(false)
                  setShowWhatChanged(false)
                  setShowScenarios(false)
                  setShowCompareFutures(false)
                }}
              >
                <span className="why-badge-icon">?</span> WHY? Causal Trace
              </button>

              <button
                className={`whatif-toggle-button ${showWhatIf ? 'active' : ''}`}
                onClick={() => {
                  setShowWhatIf((prev) => !prev)
                  setShowWhy(false)
                  setShowWhatChanged(false)
                  setShowScenarios(false)
                  setShowCompareFutures(false)
                }}
              >
                <span className="whatif-badge-icon">⚡</span> WHAT IF? Counterfactuals
              </button>

              <button
                className={`whatchanged-toggle-button ${showWhatChanged ? 'active' : ''}`}
                onClick={() => {
                  setShowWhatChanged((prev) => !prev)
                  setShowWhy(false)
                  setShowWhatIf(false)
                  setShowScenarios(false)
                  setShowCompareFutures(false)
                }}
              >
                <span className="whatchanged-badge-icon">Δ</span> WHAT CHANGED?
              </button>

              <button
                className={`scenarios-toggle-button ${showScenarios ? 'active' : ''}`}
                onClick={() => {
                  setShowScenarios((prev) => !prev)
                  setShowWhy(false)
                  setShowWhatIf(false)
                  setShowWhatChanged(false)
                  setShowCompareFutures(false)
                }}
              >
                <span className="scenarios-badge-icon">🗂</span> SCENARIOS A/B/C
              </button>

              <button
                className={`futures-toggle-button ${showCompareFutures ? 'active' : ''}`}
                onClick={async () => {
                  setShowCompareFutures((prev) => !prev)
                  setShowWhy(false)
                  setShowWhatIf(false)
                  setShowWhatChanged(false)
                  setShowScenarios(false)
                  await fetchCompareFutures(scenarios)
                }}
              >
                <span className="futures-badge-icon">📊</span> COMPARE FUTURES
              </button>

              <div className={`risk-badge risk-${result.risk.toLowerCase()}`}>
                {result.risk} RISK
              </div>
            </div>
          </div>

          <div className="graph">
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
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>

          <div className="result-strip">
            <div>
              <span>PROJECTED INVENTORY</span>
              <strong>{result.projected_inventory}</strong>
            </div>
            <div>
              <span>UTILIZATION</span>
              <strong>{Math.round(result.utilization * 100)}%</strong>
            </div>
            <div>
              <span>DELAY</span>
              <strong>{result.delay_days} days</strong>
            </div>
            <div>
              <span>EST. COST</span>
              <strong>${result.cost.toLocaleString()}</strong>
            </div>
            <div>
              <span>BOTTLENECK</span>
              <strong>{result.bottleneck ?? 'None'}</strong>
            </div>
          </div>

          {showWhy && (
            <div className="causal-trace-panel">
              <div className="causal-trace-header">
                <div>
                  <div className="section-label">CAUSAL EXPLANATION</div>
                  <h3>Why did this outcome occur?</h3>
                </div>
                <button className="close-why-btn" onClick={() => setShowWhy(false)}>
                  ✕ Close Trace
                </button>
              </div>

              <div className="causal-summary-card">
                <div className="summary-badge">DETERMINISTIC ROOT CAUSE</div>
                <p>{result.causal_summary}</p>
              </div>

              <div className="causal-chain-container">
                <div className="chain-heading">Causal Chain Sequence</div>
                <div className="causal-chain-flow">
                  {result.causal_chain.map((step, idx) => (
                    <div key={step.step} className="causal-step-wrapper">
                      <div className={`causal-step-card trend-${step.trend.toLowerCase()}`}>
                        <div className="step-top-row">
                          <span className="step-number">0{step.step}</span>
                          <span className={`step-symbol symbol-${step.trend.toLowerCase()}`}>
                            {step.symbol}
                          </span>
                        </div>
                        <div className="step-label">{step.label}</div>
                        <div className="step-value">{step.value}</div>
                        <p className="step-detail">{step.detail}</p>
                      </div>
                      {idx < result.causal_chain.length - 1 && (
                        <div className="causal-arrow">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showWhatIf && (
            <div className="whatif-panel">
              <div className="whatif-header">
                <div>
                  <div className="section-label">COUNTERFACTUAL ANALYSIS</div>
                  <h3>What-If & Bottleneck Mitigation</h3>
                </div>
                <button className="close-why-btn" onClick={() => setShowWhatIf(false)}>
                  ✕ Close Analysis
                </button>
              </div>

              <div className="counterfactual-grid">
                {result.counterfactuals.map((opt) => (
                  <div key={opt.id} className="counterfactual-card">
                    <div className="card-top">
                      <span className="card-title">{opt.title}</span>
                      <span className={`risk-badge risk-${opt.projected_risk.toLowerCase()}`}>
                        {opt.projected_risk} RISK
                      </span>
                    </div>
                    <div className="card-action">{opt.action}</div>
                    <p className="card-summary">{opt.impact_summary}</p>
                    <div className="card-metrics">
                      <div>
                        <span>PROJ. UTILIZATION</span>
                        <strong>{Math.round(opt.projected_utilization * 100)}%</strong>
                      </div>
                      <div>
                        <span>PROJ. DELAY</span>
                        <strong>{opt.projected_delay_days} days</strong>
                      </div>
                      <div>
                        <span>PROJ. COST</span>
                        <strong>${opt.projected_cost.toLocaleString()}</strong>
                      </div>
                    </div>
                    <button
                      className="apply-recommendation-btn"
                      onClick={() => applyRecommendation(opt)}
                    >
                      Apply Adjustment Slider →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showWhatChanged && (
            <div className="whatchanged-panel">
              <div className="whatchanged-header">
                <div>
                  <div className="section-label">SIMULATION COMPARISON</div>
                  <h3>What Changed Since Previous Run?</h3>
                </div>
                <button className="close-why-btn" onClick={() => setShowWhatChanged(false)}>
                  ✕ Close Comparison
                </button>
              </div>

              {!result.state_change.has_previous ? (
                <div className="whatchanged-empty-card">
                  <div className="empty-title">INITIAL BASELINE ESTABLISHED</div>
                  <p>
                    Adjust decision parameters (Demand, Capacity, Inventory, Lead Time) and click <strong>Run simulation</strong> to compare baseline vs new simulation state.
                  </p>
                </div>
              ) : (
                <>
                  <div className="whatchanged-summary-card">
                    <div className="summary-badge">KEY METRIC SHIFT SUMMARY</div>
                    <p>{result.state_change.summary}</p>
                  </div>

                  <div className="whatchanged-grid">
                    {result.state_change.deltas.map((item) => (
                      <div
                        key={item.name}
                        className={`whatchanged-card impact-${item.impact.toLowerCase()}`}
                      >
                        <div className="whatchanged-card-top">
                          <span className="metric-name">{item.name}</span>
                          <span className={`delta-pill delta-${item.impact.toLowerCase()}`}>
                            {item.delta}
                          </span>
                        </div>
                        <div className="whatchanged-values">
                          <div>
                            <span>PREVIOUS</span>
                            <strong>{item.previous}</strong>
                          </div>
                          <div className="value-arrow">→</div>
                          <div>
                            <span>CURRENT</span>
                            <strong>{item.current}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {showScenarios && (
            <div className="scenarios-panel">
              <div className="scenarios-header">
                <div>
                  <div className="section-label">DECISION SCENARIOS</div>
                  <h3>Scenario A / B / C Comparison</h3>
                </div>
                <div className="header-actions">
                  <button
                    className="futures-toggle-button active"
                    onClick={async () => {
                      setShowCompareFutures(true)
                      setShowScenarios(false)
                      await fetchCompareFutures(scenarios)
                    }}
                  >
                    <span className="futures-badge-icon">📊</span> Compare Futures Side-by-Side
                  </button>
                  <button className="close-why-btn" onClick={() => setShowScenarios(false)}>
                    ✕ Close Scenarios
                  </button>
                </div>
              </div>

              <div className="scenarios-grid">
                {(['A', 'B', 'C'] as ScenarioSlot[]).map((slot) => {
                  const sc = scenarios[slot]
                  const isActive = activeScenario === slot

                  return (
                    <div
                      key={slot}
                      className={`scenario-card ${sc ? 'has-data' : 'empty'} ${isActive ? 'active-scenario' : ''}`}
                    >
                      <div className="scenario-card-header">
                        <div className="scenario-title">
                          <strong>SCENARIO {slot}</strong>
                          {isActive && <span className="active-tag">ACTIVE</span>}
                        </div>
                        {sc && <span className="saved-time">{sc.savedAt}</span>}
                      </div>

                      {!sc ? (
                        <div className="empty-scenario-body">
                          <p>No saved state in slot {slot}.</p>
                          <button className="save-scenario-btn" onClick={() => saveScenario(slot)}>
                            Save Current State as {slot}
                          </button>
                        </div>
                      ) : (
                        <div className="saved-scenario-body">
                          <div className="scenario-input-strip">
                            <div>
                              <span>DEMAND</span>
                              <strong>{sc.demand}</strong>
                            </div>
                            <div>
                              <span>CAPACITY</span>
                              <strong>{sc.capacity}</strong>
                            </div>
                            <div>
                              <span>INVENTORY</span>
                              <strong>{sc.inventory}</strong>
                            </div>
                            <div>
                              <span>LEAD TIME</span>
                              <strong>{sc.lead_time}d</strong>
                            </div>
                          </div>

                          <div className="scenario-outcome-strip">
                            <div>
                              <span>RISK</span>
                              <span className={`risk-badge risk-${sc.result.risk.toLowerCase()}`}>
                                {sc.result.risk}
                              </span>
                            </div>
                            <div>
                              <span>UTILIZATION</span>
                              <strong>{Math.round(sc.result.utilization * 100)}%</strong>
                            </div>
                            <div>
                              <span>DELAY</span>
                              <strong>{sc.result.delay_days}d</strong>
                            </div>
                            <div>
                              <span>COST</span>
                              <strong>${sc.result.cost.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="scenario-actions">
                            <button className="load-scenario-btn" onClick={() => loadScenario(slot)}>
                              Load Scenario {slot}
                            </button>
                            <button
                              className="overwrite-scenario-btn"
                              onClick={() => saveScenario(slot)}
                              title="Overwrite with current state"
                            >
                              Overwrite
                            </button>
                            <button
                              className="clear-scenario-btn"
                              onClick={() => clearScenario(slot)}
                              title="Clear scenario"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {showCompareFutures && (
            <div className="futures-panel">
              <div className="futures-header">
                <div>
                  <div className="section-label">FACTUAL TRADEOFF MATRIX</div>
                  <h3>Side-by-Side Future Comparison</h3>
                </div>
                <button className="close-why-btn" onClick={() => setShowCompareFutures(false)}>
                  ✕ Close View
                </button>
              </div>

              {!futuresComparison || futuresComparison.active_slots.length < 2 ? (
                <div className="futures-empty-card">
                  <div className="empty-title">SCENARIO COMPARISON REQUIRES AT LEAST 2 SAVED SCENARIOS</div>
                  <p>
                    Save at least 2 scenarios (e.g. <strong>Scenario A</strong> and <strong>Scenario B</strong>) using the <strong>Save A / B / C</strong> buttons to generate a side-by-side factual trade-off matrix.
                  </p>
                </div>
              ) : (
                <>
                  <div className="futures-summary-card">
                    <div className="summary-badge">DETERMINISTIC TRADEOFF SUMMARY</div>
                    <p>{futuresComparison.summary}</p>
                  </div>

                  <div className="futures-matrix-container">
                    <table className="futures-matrix-table">
                      <thead>
                        <tr>
                          <th>METRIC</th>
                          <th>SCENARIO A</th>
                          <th>SCENARIO B {futuresComparison.active_slots.includes('B') && <span className="diff-tag">(Diff vs A)</span>}</th>
                          <th>SCENARIO C {futuresComparison.active_slots.includes('C') && <span className="diff-tag">(Diff vs A)</span>}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futuresComparison.rows.map((row) => (
                          <tr key={row.name}>
                            <td className="row-name">{row.name}</td>
                            <td className="row-val-a">{row.val_a ?? '-'}</td>
                            <td className="row-val-b">
                              <div className="cell-flex">
                                <span>{row.val_b ?? '-'}</span>
                                {row.diff_b_vs_a && row.diff_b_vs_a !== '-' && row.diff_b_vs_a !== '=' && (
                                  <span className={`diff-pill ${row.diff_b_vs_a.startsWith('+') ? 'diff-up' : 'diff-down'}`}>
                                    {row.diff_b_vs_a}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="row-val-c">
                              <div className="cell-flex">
                                <span>{row.val_c ?? '-'}</span>
                                {row.diff_c_vs_a && row.diff_c_vs_a !== '-' && row.diff_c_vs_a !== '=' && (
                                  <span className={`diff-pill ${row.diff_c_vs_a.startsWith('+') ? 'diff-up' : 'diff-down'}`}>
                                    {row.diff_c_vs_a}
                                  </span>
                                )}
                              </div>
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
        </section>
      </section>
    </main>
  )
}

export default App





