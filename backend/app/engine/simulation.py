import math
from app.models.schemas import CausalStep, CounterfactualOption, DecisionInput, SimulationResult


def simulate(decision: DecisionInput) -> SimulationResult:
    utilization = decision.demand / decision.capacity

    overload = max(decision.demand - decision.capacity, 0)

    projected_inventory = max(
        decision.inventory - overload,
        0,
    )

    delay_days = decision.lead_time + (overload / decision.capacity) * decision.lead_time

    cost = (
        decision.demand * 500
        + max(decision.demand - decision.inventory, 0) * 300
        + overload * 700
    )

    if utilization >= 1.2:
        risk = "HIGH"
    elif utilization >= 1.0:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    bottleneck = "capacity" if overload > 0 else None

    # Deterministic Causal Explanation Generation
    demand_val = int(decision.demand) if decision.demand.is_integer() else round(decision.demand, 1)
    cap_val = int(decision.capacity) if decision.capacity.is_integer() else round(decision.capacity, 1)
    inv_val = int(decision.inventory) if decision.inventory.is_integer() else round(decision.inventory, 1)
    lead_val = int(decision.lead_time) if decision.lead_time.is_integer() else round(decision.lead_time, 1)
    overload_val = int(overload) if overload.is_integer() else round(overload, 1)

    causal_chain: list[CausalStep] = [
        CausalStep(
            step=1,
            label="Demand Level",
            trend="UP" if decision.demand > decision.capacity else ("DOWN" if decision.demand < decision.capacity else "EQUAL"),
            symbol="↑" if decision.demand > decision.capacity else ("↓" if decision.demand < decision.capacity else "="),
            value=f"{demand_val} units",
            detail=f"Requested demand of {demand_val} units vs {cap_val} units capacity limit.",
        ),
        CausalStep(
            step=2,
            label="Capacity Status",
            trend="ALERT" if overload > 0 else ("EQUAL" if decision.demand == decision.capacity else "DOWN"),
            symbol="⚠️" if overload > 0 else "=",
            value="Insufficient" if overload > 0 else ("At Limit" if decision.demand == decision.capacity else "Sufficient"),
            detail=f"Workload exceeds maximum capacity by {overload_val} units." if overload > 0 else "Capacity is sufficient to process incoming demand.",
        ),
        CausalStep(
            step=3,
            label="Utilization",
            trend="UP" if utilization > 1.0 else ("EQUAL" if utilization == 1.0 else "DOWN"),
            symbol="↑" if utilization > 1.0 else ("=" if utilization == 1.0 else "↓"),
            value=f"{round(utilization * 100)}%",
            detail=f"System utilization reaches {round(utilization * 100)}%, creating operational strain." if utilization > 1.0 else f"System operating at healthy {round(utilization * 100)}% utilization.",
        ),
        CausalStep(
            step=4,
            label="Inventory Pressure",
            trend="DOWN" if projected_inventory < decision.inventory else "EQUAL",
            symbol="↓" if projected_inventory < decision.inventory else "=",
            value=f"{round(projected_inventory, 1)} units",
            detail=f"Inventory buffer reduced from {inv_val} to {round(projected_inventory, 1)} units due to {overload_val} unit unfulfilled deficit." if overload > 0 else f"Inventory buffer preserved at {round(projected_inventory, 1)} units.",
        ),
        CausalStep(
            step=5,
            label="Delay Impact",
            trend="UP" if delay_days > decision.lead_time else "EQUAL",
            symbol="↑" if delay_days > decision.lead_time else "=",
            value=f"{round(delay_days, 1)} days",
            detail=f"Queue delay adds {round(delay_days - decision.lead_time, 1)} days on top of base {lead_val} day lead time." if delay_days > decision.lead_time else f"Fulfillment timeline remains at standard {lead_val} day lead time.",
        ),
        CausalStep(
            step=6,
            label="Risk Level",
            trend="ALERT" if risk == "HIGH" else ("UP" if risk == "MEDIUM" else "EQUAL"),
            symbol="⚠️" if risk == "HIGH" else ("↑" if risk == "MEDIUM" else "="),
            value=f"{risk} RISK",
            detail=f"HIGH risk triggered by {round(utilization * 100)}% capacity utilization overload and bottleneck." if risk == "HIGH" else (f"MEDIUM risk due to 100% capacity threshold." if risk == "MEDIUM" else "LOW risk with normal operating parameters."),
        ),
    ]

    if risk == "HIGH":
        causal_summary = (
            f"Demand of {demand_val} units exceeds capacity ({cap_val} units) by {overload_val} units, "
            f"pushing utilization to {round(utilization * 100)}% and adding "
            f"{round(delay_days - decision.lead_time, 1)} days of queue delay with {risk} overall risk."
        )
    elif risk == "MEDIUM":
        causal_summary = (
            f"Demand of {demand_val} units matches available capacity ({cap_val} units), "
            f"resulting in 100% utilization with 0 unit buffer and MEDIUM risk."
        )
    else:
        causal_summary = (
            f"Demand of {demand_val} units is within capacity ({cap_val} units), "
            f"maintaining a healthy {round((1 - utilization) * 100)}% spare buffer and LOW risk."
        )

    # Deterministic Counterfactual Analysis & Bottleneck Recommendations
    counterfactuals: list[CounterfactualOption] = []

    if overload > 0 or utilization >= 1.0:
        rec_cap = float(math.ceil(math.ceil(decision.demand / 0.85) / 5) * 5)
        cap_delta = rec_cap - decision.capacity
        proj_util_1 = decision.demand / rec_cap
        proj_overload_1 = max(decision.demand - rec_cap, 0)
        proj_delay_1 = decision.lead_time + (proj_overload_1 / rec_cap) * decision.lead_time
        proj_cost_1 = (
            decision.demand * 500
            + max(decision.demand - decision.inventory, 0) * 300
            + proj_overload_1 * 700
        )
        proj_risk_1 = "HIGH" if proj_util_1 >= 1.2 else ("MEDIUM" if proj_util_1 >= 1.0 else "LOW")

        counterfactuals.append(
            CounterfactualOption(
                id="opt_capacity",
                title="Expand Operating Capacity",
                action=f"Increase Capacity to {int(rec_cap)} units",
                target_field="capacity",
                recommended_value=rec_cap,
                delta=cap_delta,
                impact_summary=f"Increase capacity by {int(cap_delta)} units to reduce utilization from {round(utilization * 100)}% to {round(proj_util_1 * 100)}% and clear queue delay.",
                projected_risk=proj_risk_1,
                projected_utilization=round(proj_util_1, 4),
                projected_delay_days=round(proj_delay_1, 2),
                projected_cost=round(proj_cost_1, 2),
            )
        )

        rec_demand = float(max(math.floor(math.floor(decision.capacity * 0.95) / 5) * 5, 20))
        demand_delta = rec_demand - decision.demand
        proj_util_2 = rec_demand / decision.capacity
        proj_overload_2 = max(rec_demand - decision.capacity, 0)
        proj_delay_2 = decision.lead_time + (proj_overload_2 / decision.capacity) * decision.lead_time
        proj_cost_2 = (
            rec_demand * 500
            + max(rec_demand - decision.inventory, 0) * 300
            + proj_overload_2 * 700
        )
        proj_risk_2 = "HIGH" if proj_util_2 >= 1.2 else ("MEDIUM" if proj_util_2 >= 1.0 else "LOW")

        counterfactuals.append(
            CounterfactualOption(
                id="opt_demand",
                title="Cap Input Demand",
                action=f"Adjust Demand to {int(rec_demand)} units",
                target_field="demand",
                recommended_value=rec_demand,
                delta=demand_delta,
                impact_summary=f"Cap demand at {int(rec_demand)} units to bring utilization down to {round(proj_util_2 * 100)}% and lower risk level.",
                projected_risk=proj_risk_2,
                projected_utilization=round(proj_util_2, 4),
                projected_delay_days=round(proj_delay_2, 2),
                projected_cost=round(proj_cost_2, 2),
            )
        )

        rec_inv = float(math.ceil(math.ceil(decision.inventory + overload) / 5) * 5)
        inv_delta = rec_inv - decision.inventory
        proj_cost_3 = (
            decision.demand * 500
            + max(decision.demand - rec_inv, 0) * 300
            + overload * 700
        )

        counterfactuals.append(
            CounterfactualOption(
                id="opt_inventory",
                title="Increase Inventory Buffer",
                action=f"Increase Inventory to {int(rec_inv)} units",
                target_field="inventory",
                recommended_value=rec_inv,
                delta=inv_delta,
                impact_summary=f"Add {int(inv_delta)} units of safety stock to absorb unfulfilled demand and prevent inventory exhaustion.",
                projected_risk=risk,
                projected_utilization=round(utilization, 4),
                projected_delay_days=round(delay_days, 2),
                projected_cost=round(proj_cost_3, 2),
            )
        )
    else:
        counterfactuals.append(
            CounterfactualOption(
                id="opt_optimal",
                title="Optimal System Alignment",
                action="Maintain current operational parameters",
                target_field="capacity",
                recommended_value=decision.capacity,
                delta=0,
                impact_summary="Current capacity comfortably satisfies demand with healthy buffer margins.",
                projected_risk="LOW",
                projected_utilization=round(utilization, 4),
                projected_delay_days=round(delay_days, 2),
                projected_cost=round(cost, 2),
            )
        )

    return SimulationResult(
        demand=decision.demand,
        inventory=decision.inventory,
        capacity=decision.capacity,
        lead_time=decision.lead_time,
        utilization=round(utilization, 4),
        projected_inventory=round(projected_inventory, 2),
        delay_days=round(delay_days, 2),
        cost=round(cost, 2),
        risk=risk,
        bottleneck=bottleneck,
        causal_chain=causal_chain,
        causal_summary=causal_summary,
        counterfactuals=counterfactuals,
    )


