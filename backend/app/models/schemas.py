from pydantic import BaseModel, Field
from typing import Literal


class DecisionInput(BaseModel):
    demand: float = Field(default=100, ge=0)
    inventory: float = Field(default=60, ge=0)
    capacity: float = Field(default=100, gt=0)
    lead_time: float = Field(default=7, ge=0)
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




