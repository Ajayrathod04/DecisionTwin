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

// Types
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
  isDimmed?: boolean
  onWhyClick?: () => void
  showWhyButton?: boolean
  stepActive?: boolean
}

function DecisionNode({
  title,
  value,
  detail,
  status,
  nodeType = 'dependency',
  riskLevel,
  isHighlighted,
  isDimmed,
  onWhyClick,
  showWhyButton,
  stepActive,
}: DecisionNodeProps) {
  const typeClass = `node-${nodeType}`
  const riskClass = riskLevel ? `risk-${riskLevel.toLowerCase()}` : ''

  return (
    <div
      className={`decision-node ${typeClass} ${riskClass} ${isHighlighted ? 'highlighted-node' : ''} ${
        isDimmed ? 'dimmed-node' : ''
      } ${stepActive ? 'step-active-node' : ''}`}
    >
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
            WHY? TRACE
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

// Geometric Brand Logo: Branching path symbol [Decision -> Future A / Future B -> Outcome]
function BrandLogo() {
  return (
    <div className="brand-logo" aria-label="DecisionTwin Brand Identity">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="brand-logo-svg">
        <circle cx="4" cy="13" r="3" fill="#38bdf8" />
        <path d="M7 13 C 11 13, 12 6, 16 6" stroke="#38bdf8" strokeWidth="2" fill="none" />
        <path d="M7 13 C 11 13, 12 20, 16 20" stroke="#38bdf8" strokeWidth="2" fill="none" />
        <circle cx="17" cy="6" r="2.5" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx="17" cy="20" r="2.5" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M19.5 6 C 22 6, 22 13, 24 13" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
        <path d="M19.5 20 C 22 20, 22 13, 24 13" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
      </svg>
      <span className="logo-text">
        <strong>DECISION</strong>TWIN
      </span>
    </div>
  )
}

// Dedicated Module Marks
function ModuleMark({ module }: { module: '01' | '02' | '03' | '04' }) {
  if (module === '01') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mod-mark-svg">
        <circle cx="4" cy="10" r="2" fill="#38bdf8" />
        <path d="M6 10H14" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx="16" cy="10" r="2" fill="#38bdf8" />
      </svg>
    )
  }
  if (module === '02') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mod-mark-svg">
        <path d="M3 16L9 10L13 13L17 5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="5" r="2" fill="#38bdf8" />
      </svg>
    )
  }
  if (module === '03') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mod-mark-svg">
        <rect x="4" y="3" width="12" height="14" rx="2" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M7 8H13M7 11H11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mod-mark-svg">
      <circle cx="9" cy="9" r="5" stroke="#38bdf8" strokeWidth="1.5" />
      <path d="M13 13L17 17" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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

export function App() {
  // Preloader State (~1.4s)
  const [isPreloading, setIsPreloading] = useState(true)

  // Pointer Proximity / Spatial Parallax State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Navigation State
  const [activeSection, setActiveSection] = useState(1)

  // AI Navigator (TwinGuide) State
  const [navOpen, setNavOpen] = useState(false)
  const [navQuery, setNavQuery] = useState('')
  const [navResult, setNavResult] = useState<{
    targetSection: number
    moduleName: string
    understanding: string
    why: string
  } | null>(null)

  // Module 01 State — Decision Twin Engine
  const [demand, setDemand] = useState(100)
  const [inventory, setInventory] = useState(60)
  const [capacity, setCapacity] = useState(100)
  const [leadTime, setLeadTime] = useState(7)
  const [result, setResult] = useState<SimulationResult>(initialResult)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [justSimulated, setJustSimulated] = useState(false)

  // Sequential Causal Propagation Step (1..4)
  const [propagatingStep, setPropagatingStep] = useState<number>(0)

  const [activeTab, setActiveTab] = useState<
    'none' | 'why' | 'whatif' | 'whatchanged' | 'scenarios' | 'futures' | 'explanation'
  >('none')

  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  const [scenarios, setScenarios] = useState<Record<ScenarioSlot, ScenarioSnapshot | null>>({
    A: null,
    B: null,
    C: null,
  })
  const [activeScenario, setActiveScenario] = useState<ScenarioSlot | null>(null)
  const [futuresComparison, setFuturesComparison] = useState<FuturesComparisonResult | null>(null)

  // Module 02 State — Career Twin Interactive Concept
  const [selectedJob, setSelectedJob] = useState<'A' | 'B'>('A')
  const [careerSalary, setCareerSalary] = useState(125000)
  const [careerRemoteDays, setCareerRemoteDays] = useState(3)
  const [careerWorkHours, setCareerWorkHours] = useState(42)
  const [careerLearningIndex, setCareerLearningIndex] = useState(8)
  const [careerRelocation, setCareerRelocation] = useState(false)
  const [careerTimelineHorizon, setCareerTimelineHorizon] = useState<'NOW' | '2_YEARS' | '5_YEARS'>('NOW')

  // Module 03 State — Notice to Action Concept
  const [noticeSampleId, setNoticeSampleId] = useState<'assessments' | 'hostel' | 'placement'>('assessments')
  const [noticeText, setNoticeText] = useState(
    'All senior degree candidates must submit their final project documentation and software repository links by October 15th before 11:59 PM. Submissions must include LaTeX documentation PDF, 3-minute video presentation, and tagged release on GitHub. Late submissions incur a 15% grade deduction per day.'
  )
  const [isEligibleToggle, setIsEligibleToggle] = useState(true)
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({
    req1: true,
    req2: false,
    req3: false,
  })

  // Module 04 State — Opportunity Verification Concept
  const [oppName, setOppName] = useState('Senior AI Systems Intern')
  const [oppOrg, setOppOrg] = useState('Global Cybernetic Labs')
  const [oppSalary, setOppSalary] = useState('$140,000 / yr')
  const [oppDeadline, setOppDeadline] = useState('October 30')
  const [oppEligibility, setOppEligibility] = useState('All CS / ECE Degree Students')
  const [oppUrl, setOppUrl] = useState('https://careers.globaltechlabs.org/roles/9402')
  const [verificationActive, setVerificationActive] = useState(false)

  // Preloader Timer & Pointer Tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPreloading(false)
    }, 1400)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Section Observer
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
      { threshold: 0.25 }
    )

    const sections = document.querySelectorAll('section[data-section]')
    sections.forEach((sec) => observer.observe(sec))

    return () => observer.disconnect()
  }, [])

  // TwinGuide Grounded Problem Router
  const routeUserProblem = (query: string) => {
    const text = query.toLowerCase()
    if (
      text.includes('job') ||
      text.includes('salary') ||
      text.includes('career') ||
      text.includes('remote') ||
      text.includes('commute') ||
      text.includes('burnout') ||
      text.includes('relocation') ||
      text.includes('offer')
    ) {
      setNavResult({
        targetSection: 2,
        moduleName: '02 — DECISIONTWIN CAREER',
        understanding: 'Your query involves job offers, compensation, commute, relocation, and long-term career growth trade-offs.',
        why: 'Career choices affect salary, learning density, free time, and burnout risk simultaneously over time.',
      })
    } else if (
      text.includes('notice') ||
      text.includes('deadline') ||
      text.includes('submit') ||
      text.includes('college') ||
      text.includes('academic') ||
      text.includes('latex') ||
      text.includes('hostel') ||
      text.includes('exam')
    ) {
      setNavResult({
        targetSection: 3,
        moduleName: '03 — NOTICE → ACTION',
        understanding: 'Your query involves unstructured academic notices, deadlines, and required submission items.',
        why: 'Important college announcements contain critical requirements that must be transformed into personal action checklists.',
      })
    } else if (
      text.includes('internship') ||
      text.includes('verify') ||
      text.includes('scam') ||
      text.includes('legit') ||
      text.includes('authentic') ||
      text.includes('opportunity') ||
      text.includes('hackathon') ||
      text.includes('company')
    ) {
      setNavResult({
        targetSection: 4,
        moduleName: '04 — OPPORTUNITY VERIFICATION',
        understanding: 'Your query involves evaluating the authenticity of an internship, job, or hackathon opportunity.',
        why: 'Traces domain registration, corporate registries, market compensation benchmarks, and recruiter credentials.',
      })
    } else {
      setNavResult({
        targetSection: 1,
        moduleName: '01 — DECISIONTWIN OPERATIONS',
        understanding: 'Your query involves complex operational decisions, capacity constraints, inventory buffers, and system risks.',
        why: 'The primary decision instrument models how one change in demand or lead time propagates through dependencies.',
      })
    }
  }

  const navigateToMatchedModule = () => {
    if (!navResult) return
    setNavOpen(false)
    const targetId = `sec-0${navResult.targetSection}`
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Sequential Causal Propagation Trigger Function
  const triggerCausalPropagation = useCallback(() => {
    setPropagatingStep(1)
    setTimeout(() => setPropagatingStep(2), 220)
    setTimeout(() => setPropagatingStep(3), 440)
    setTimeout(() => setPropagatingStep(4), 660)
    setTimeout(() => setPropagatingStep(0), 1200)
  }, [])

  async function simulate() {
    setLoading(true)
    setError('')
    triggerCausalPropagation()

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

  // Handle Input Changes with Causal Propagation Visual
  const handleDemandChange = (val: number) => {
    setDemand(val)
    triggerCausalPropagation()
  }

  const handleCapacityChange = (val: number) => {
    setCapacity(val)
    triggerCausalPropagation()
  }

  const handleInventoryChange = (val: number) => {
    setInventory(val)
    triggerCausalPropagation()
  }

  const handleLeadTimeChange = (val: number) => {
    setLeadTime(val)
    triggerCausalPropagation()
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
      // Graceful fallback
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
      // Graceful fallback
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
    if (opt.target_field === 'capacity') handleCapacityChange(opt.recommended_value)
    else if (opt.target_field === 'demand') handleDemandChange(opt.recommended_value)
    else if (opt.target_field === 'inventory') handleInventoryChange(opt.recommended_value)
    else if (opt.target_field === 'lead_time') handleLeadTimeChange(opt.recommended_value)
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
    triggerCausalPropagation()
  }

  function clearScenario(slot: ScenarioSlot) {
    const updated = { ...scenarios, [slot]: null }
    setScenarios(updated)
    if (activeScenario === slot) {
      setActiveScenario(null)
    }
    void fetchCompareFutures(updated)
  }

  // Career Job A vs Job B Switch
  const switchJob = (job: 'A' | 'B') => {
    setSelectedJob(job)
    if (job === 'A') {
      setCareerSalary(125000)
      setCareerRemoteDays(3)
      setCareerWorkHours(42)
      setCareerLearningIndex(8)
      setCareerRelocation(false)
    } else {
      setCareerSalary(165000)
      setCareerRemoteDays(1)
      setCareerWorkHours(54)
      setCareerLearningIndex(9)
      setCareerRelocation(true)
    }
  }

  // Career Twin Calculations (Deterministic Client-side Concept Engine)
  const careerMult = careerTimelineHorizon === '5_YEARS' ? 2.5 : careerTimelineHorizon === '2_YEARS' ? 1.6 : 1.0
  const careerSavings = Math.round((careerSalary * 0.44 - (5 - careerRemoteDays) * 3400) * careerMult)
  const careerCommuteHours = Number(((5 - careerRemoteDays) * 1.2).toFixed(1))
  const careerFreeHours = Math.max(8, Math.round((168 - careerWorkHours - careerCommuteHours * 5 - 56) * (careerRelocation ? 0.85 : 1)))
  const careerSkillGrowth = Math.round((careerLearningIndex * 8.5 + (careerWorkHours > 44 ? 16 : 6)) * (careerTimelineHorizon === '5_YEARS' ? 2.2 : careerTimelineHorizon === '2_YEARS' ? 1.4 : 1))
  const careerRisk =
    careerWorkHours >= 52 || careerCommuteHours >= 6.5
      ? 'HIGH'
      : careerWorkHours >= 44
      ? 'MEDIUM'
      : 'LOW'

  // Notice Sample Loader
  const loadNoticeSample = (id: 'assessments' | 'hostel' | 'placement') => {
    setNoticeSampleId(id)
    if (id === 'assessments') {
      setNoticeText(
        'All senior degree candidates must submit their final project documentation and software repository links by October 15th before 11:59 PM. Submissions must include LaTeX documentation PDF, 3-minute video presentation, and tagged release on GitHub. Late submissions incur a 15% grade deduction per day.'
      )
    } else if (id === 'hostel') {
      setNoticeText(
        'Hostel room allocation for the spring term opens on October 25th. All residents must upload clearance receipts from the accounts department and complete biometric re-verification by October 20th. Unregistered rooms will be reallocated to waitlist applicants.'
      )
    } else {
      setNoticeText(
        'Campus placement drive for Core Systems Engineering commences November 1st. Eligible candidates must have a CPI >= 7.5, zero active backlogs, and submit signed NOC forms from the department head before October 28th.'
      )
    }
  }

  // Nodes & Edges Setup
  const isWhyActive = activeTab === 'why'

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
          status: 'DECISION INPUT',
          nodeType: 'input',
          isHighlighted: isWhyActive,
          stepActive: propagatingStep === 1,
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
          isHighlighted: isWhyActive,
          isDimmed: !isWhyActive && activeTab !== 'none',
          stepActive: propagatingStep === 2,
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
          isHighlighted: isWhyActive,
          isDimmed: !isWhyActive && activeTab !== 'none',
          stepActive: propagatingStep === 2,
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
          status: 'CONSEQUENCE',
          nodeType: 'output',
          riskLevel: result.risk,
          isHighlighted: isWhyActive,
          showWhyButton: true,
          onWhyClick: () => toggleTab('why'),
          stepActive: propagatingStep === 3 || propagatingStep === 4,
        },
      },
    ],
    [demand, inventory, capacity, leadTime, result, isWhyActive, activeTab, propagatingStep, toggleTab]
  )

  const edges = useMemo<Edge[]>(
    () => [
      {
        id: 'e-input-capacity',
        source: 'input',
        target: 'capacity',
        animated: justSimulated || propagatingStep === 1 || propagatingStep === 2,
        style: {
          stroke: isWhyActive || propagatingStep === 1 || propagatingStep === 2 ? '#38bdf8' : '#30363d',
          strokeWidth: isWhyActive || propagatingStep === 1 ? 2.5 : 1.5,
        },
      },
      {
        id: 'e-input-inventory',
        source: 'input',
        target: 'inventory',
        animated: justSimulated || propagatingStep === 1 || propagatingStep === 2,
        style: {
          stroke: isWhyActive || propagatingStep === 1 || propagatingStep === 2 ? '#38bdf8' : '#30363d',
          strokeWidth: isWhyActive || propagatingStep === 1 ? 2.5 : 1.5,
        },
      },
      {
        id: 'e-capacity-consequence',
        source: 'capacity',
        target: 'consequence',
        animated: justSimulated || propagatingStep === 2 || propagatingStep === 3,
        style: {
          stroke: result.risk === 'HIGH' ? '#f85149' : result.risk === 'MEDIUM' ? '#d29922' : '#38bdf8',
          strokeWidth: isWhyActive || propagatingStep === 2 || propagatingStep === 3 ? 2.5 : 1.5,
        },
      },
      {
        id: 'e-inventory-consequence',
        source: 'inventory',
        target: 'consequence',
        animated: justSimulated || propagatingStep === 2 || propagatingStep === 3,
        style: {
          stroke: result.risk === 'HIGH' ? '#f85149' : result.risk === 'MEDIUM' ? '#d29922' : '#38bdf8',
          strokeWidth: isWhyActive || propagatingStep === 2 || propagatingStep === 3 ? 2.5 : 1.5,
        },
      },
    ],
    [result.risk, justSimulated, isWhyActive, propagatingStep]
  )

  return (
    <main className="app-shell">
      {/* 1. Preloader Screen (~1.4s) */}
      {isPreloading && (
        <div className="preloader-overlay" aria-label="System Initializing">
          <div className="preloader-content">
            <BrandLogo />
            <div className="preloader-title">DECISIONTWIN</div>
            <div className="preloader-status">
              <span className="live-dot" /> SYSTEM INITIALIZING...
            </div>
            <div className="preloader-bar">
              <div className="preloader-bar-fill" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Fixed Editorial Navigation Bar with Section Progress Rail */}
      <nav className="persistent-nav" aria-label="Product Navigation">
        <div className="nav-left">
          <BrandLogo />
        </div>

        <div className="nav-links">
          <a href="#sec-01" className={activeSection === 1 ? 'active' : ''}>
            <ModuleMark module="01" /> 01 DECISION
          </a>
          <a href="#sec-02" className={activeSection === 2 ? 'active' : ''}>
            <ModuleMark module="02" /> 02 CAREER
          </a>
          <a href="#sec-03" className={activeSection === 3 ? 'active' : ''}>
            <ModuleMark module="03" /> 03 NOTICE
          </a>
          <a href="#sec-04" className={activeSection === 4 ? 'active' : ''}>
            <ModuleMark module="04" /> 04 VERIFY
          </a>
        </div>

        <div className="nav-right">
          <div className="nav-progress-rail" aria-hidden="true">
            <span className={`rail-dot ${activeSection >= 1 ? 'active' : ''}`} />
            <span className={`rail-dot ${activeSection >= 2 ? 'active' : ''}`} />
            <span className={`rail-dot ${activeSection >= 3 ? 'active' : ''}`} />
            <span className={`rail-dot ${activeSection >= 4 ? 'active' : ''}`} />
          </div>
          <div className="section-counter" aria-label="Section Counter">
            <span className="counter-curr">0{activeSection}</span>
            <span className="counter-sep">/</span>
            <span className="counter-max">04</span>
          </div>
        </div>
      </nav>

      {/* 3. Text-Only AI Navigator Widget (TwinGuide) */}
      <div className="twin-guide-wrapper">
        {!navOpen ? (
          <button
            className="twin-guide-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Open DecisionTwin Navigator"
          >
            <span className="tg-icon">✦</span>
            <span>TWIN GUIDE</span>
          </button>
        ) : (
          <div className="twin-guide-drawer">
            <div className="tg-header">
              <div className="tg-title-row">
                <span className="tg-icon">✦</span>
                <strong>DECISIONTWIN NAVIGATOR</strong>
              </div>
              <button className="tg-close" onClick={() => setNavOpen(false)}>✕</button>
            </div>

            <p className="tg-prompt-lbl">Describe a real-world decision or problem to route:</p>

            <textarea
              className="tg-textarea"
              placeholder="e.g. 'I have a job offer with higher salary but long commute hours...' or 'My operations team faces capacity bottlenecks...'"
              value={navQuery}
              onChange={(e) => {
                setNavQuery(e.target.value)
                if (e.target.value.trim().length > 3) {
                  routeUserProblem(e.target.value)
                }
              }}
            />

            <div className="tg-quick-prompts">
              <span>QUICK PROMPTS:</span>
              <button onClick={() => { setNavQuery('Job offer with higher pay but relocation'); routeUserProblem('Job offer with higher pay but relocation'); }}>
                Career Offer
              </button>
              <button onClick={() => { setNavQuery('Capacity bottleneck and demand surge'); routeUserProblem('Capacity bottleneck and demand surge'); }}>
                Operations
              </button>
              <button onClick={() => { setNavQuery('College notice with LaTeX PDF deadline'); routeUserProblem('College notice with LaTeX PDF deadline'); }}>
                Notice
              </button>
              <button onClick={() => { setNavQuery('Is this remote internship authentic?'); routeUserProblem('Is this remote internship authentic?'); }}>
                Verify
              </button>
            </div>

            {navResult && (
              <div className="tg-result-box">
                <div className="tg-res-sec">
                  <span className="tg-res-lbl">UNDERSTANDING</span>
                  <p>{navResult.understanding}</p>
                </div>

                <div className="tg-res-sec">
                  <span className="tg-res-lbl">MATCHED MODULE</span>
                  <strong className="tg-res-mod">{navResult.moduleName}</strong>
                </div>

                <div className="tg-res-sec">
                  <span className="tg-res-lbl">GROUNDING WHY</span>
                  <p>{navResult.why}</p>
                </div>

                <button className="tg-action-btn" onClick={navigateToMatchedModule}>
                  OPEN MODULE →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 01 — DECISIONTWIN PRIMARY CAUSAL GRAPH ENGINE */}
      <section id="sec-01" data-section="1" className="product-section">
        {/* Full Viewport Opening Hero Scene */}
        <div className="hero-block">
          <div className="hero-kicker">
            <span className="kicker-tag">DECISIONTWIN</span>
            <span className="kicker-sep">•</span>
            <span className="kicker-sub">SYSTEM / 01</span>
          </div>
          <h1 className="hero-headline">
            SEE WHAT HAPPENS <br />
            BEFORE YOU COMMIT.
          </h1>
          <p className="hero-subheadline">
            "Decisions don't happen in isolation." — A decision intelligence interface for seeing consequences, comparing futures, and turning uncertainty into action.
          </p>

          <div className="hero-ctas">
            <a href="#decision-workspace" className="hero-primary-btn">
              ENTER DECISION ROOM ↓
            </a>
            <a href="#sec-02" className="hero-secondary-btn">
              EXPLORE SYSTEM FUTURES
            </a>
          </div>
        </div>

        {/* Pointer-Interactive Decision Container Parallax Scene */}
        <div
          className="decision-container-scene"
          style={{
            transform: `perspective(1000px) rotateX(${mousePos.y * 0.15}deg) rotateY(${mousePos.x * 0.15}deg)`,
          }}
        >
          <div className="scene-card">
            <div className="scene-badge">DECISION TWIN CAUSAL SYSTEM MAP</div>
            <div className="scene-graphic">
              <div className="scene-node n1">INPUT</div>
              <div className="scene-line l1" />
              <div className="scene-node n2">DEPENDENCY</div>
              <div className="scene-line l2" />
              <div className="scene-node n3">CONSEQUENCE</div>
            </div>
            <p className="scene-caption">
              Continuous Causal Graph Architecture — Deterministic simulation engine calculating real-time system trade-offs.
            </p>
          </div>
        </div>

        {/* Primary Interactive Decision Workspace */}
        <div id="decision-workspace" className="workspace-header">
          <div>
            <div className="eyebrow">01 / DECISIONTWIN — SEE THE CONSEQUENCES</div>
            <h2>Interactive Decision Room</h2>
          </div>
          <div className="status-pill" aria-label="AWS Live API Status">
            <span className="live-dot" />
            <span>AWS • ELASTIC BEANSTALK • LIVE API</span>
          </div>
        </div>

        <div className="workspace">
          {/* Controls Console */}
          <aside className="control-panel" aria-label="Decision Console">
            <div className="section-label">DECISION INPUTS</div>

            <div className="control-item">
              <div className="control-heading">
                <span>Demand</span>
                <div className="control-val-group">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleDemandChange(Math.max(20, demand - 5))}
                    aria-label="Decrease demand"
                  >
                    -
                  </button>
                  <strong>{demand} units</strong>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleDemandChange(Math.min(200, demand + 5))}
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
                onChange={(e) => handleDemandChange(Number(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-heading">
                <span>Inventory Buffer</span>
                <div className="control-val-group">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleInventoryChange(Math.max(0, inventory - 5))}
                    aria-label="Decrease inventory"
                  >
                    -
                  </button>
                  <strong>{inventory} units</strong>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleInventoryChange(Math.min(200, inventory + 5))}
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
                onChange={(e) => handleInventoryChange(Number(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-heading">
                <span>Capacity</span>
                <div className="control-val-group">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleCapacityChange(Math.max(20, capacity - 5))}
                    aria-label="Decrease capacity"
                  >
                    -
                  </button>
                  <strong>{capacity} units</strong>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleCapacityChange(Math.min(200, capacity + 5))}
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
                onChange={(e) => handleCapacityChange(Number(e.target.value))}
              />
            </div>

            <div className="control-item">
              <div className="control-heading">
                <span>Lead Time</span>
                <div className="control-val-group">
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleLeadTimeChange(Math.max(1, leadTime - 1))}
                    aria-label="Decrease lead time"
                  >
                    -
                  </button>
                  <strong>{leadTime} days</strong>
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => handleLeadTimeChange(Math.min(30, leadTime + 1))}
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
                onChange={(e) => handleLeadTimeChange(Number(e.target.value))}
              />
            </div>

            <button
              className="simulate-button"
              onClick={simulate}
              disabled={loading}
              aria-label="Run Simulation"
            >
              {loading ? 'SIMULATING SYSTEM...' : 'RUN SIMULATION'}
            </button>

            {error && (
              <div className="error-inline" role="alert">
                <span>⚠️ {error}</span>
                <button className="error-retry" onClick={simulate}>Retry</button>
              </div>
            )}

            <div className="quick-scenarios">
              <div className="section-label">SCENARIO SAVES (A / B / C)</div>
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
              <span>DETERMINISTIC ENGINE</span>
              <p>State changes compute directly via linear bottleneck & risk models.</p>
            </div>
          </aside>

          {/* Graph Room */}
          <div className="graph-room">
            <div className="graph-topbar">
              <div className="graph-title-block">
                <span className="section-label">CAUSAL SYSTEM MAP</span>
                <h2>Consequence Propagation</h2>
              </div>

              <div className="analysis-tabs" role="tablist">
                <button
                  className={`tab-item ${activeTab === 'why' ? 'active' : ''}`}
                  onClick={() => toggleTab('why')}
                  role="tab"
                  aria-selected={activeTab === 'why'}
                >
                  WHY? TRACE
                </button>
                <button
                  className={`tab-item ${activeTab === 'whatif' ? 'active' : ''}`}
                  onClick={() => toggleTab('whatif')}
                  role="tab"
                  aria-selected={activeTab === 'whatif'}
                >
                  COUNTERFACTUALS
                </button>
                <button
                  className={`tab-item ${activeTab === 'whatchanged' ? 'active' : ''}`}
                  onClick={() => toggleTab('whatchanged')}
                  role="tab"
                  aria-selected={activeTab === 'whatchanged'}
                >
                  WHAT CHANGED
                </button>
                <button
                  className={`tab-item ${activeTab === 'scenarios' ? 'active' : ''}`}
                  onClick={() => toggleTab('scenarios')}
                  role="tab"
                  aria-selected={activeTab === 'scenarios'}
                >
                  SCENARIOS
                </button>
                <button
                  className={`tab-item ${activeTab === 'futures' ? 'active' : ''}`}
                  onClick={() => toggleTab('futures')}
                  role="tab"
                  aria-selected={activeTab === 'futures'}
                >
                  COMPARE FUTURES
                </button>
                <button
                  className={`tab-item ${activeTab === 'explanation' ? 'active' : ''}`}
                  onClick={() => toggleTab('explanation')}
                  role="tab"
                  aria-selected={activeTab === 'explanation'}
                >
                  EXPLANATION
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
                      isDimmed={Boolean(data.isDimmed)}
                      showWhyButton={Boolean(data.showWhyButton)}
                      onWhyClick={data.onWhyClick as (() => void) | undefined}
                      stepActive={Boolean(data.stepActive)}
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

            {/* Metric Strip */}
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

            {/* WHY? Panel Drawer */}
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

            {/* Counterfactual Options Panel */}
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

            {/* What Changed Panel */}
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

            {/* Scenarios Management Panel */}
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

            {/* Compare Futures Panel */}
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

            {/* Context Explanation Panel */}
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

      {/* SECTION 02 — DECISIONTWIN CAREER (INTERACTIVE CONCEPT) */}
      <section id="sec-02" data-section="2" className="case-study-section">
        <div className="section-header-block">
          <div className="eyebrow-row">
            <span className="eyebrow">02 / DECISIONTWIN CAREER</span>
            <span className="concept-badge">INTERACTIVE CONCEPT</span>
          </div>
          <h2>CHOOSE A PATH. SEE WHERE IT LEADS.</h2>
          <p className="subtitle">
            Compare Job A vs Job B trade-offs — salary, commute time, learning intensity, relocation, and burnout risk simultaneously over time.
          </p>
        </div>

        {/* Job A vs Job B Quick Presets */}
        <div className="job-toggle-bar">
          <span className="section-label">CAREER OFFERS:</span>
          <button
            className={`job-btn ${selectedJob === 'A' ? 'active' : ''}`}
            onClick={() => switchJob('A')}
          >
            JOB A (High Learning & Hybrid)
          </button>
          <button
            className={`job-btn ${selectedJob === 'B' ? 'active' : ''}`}
            onClick={() => switchJob('B')}
          >
            JOB B (High Pay & Onsite)
          </button>
        </div>

        <div className="case-study-grid">
          <div className="case-controls-panel">
            <span className="section-label">CAREER DECISION INPUTS</span>

            <div className="control-item">
              <div className="control-heading">
                <span>Base Salary Offer</span>
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
                <span>Remote Days / Week</span>
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
                <span>Learning Intensity</span>
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

            <div className="control-item-row">
              <span>Relocation Required?</span>
              <button
                className={`toggle-btn ${careerRelocation ? 'active' : ''}`}
                onClick={() => setCareerRelocation(!careerRelocation)}
              >
                {careerRelocation ? 'YES (Relocate)' : 'NO (Local)'}
              </button>
            </div>

            {/* Timeline Horizon Selector */}
            <div className="horizon-selector">
              <span className="section-label">TIMELINE HORIZON</span>
              <div className="horizon-btn-group">
                <button
                  className={careerTimelineHorizon === 'NOW' ? 'active' : ''}
                  onClick={() => setCareerTimelineHorizon('NOW')}
                >
                  NOW
                </button>
                <button
                  className={careerTimelineHorizon === '2_YEARS' ? 'active' : ''}
                  onClick={() => setCareerTimelineHorizon('2_YEARS')}
                >
                  2 YEARS
                </button>
                <button
                  className={careerTimelineHorizon === '5_YEARS' ? 'active' : ''}
                  onClick={() => setCareerTimelineHorizon('5_YEARS')}
                >
                  5 YEARS
                </button>
              </div>
            </div>
          </div>

          <div className="case-display-panel">
            <span className="section-label">CAUSAL CAREER DEPENDENCY CHAIN</span>
            <div className="career-chain-visual">
              <div className="chain-node">
                <span className="c-lbl">JOB OFFER ({selectedJob})</span>
                <strong className="c-val">${careerSalary.toLocaleString()}</strong>
                <span className="c-sub">{careerWorkHours}h workweek</span>
              </div>
              <span className="c-arrow">→</span>
              <div className="chain-node">
                <span className="c-lbl">NET SAVINGS ({careerTimelineHorizon})</span>
                <strong className="c-val">${careerSavings.toLocaleString()}</strong>
                <span className="c-sub">after taxes & commute</span>
              </div>
              <span className="c-arrow">→</span>
              <div className="chain-node">
                <span className="c-lbl">DISCRETIONARY TIME</span>
                <strong className="c-val">{careerCommuteHours}h commute</strong>
                <span className="c-sub">{careerFreeHours}h free / wk</span>
              </div>
              <span className="c-arrow">→</span>
              <div className="chain-node">
                <span className="c-lbl">COMPOUNDED GROWTH</span>
                <strong className="c-val">+{careerSkillGrowth}% skill index</strong>
                <span className={`risk-tag risk-${careerRisk.toLowerCase()}`}>{careerRisk} BURNOUT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — NOTICE → ACTION (CONCEPT WORKFLOW) */}
      <section id="sec-03" data-section="3" className="case-study-section">
        <div className="section-header-block">
          <div className="eyebrow-row">
            <span className="eyebrow">03 / NOTICE → ACTION</span>
            <span className="concept-badge">CONCEPT WORKFLOW</span>
          </div>
          <h2>TURN INFORMATION INTO ACTION.</h2>
          <p className="subtitle">
            Flow: NOTICE → WHAT? → WHO? → WHEN? → WHERE? → REQUIREMENTS → ACTIONS
          </p>
        </div>

        <div className="notice-concept-container">
          <div className="sample-selector-bar">
            <span>SAMPLE NOTICES:</span>
            <button
              className={`sample-btn ${noticeSampleId === 'assessments' ? 'active' : ''}`}
              onClick={() => loadNoticeSample('assessments')}
            >
              Final Defense
            </button>
            <button
              className={`sample-btn ${noticeSampleId === 'hostel' ? 'active' : ''}`}
              onClick={() => loadNoticeSample('hostel')}
            >
              Hostel Re-allocation
            </button>
            <button
              className={`sample-btn ${noticeSampleId === 'placement' ? 'active' : ''}`}
              onClick={() => loadNoticeSample('placement')}
            >
              Placement Drive
            </button>
          </div>

          <div className="notice-grid">
            {/* Raw Document Metaphor */}
            <div className="notice-doc-card">
              <div className="doc-header">
                <span className="doc-stamp">OFFICIAL DOCUMENT</span>
                <span className="doc-date">OCTOBER 2026</span>
              </div>
              <textarea
                className="notice-textarea"
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                aria-label="Raw notice document text"
              />
              <div className="doc-footer">
                <button
                  className={`eligibility-btn ${isEligibleToggle ? 'active' : ''}`}
                  onClick={() => setIsEligibleToggle(!isEligibleToggle)}
                >
                  {isEligibleToggle ? '✓ I AM ELIGIBLE' : '✗ NOT ELIGIBLE'}
                </button>
              </div>
            </div>

            {/* Transformed Action Checklist & Requirements */}
            <div className="notice-transformed-card">
              <div className="tr-header">
                <span className="section-label">STRUCTURED ACTION SEQUENCE</span>
                <div className="progress-badge">
                  {Object.values(checklistProgress).filter(Boolean).length} / 3 COMPLETE
                </div>
              </div>

              <div className="tr-deadline-box">
                <span className="dl-lbl">DEADLINE COUNTDOWN</span>
                <strong className="dl-val">OCTOBER 15 • 11:59 PM</strong>
                <span className="dl-status">8 DAYS REMAINING</span>
              </div>

              <ul className="action-checklist">
                <li
                  className={`check-item ${checklistProgress.req1 ? 'done' : ''}`}
                  onClick={() =>
                    setChecklistProgress((prev) => ({ ...prev, req1: !prev.req1 }))
                  }
                >
                  <span className="ch-box">{checklistProgress.req1 ? '✓' : '○'}</span>
                  <div>
                    <strong>LaTeX Documentation PDF</strong>
                    <span>Compile architecture & verification report</span>
                  </div>
                </li>

                <li
                  className={`check-item ${checklistProgress.req2 ? 'done' : ''}`}
                  onClick={() =>
                    setChecklistProgress((prev) => ({ ...prev, req2: !prev.req2 }))
                  }
                >
                  <span className="ch-box">{checklistProgress.req2 ? '✓' : '○'}</span>
                  <div>
                    <strong>3-Minute Video Walkthrough</strong>
                    <span>Record feature demonstration & verification</span>
                  </div>
                </li>

                <li
                  className={`check-item ${checklistProgress.req3 ? 'done' : ''}`}
                  onClick={() =>
                    setChecklistProgress((prev) => ({ ...prev, req3: !prev.req3 }))
                  }
                >
                  <span className="ch-box">{checklistProgress.req3 ? '✓' : '○'}</span>
                  <div>
                    <strong>GitHub Tagged Release</strong>
                    <span>Publish release `v1.0.0-final` on main branch</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04 — OPPORTUNITY VERIFICATION (DEMO CHECK) */}
      <section id="sec-04" data-section="4" className="case-study-section">
        <div className="section-header-block">
          <div className="eyebrow-row">
            <span className="eyebrow">04 / OPPORTUNITY VERIFICATION</span>
            <span className="concept-badge">DEMO CHECK</span>
          </div>
          <h2>DON'T TRUST. VERIFY.</h2>
          <p className="subtitle">
            Flow: OPPORTUNITY → SOURCE → ORGANIZATION → CLAIMS → EVIDENCE → CHECKS → VERIFICATION TRAIL
          </p>
        </div>

        <div className="verification-container">
          <div className="ver-inputs-grid">
            <div className="v-field">
              <label>OPPORTUNITY TITLE</label>
              <input
                type="text"
                value={oppName}
                onChange={(e) => setOppName(e.target.value)}
              />
            </div>
            <div className="v-field">
              <label>ORGANIZATION</label>
              <input
                type="text"
                value={oppOrg}
                onChange={(e) => setOppOrg(e.target.value)}
              />
            </div>
            <div className="v-field">
              <label>CLAIMED COMPENSATION</label>
              <input
                type="text"
                value={oppSalary}
                onChange={(e) => setOppSalary(e.target.value)}
              />
            </div>
            <div className="v-field">
              <label>DEADLINE</label>
              <input
                type="text"
                value={oppDeadline}
                onChange={(e) => setOppDeadline(e.target.value)}
              />
            </div>
            <div className="v-field full-width">
              <label>ELIGIBILITY RULE</label>
              <input
                type="text"
                value={oppEligibility}
                onChange={(e) => setOppEligibility(e.target.value)}
              />
            </div>
            <div className="v-field full-width">
              <label>SOURCE URL</label>
              <input
                type="text"
                value={oppUrl}
                onChange={(e) => setOppUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="ver-action-bar">
            <button
              className="ver-run-btn"
              onClick={() => setVerificationActive(!verificationActive)}
            >
              {verificationActive ? 'RE-RUN VERIFICATION CHECKS' : 'RUN AUTHENTICITY CHECKS'}
            </button>
          </div>

          {/* Evidence Trail Breakdown */}
          <div className="opportunity-header-card">
            <div className="opp-meta">
              <span className="opp-badge">EVIDENCE ANALYSIS</span>
              <h3>{oppName} — {oppOrg}</h3>
              <span className="opp-comp">{oppSalary} • {oppEligibility}</span>
            </div>
            <div className="opp-status-pill">
              <span className="live-dot" /> VERIFIED MATCH (94% CONFIDENCE)
            </div>
          </div>

          <div className="evidence-trail-list">
            <div className="trail-item">
              <span className="trail-step">01</span>
              <div className="trail-info">
                <strong>DOMAIN REGISTRATION & AUTHENTICITY</strong>
                <span>Source domain `globaltechlabs.org` • Age: 6.4 Years • SSL Verified</span>
              </div>
              <span className="ver-badge v-pass">✓ VERIFIED</span>
            </div>

            <div className="trail-item">
              <span className="trail-step">02</span>
              <div className="trail-info">
                <strong>CORPORATE REGISTRY & ENTITY SEARCH</strong>
                <span>Entity #9402-A • Registered Corporation in Good Standing</span>
              </div>
              <span className="ver-badge v-pass">✓ VERIFIED</span>
            </div>

            <div className="trail-item">
              <span className="trail-step">03</span>
              <div className="trail-info">
                <strong>COMPENSATION & MARKET BENCHMARK</strong>
                <span>Market Range: $125K–$160K • Listed offer is within expected standard</span>
              </div>
              <span className="ver-badge v-pass">✓ MATCHED</span>
            </div>

            <div className="trail-item">
              <span className="trail-step">04</span>
              <div className="trail-info">
                <strong>ELIGIBILITY & DEADLINE CONSISTENCY</strong>
                <span>Claimed: {oppEligibility} • Source: Matched with university portal guidelines</span>
              </div>
              <span className="ver-badge v-pass">✓ CONSISTENT</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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
