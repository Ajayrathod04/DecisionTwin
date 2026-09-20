import { useCallback, useEffect, useMemo, useState } from 'react'
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

function BrandLogo() {
  return (
    <div className="brand-logo" aria-label="DecisionTwin Logo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="logo-svg">
        <circle cx="6" cy="12" r="4" stroke="#38bdf8" strokeWidth="2.5" />
        <circle cx="18" cy="12" r="4" stroke="#38bdf8" strokeWidth="2.5" />
        <path d="M10 12H14" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="2 2" />
      </svg>
      <span className="logo-text">
        <strong>DECISION</strong>TWIN
      </span>
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
  const [activeSection, setActiveSection] = useState(1)

  // Module 01 State — Decision Twin Engine
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

  // Module 02 State — Career Twin Case Study
  const [careerSalary, setCareerSalary] = useState(135000)
  const [careerRemoteDays, setCareerRemoteDays] = useState(2)
  const [careerWorkHours, setCareerWorkHours] = useState(45)
  const [careerLearningIndex, setCareerLearningIndex] = useState(7)

  // Module 03 State — Notice to Action Concept
  const [noticeViewMode, setNoticeViewMode] = useState<'document' | 'extracted' | 'checklist'>('document')

  // Section Observer Setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sec = Number(entry.target.getAttribute('data-section'))
            if (sec && !isNaN(sec)) {
              setActiveSection(sec)
            }
          }
        })
      },
      { threshold: 0.3 }
    )

    const sections = document.querySelectorAll('section[data-section]')
    sections.forEach((sec) => observer.observe(sec))

    return () => observer.disconnect()
  }, [])

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
      setTimeout(() => setJustSimulated(false), 900)
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

  // Career Twin Calculations (Deterministic Frontend Case Study)
  const careerSavings = Math.round(careerSalary * 0.42 - (5 - careerRemoteDays) * 3200)
  const careerCommuteHours = Number(((5 - careerRemoteDays) * 1.2).toFixed(1))
  const careerFreeHours = Math.max(10, Math.round(168 - careerWorkHours - careerCommuteHours * 5 - 56))
  const careerSkillGrowth = Math.round(careerLearningIndex * 9 + (careerWorkHours > 44 ? 18 : 6))
  const careerRisk =
    careerWorkHours >= 52 || careerCommuteHours >= 6.5
      ? 'HIGH'
      : careerWorkHours >= 44
      ? 'MEDIUM'
      : 'LOW'

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
      {/* Persistent Floating Navigation & Section Counter */}
      <nav className="persistent-nav" aria-label="Product Navigation">
        <BrandLogo />
        <div className="nav-links">
          <a href="#sec-01" className={activeSection === 1 ? 'active' : ''}>01 Decision</a>
          <a href="#sec-02" className={activeSection === 2 ? 'active' : ''}>02 Career</a>
          <a href="#sec-03" className={activeSection === 3 ? 'active' : ''}>03 Notice</a>
          <a href="#sec-04" className={activeSection === 4 ? 'active' : ''}>04 Verification</a>
        </div>
        <div className="section-counter" aria-label="Section counter">
          <span className="counter-curr">0{activeSection}</span>
          <span className="counter-sep">/</span>
          <span className="counter-max">04</span>
        </div>
      </nav>

      {/* SECTION 01 — DECISIONTWIN COMPLEX DECISIONS (PRIMARY ENGINE PRODUCT) */}
      <section id="sec-01" data-section="1" className="product-section">
        <header className="topbar">
          <div>
            <div className="eyebrow">01 / DECISIONTWIN — COMPLEX DECISIONS</div>
            <h1>SEE THE CONSEQUENCES BEFORE YOU COMMIT.</h1>
            <p className="subtitle">
              A living decision interface for testing how one change propagates through a system.
            </p>
          </div>
          <div className="status-pill" aria-label="AWS Elastic Beanstalk Live API Status">
            <span className="live-dot" />
            <span>AWS • LIVE API</span>
          </div>
        </header>

        <div className="workspace">
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

          <div className="graph-room">
            <div className="graph-topbar">
              <div className="graph-title-block">
                <span className="section-label">CAUSAL SYSTEM MAP</span>
                <h2>Decision Room</h2>
              </div>

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

            {/* Integrated Analysis Panels */}
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
          </div>
        </div>
      </section>

      {/* SECTION 02 — DECISIONTWIN CAREER CASE STUDY */}
      <section id="sec-02" data-section="2" className="case-study-section">
        <div className="section-header-block">
          <div className="eyebrow">02 / CAREER CASE STUDY</div>
          <h2>TAKE THE JOB? SEE WHAT FOLLOWS.</h2>
          <p className="subtitle">
            Model real-world career tradeoffs — salary, remote flexibility, discretionary time, and burnout risk — using the same causal dependency concept.
          </p>
        </div>

        <div className="case-study-grid">
          <div className="case-controls-panel">
            <span className="section-label">CAREER ASSUMPTIONS</span>

            <div className="control-item">
              <div className="control-heading">
                <span>Base Salary</span>
                <strong>${careerSalary.toLocaleString()} / yr</strong>
              </div>
              <input
                type="range"
                min="60000"
                max="220000"
                step="5000"
                value={careerSalary}
                aria-label="Base Salary Slider"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${((careerSalary - 60000) / 160000) * 100}%, #21262d ${((careerSalary - 60000) / 160000) * 100}%, #21262d 100%)`,
                }}
                onChange={(e) => setCareerSalary(Number(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-heading">
                <span>Remote Days</span>
                <strong>{careerRemoteDays} days / wk</strong>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={careerRemoteDays}
                aria-label="Remote Days Slider"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${(careerRemoteDays / 5) * 100}%, #21262d ${(careerRemoteDays / 5) * 100}%, #21262d 100%)`,
                }}
                onChange={(e) => setCareerRemoteDays(Number(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-heading">
                <span>Weekly Work Hours</span>
                <strong>{careerWorkHours} hrs / wk</strong>
              </div>
              <input
                type="range"
                min="35"
                max="65"
                step="1"
                value={careerWorkHours}
                aria-label="Work Hours Slider"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${((careerWorkHours - 35) / 30) * 100}%, #21262d ${((careerWorkHours - 35) / 30) * 100}%, #21262d 100%)`,
                }}
                onChange={(e) => setCareerWorkHours(Number(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-heading">
                <span>Learning Density</span>
                <strong>Level {careerLearningIndex} / 10</strong>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={careerLearningIndex}
                aria-label="Learning Index Slider"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${((careerLearningIndex - 1) / 9) * 100}%, #21262d ${((careerLearningIndex - 1) / 9) * 100}%, #21262d 100%)`,
                }}
                onChange={(e) => setCareerLearningIndex(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="case-display-panel">
            <span className="section-label">CAUSAL DEPENDENCY CHAIN</span>
            <div className="career-chain-visual">
              <div className="chain-node">
                <span className="c-lbl">JOB OFFER</span>
                <strong className="c-val">${careerSalary.toLocaleString()}</strong>
                <span className="c-sub">{careerWorkHours}h workweek</span>
              </div>
              <span className="c-arrow">→</span>
              <div className="chain-node">
                <span className="c-lbl">NET SAVINGS</span>
                <strong className="c-val">${careerSavings.toLocaleString()}/yr</strong>
                <span className="c-sub">after tax & travel</span>
              </div>
              <span className="c-arrow">→</span>
              <div className="chain-node">
                <span className="c-lbl">COMMUTE & TIME</span>
                <strong className="c-val">{careerCommuteHours}h/wk</strong>
                <span className="c-sub">{careerFreeHours}h free time</span>
              </div>
              <span className="c-arrow">→</span>
              <div className="chain-node">
                <span className="c-lbl">GROWTH & RISK</span>
                <strong className="c-val">+{careerSkillGrowth}% / yr</strong>
                <span className={`risk-tag risk-${careerRisk.toLowerCase()}`}>{careerRisk} BURNOUT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — NOTICE TO ACTION PRODUCT CONCEPT SHOWCASE */}
      <section id="sec-03" data-section="3" className="case-study-section">
        <div className="section-header-block">
          <div className="eyebrow">03 / NOTICE → ACTION CONCEPT</div>
          <h2>TURN A NOTICE INTO ACTION.</h2>
          <p className="subtitle">
            Unstructured announcements and academic deadlines transformed into structured requirement cards and actionable checklists.
          </p>
        </div>

        <div className="notice-concept-container">
          <div className="notice-tab-bar">
            <button
              className={`n-tab ${noticeViewMode === 'document' ? 'active' : ''}`}
              onClick={() => setNoticeViewMode('document')}
            >
              1. Raw Notice Document
            </button>
            <button
              className={`n-tab ${noticeViewMode === 'extracted' ? 'active' : ''}`}
              onClick={() => setNoticeViewMode('extracted')}
            >
              2. Extracted Requirements
            </button>
            <button
              className={`n-tab ${noticeViewMode === 'checklist' ? 'active' : ''}`}
              onClick={() => setNoticeViewMode('checklist')}
            >
              3. Action Checklist
            </button>
          </div>

          <div className="notice-display-body">
            {noticeViewMode === 'document' && (
              <div className="notice-doc-card">
                <div className="doc-header">
                  <span className="doc-stamp">OFFICIAL NOTICE #409</span>
                  <span className="doc-date">Issued: Oct 2nd</span>
                </div>
                <h3>Final Year Project Defense & Submission Timeline</h3>
                <p>
                  All senior degree candidates must submit their final project documentation and software repository links by October 15th before 11:59 PM. Submissions must include LaTeX documentation PDF, 3-minute video presentation, and tagged release on GitHub. Late submissions incur a 15% grade deduction per day.
                </p>
                <div className="doc-footer">
                  <span>Source: Academic Senate Board</span>
                </div>
              </div>
            )}

            {noticeViewMode === 'extracted' && (
              <div className="notice-extracted-grid">
                <div className="ex-card">
                  <span className="ex-lbl">REQUIREMENT 01</span>
                  <strong>LaTeX Documentation PDF</strong>
                  <p>Comprehensive system architecture & test verification report.</p>
                </div>
                <div className="ex-card">
                  <span className="ex-lbl">REQUIREMENT 02</span>
                  <strong>3-Min Video Demo</strong>
                  <p>Screen recording demonstrating core system features.</p>
                </div>
                <div className="ex-card">
                  <span className="ex-lbl">HARD DEADLINE</span>
                  <strong className="deadline-val">October 15, 11:59 PM</strong>
                  <p>Penalty: 15% deduction per 24-hour delay.</p>
                </div>
              </div>
            )}

            {noticeViewMode === 'checklist' && (
              <div className="notice-checklist-card">
                <h4>ACTION CHECKLIST FOR CANDIDATE</h4>
                <ul className="checklist">
                  <li className="checked">
                    <span className="chk-icon">✓</span>
                    <span>Submit abstract and draft architecture diagram</span>
                  </li>
                  <li>
                    <span className="chk-icon">○</span>
                    <span>Compile LaTeX documentation PDF (`document.pdf`)</span>
                  </li>
                  <li>
                    <span className="chk-icon">○</span>
                    <span>Record 3-minute video demonstration walkthrough</span>
                  </li>
                  <li>
                    <span className="chk-icon">○</span>
                    <span>Tag git release commit `v1.0.0-final` on repository</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 04 — OPPORTUNITY VERIFICATION TRAIL SHOWCASE */}
      <section id="sec-04" data-section="4" className="case-study-section">
        <div className="section-header-block">
          <div className="eyebrow">04 / OPPORTUNITY VERIFICATION CONCEPT</div>
          <h2>DON'T JUST TRUST IT. FOLLOW THE EVIDENCE.</h2>
          <p className="subtitle">
            Investigate opportunity authenticity by tracing domain registration, salary benchmarks, and corporate registry verification markers.
          </p>
        </div>

        <div className="verification-container">
          <div className="opportunity-header-card">
            <div className="opp-meta">
              <span className="opp-badge">REMOTE OPPORTUNITY</span>
              <h3>Senior Systems Engineer — Global Tech Labs</h3>
              <span className="opp-comp">$160,000 / yr • Remote (US / India)</span>
            </div>
            <div className="opp-status-pill">
              <span className="live-dot" /> VERIFIED (98% CONFIDENCE)
            </div>
          </div>

          <div className="evidence-trail-list">
            <div className="trail-item">
              <span className="trail-step">01</span>
              <div className="trail-info">
                <strong>DOMAIN AUTHENTICITY</strong>
                <span>Registrar: Cloudflare Inc. • Age: 6 Years</span>
              </div>
              <span className="ver-badge v-pass">VERIFIED</span>
            </div>

            <div className="trail-item">
              <span className="trail-step">02</span>
              <div className="trail-info">
                <strong>CORPORATE REGISTRY</strong>
                <span>Entity #9402-A • Active License in Good Standing</span>
              </div>
              <span className="ver-badge v-pass">VERIFIED</span>
            </div>

            <div className="trail-item">
              <span className="trail-step">03</span>
              <div className="trail-info">
                <strong>SALARY BENCHMARK</strong>
                <span>Market Range: $140K–$175K (Listed $160K is in range)</span>
              </div>
              <span className="ver-badge v-pass">MATCHED</span>
            </div>

            <div className="trail-item">
              <span className="trail-step">04</span>
              <div className="trail-info">
                <strong>RECRUITER AUTHENTICITY</strong>
                <span>SPF/DKIM Signed Recruiter Email Address</span>
              </div>
              <span className="ver-badge v-pass">VERIFIED</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & CORE GRAPH LOOP */}
      <footer className="app-footer">
        <div className="footer-content">
          <BrandLogo />
          <div className="footer-aws">
            <span className="live-dot" />
            <span>AWS • ELASTIC BEANSTALK • AP-SOUTH-1 • LIVE API</span>
          </div>
          <div className="footer-cta">
            <a href="#sec-01" className="return-top-btn">
              RETURN TO DECISION ROOM ↑
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
