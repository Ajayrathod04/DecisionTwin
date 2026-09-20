from pydantic import BaseModel, Field
from typing import Literal


class DecisionInput(BaseModel):
    demand: float = Field(default=100, ge=0)
    inventory: float = Field(default=60, ge=0)
    capacity: float = Field(default=100, gt=0)
    lead_time: float = Field(default=7, ge=0)


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


