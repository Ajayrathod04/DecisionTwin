export type Risk = 'LOW' | 'MEDIUM' | 'HIGH';
export type ScenarioSlot = 'A' | 'B' | 'C';

export type CausalStep = {
  step: number;
  label: string;
  trend: 'UP' | 'DOWN' | 'EQUAL' | 'ALERT';
  symbol: string;
  value: string;
  detail: string;
};

export type CounterfactualOption = {
  id: string;
  title: string;
  action: string;
  target_field: 'capacity' | 'demand' | 'inventory' | 'lead_time';
  recommended_value: number;
  delta: number;
  impact_summary: string;
  projected_risk: Risk;
  projected_utilization: number;
  projected_delay_days: number;
  projected_cost: number;
};

export type MetricDelta = {
  name: string;
  previous: string;
  current: string;
  delta: string;
  direction: 'INCREASE' | 'DECREASE' | 'UNCHANGED' | 'SHIFT';
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
};

export type AssumptionItem = {
  name: string;
  value: string;
  unit: string;
  source: 'USER_INPUT' | 'SYSTEM_DEFAULT' | 'DERIVED' | 'FALLBACK';
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW';
  uncertainty_pct: number;
  effect_description: string;
};

export type SensitivityPoint = {
  param_value: number;
  utilization: number;
  delay_days: number;
  cost: number;
  risk: Risk;
};

export type ParameterSensitivity = {
  param_name: string;
  base_value: number;
  unit: string;
  impact_direction: 'INCREASING_RISK' | 'DECREASING_RISK' | 'STABLE';
  impact_magnitude: 'HIGH' | 'MODERATE' | 'LOW';
  sweep_points: SensitivityPoint[];
};

export type SensitivityAnalysisResult = {
  base_decision: ExtendedParams;
  base_result: SimulationResult;
  sensitivities: ParameterSensitivity[];
  multi_variable_stress: {
    title: string;
    description: string;
    stress_decision: Record<string, number>;
    stress_result: Record<string, number | string>;
    delta_cost: number;
    delta_delay: number;
    risk_shift: string;
  };
};

export type SimulationResult = {
  demand: number;
  inventory: number;
  capacity: number;
  lead_time: number;
  utilization: number;
  projected_inventory: number;
  delay_days: number;
  cost: number;
  risk: Risk;
  bottleneck: string | null;
  causal_chain: CausalStep[];
  causal_summary: string;
  counterfactuals: CounterfactualOption[];
  state_change: {
    has_previous: boolean;
    summary: string;
    deltas: MetricDelta[];
  };
  assumptions?: AssumptionItem[];
};

export type ScenarioSnapshot = {
  id?: string;
  slot: ScenarioSlot;
  name: string;
  demand: number;
  inventory: number;
  capacity: number;
  lead_time: number;
  result: SimulationResult;
  savedAt: string;
  createdAt?: string;
  sourceState?: 'AWS_API' | 'LOCAL_FALLBACK';
  assumptions?: AssumptionItem[];
};

export type ComparisonRow = {
  name: string;
  unit: string;
  val_a: string | null;
  val_b: string | null;
  val_c: string | null;
  diff_b_vs_a: string | null;
  diff_c_vs_a: string | null;
};

export type FuturesComparison = {
  active_slots: string[];
  summary: string;
  rows: ComparisonRow[];
};

export type Explanation = {
  provider_used: string;
  is_ai_generated: boolean;
  what_happened: string;
  why_it_happened: string;
  primary_driver: string;
  important_consequence: string;
  relevant_trade_off: string;
  deterministic_facts: string[];
  evidence_trace: {
    metric_name: string;
    exact_value: string;
    source_component: string;
    description: string;
  }[];
};

export type ExtendedParams = {
  demand: number;
  inventory: number;
  capacity: number;
  lead_time: number;
  cost_per_unit: number;
  service_level: number;
  market_growth: number;
  disruption_risk: number;
  supplier_reliability: number;
  logistics_delay: number;
  workforce_capacity: number;
  energy_cost: number;
  safety_stock: number;
  forecast_confidence: number;
};

export type GuideDoc = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  action: string;
  href: string;
};

export type ScenarioItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  description: string;
  impactSummary: string;
  riskLevel: Risk;
  preset: Partial<ExtendedParams>;
  causalChain: { node: string; effect: string }[];
};

export type EventItem = {
  id: string;
  title: string;
  category: string;
  badge: string;
  image: string;
  description: string;
  impact: string;
  risk: Risk;
  params: Partial<ExtendedParams>;
};
