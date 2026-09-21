from pydantic import BaseModel, Field
from typing import Literal
class DecisionInput(BaseModel):
    demand: float = Field(default=100, ge=0)
    inventory: float = Field(default=60, ge=0)
    capacity: float = Field(default=100, gt=0)
    lead_time: float = Field(default=7, ge=0)
    cost_per_unit: float = Field(default=500, ge=0)
    service_level: float = Field(default=95, ge=0, le=100)
    market_growth: float = Field(default=10)
    disruption_risk: float = Field(default=25, ge=0, le=100)
    supplier_reliability: float = Field(default=90, ge=0, le=100)
    logistics_delay: float = Field(default=0, ge=0)
    workforce_capacity: float = Field(default=100, ge=0, le=100)
    energy_cost: float = Field(default=100, ge=0)
    safety_stock: float = Field(default=30, ge=0)
    forecast_confidence: float = Field(default=90, ge=0, le=100)
    previous_state: dict | None = Field(default=None)
class CausalStep(BaseModel):
    step: int
    label: str
    trend: Literal["UP", "DOWN", "EQUAL", "ALERT"]
    symbol: str
    value: str
    detail: str
class CounterfactualOption(BaseModel):
    id: str
    title: str
    action: str
    target_field: Literal["capacity", "demand", "inventory", "lead_time"]
    recommended_value: float
    delta: float
    impact_summary: str
    projected_risk: Literal["LOW", "MEDIUM", "HIGH"]
    projected_utilization: float
    projected_delay_days: float
    projected_cost: float
class MetricDelta(BaseModel):
    name: str
    previous: str
    current: str
    delta: str
    direction: Literal["INCREASE", "DECREASE", "UNCHANGED", "SHIFT"]
    impact: Literal["POSITIVE", "NEGATIVE", "NEUTRAL"]
class StateChange(BaseModel):
    has_previous: bool
    summary: str
    deltas: list[MetricDelta]
class MetricComparisonRow(BaseModel):
    name: str
    unit: str
    val_a: str | None = None
    val_b: str | None = None
    val_c: str | None = None
    diff_b_vs_a: str | None = None
    diff_c_vs_a: str | None = None
class FuturesComparisonResult(BaseModel):
    active_slots: list[str]
    summary: str
    rows: list[MetricComparisonRow]
class AssumptionItem(BaseModel):
    name: str
    value: str
    unit: str
    source: Literal["USER_INPUT", "SYSTEM_DEFAULT", "DERIVED", "FALLBACK"]
    impact_level: Literal["HIGH", "MEDIUM", "LOW"]
    uncertainty_pct: float
    effect_description: str

class SensitivityPoint(BaseModel):
    param_value: float
    utilization: float
    delay_days: float
    cost: float
    risk: Literal["LOW", "MEDIUM", "HIGH"]

class ParameterSensitivity(BaseModel):
    param_name: str
    base_value: float
    unit: str
    impact_direction: Literal["INCREASING_RISK", "DECREASING_RISK", "STABLE"]
    impact_magnitude: Literal["HIGH", "MODERATE", "LOW"]
    sweep_points: list[SensitivityPoint]

class SensitivityAnalysisResult(BaseModel):
    base_decision: DecisionInput
    base_result: SimulationResult
    sensitivities: list[ParameterSensitivity]
    multi_variable_stress: dict

class SimulationResult(BaseModel):
    demand: float
    inventory: float
    capacity: float
    lead_time: float
    utilization: float
    projected_inventory: float
    delay_days: float
    cost: float
    risk: Literal["LOW", "MEDIUM", "HIGH"]
    bottleneck: str | None
    causal_chain: list[CausalStep]
    causal_summary: str
    counterfactuals: list[CounterfactualOption]
    state_change: StateChange
    assumptions: list[AssumptionItem] = Field(default_factory=list)

class EvidenceTraceItem(BaseModel):
    metric_name: str
    exact_value: str
    source_component: str
    description: str

class DecisionExplanation(BaseModel):
    provider_used: str
    is_ai_generated: bool
    what_happened: str
    why_it_happened: str
    primary_driver: str
    important_consequence: str
    relevant_trade_off: str
    deterministic_facts: list[str]
    evidence_trace: list[EvidenceTraceItem]

class ExplanationRequest(BaseModel):
    decision: DecisionInput
    result: SimulationResult
    scenarios: dict | None = Field(default=None)
