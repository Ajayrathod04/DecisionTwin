import math
from app.models.schemas import (
    CausalStep,
    CounterfactualOption,
    DecisionInput,
    FuturesComparisonResult,
    MetricComparisonRow,
    MetricDelta,
    SimulationResult,
    StateChange,
)



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

    # Deterministic WHAT CHANGED? State Comparison
    prev = decision.previous_state
    if not prev:
        state_change = StateChange(
            has_previous=False,
            summary="Initial baseline simulation. Re-run with updated inputs to track state changes.",
            deltas=[],
        )
    else:
        deltas: list[MetricDelta] = []
        change_highlights: list[str] = []

        def add_num_delta(name: str, prev_val: float, curr_val: float, unit: str = "", format_currency: bool = False, invert_impact: bool = False):
            diff = curr_val - prev_val
            if abs(diff) < 1e-6:
                direction = "UNCHANGED"
                impact = "NEUTRAL"
                delta_str = "="
            elif diff > 0:
                direction = "INCREASE"
                impact = "NEGATIVE" if invert_impact else "POSITIVE"
                delta_str = f"+{f'${diff:,.2f}' if format_currency else f'{round(diff, 2)}{unit}'}"
            else:
                direction = "DECREASE"
                impact = "POSITIVE" if invert_impact else "NEGATIVE"
                delta_str = f"-{f'${abs(diff):,.2f}' if format_currency else f'{round(abs(diff), 2)}{unit}'}"

            p_str = f"${prev_val:,.2f}" if format_currency else f"{round(prev_val, 2)}{unit}"
            c_str = f"${curr_val:,.2f}" if format_currency else f"{round(curr_val, 2)}{unit}"

            deltas.append(
                MetricDelta(
                    name=name,
                    previous=p_str,
                    current=c_str,
                    delta=delta_str,
                    direction=direction,
                    impact=impact,
                )
            )

            if direction != "UNCHANGED":
                change_highlights.append(f"{name} changed by {delta_str}")

        prev_demand = float(prev.get("demand", decision.demand))
        prev_inventory = float(prev.get("inventory", decision.inventory))
        prev_capacity = float(prev.get("capacity", decision.capacity))
        prev_lead = float(prev.get("lead_time", decision.lead_time))
        prev_util = float(prev.get("utilization", utilization))
        prev_proj_inv = float(prev.get("projected_inventory", projected_inventory))
        prev_delay = float(prev.get("delay_days", delay_days))
        prev_cost = float(prev.get("cost", cost))
        prev_risk = str(prev.get("risk", risk))
        prev_bottleneck = prev.get("bottleneck")

        add_num_delta("Demand", prev_demand, decision.demand, " units")
        add_num_delta("Capacity", prev_capacity, decision.capacity, " units")
        add_num_delta("Inventory", prev_inventory, decision.inventory, " units")
        add_num_delta("Lead Time", prev_lead, decision.lead_time, " days")
        add_num_delta("Utilization", round(prev_util * 100, 1), round(utilization * 100, 1), "%", invert_impact=True)
        add_num_delta("Projected Inventory", prev_proj_inv, projected_inventory, " units")
        add_num_delta("Queue Delay", prev_delay, delay_days, " days", invert_impact=True)
        add_num_delta("Est. Cost", prev_cost, cost, format_currency=True, invert_impact=True)

        if prev_risk != risk:
            risk_impact = "NEGATIVE" if (risk == "HIGH" or (risk == "MEDIUM" and prev_risk == "LOW")) else "POSITIVE"
            deltas.append(
                MetricDelta(
                    name="Risk Level",
                    previous=prev_risk,
                    current=risk,
                    delta=f"{prev_risk} → {risk}",
                    direction="SHIFT",
                    impact=risk_impact,
                )
            )
            change_highlights.append(f"Risk level shifted from {prev_risk} to {risk}")
        else:
            deltas.append(
                MetricDelta(
                    name="Risk Level",
                    previous=prev_risk,
                    current=risk,
                    delta="=",
                    direction="UNCHANGED",
                    impact="NEUTRAL",
                )
            )

        p_b = str(prev_bottleneck) if prev_bottleneck else "None"
        c_b = str(bottleneck) if bottleneck else "None"
        if p_b != c_b:
            deltas.append(
                MetricDelta(
                    name="Bottleneck",
                    previous=p_b,
                    current=c_b,
                    delta=f"{p_b} → {c_b}",
                    direction="SHIFT",
                    impact="NEGATIVE" if c_b != "None" else "POSITIVE",
                )
            )
            change_highlights.append(f"Bottleneck status changed from {p_b} to {c_b}")
        else:
            deltas.append(
                MetricDelta(
                    name="Bottleneck",
                    previous=p_b,
                    current=c_b,
                    delta="=",
                    direction="UNCHANGED",
                    impact="NEUTRAL",
                )
            )

        if change_highlights:
            summary_str = " | ".join(change_highlights[:3])
        else:
            summary_str = "No metric changes detected between simulation runs."

        state_change = StateChange(
            has_previous=True,
            summary=summary_str,
            deltas=deltas,
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
        state_change=state_change,
    )


def compare_futures(scenarios: dict) -> FuturesComparisonResult:
    slots = [s for s in ["A", "B", "C"] if s in scenarios and scenarios[s]]
    if len(slots) < 2:
        return FuturesComparisonResult(
            active_slots=slots,
            summary="Save at least 2 scenarios (e.g. Scenario A and Scenario B) to compare future decision trade-offs side-by-side.",
            rows=[],
        )

    sc_a = scenarios.get("A")
    sc_b = scenarios.get("B")
    sc_c = scenarios.get("C")

    rows: list[MetricComparisonRow] = []

    def get_val(sc, key, subkey=None):
        if not sc:
            return None
        if subkey:
            return sc.get(key, {}).get(subkey)
        return sc.get(key)

    def format_num(val, unit="", is_curr=False):
        if val is None:
            return "-"
        f_val = float(val)
        return f"${f_val:,.2f}" if is_curr else f"{round(f_val, 2)}{unit}"

    def calc_diff(val_target, val_ref, unit="", is_curr=False):
        if val_target is None or val_ref is None:
            return "-"
        diff = float(val_target) - float(val_ref)
        if abs(diff) < 1e-6:
            return "="
        elif diff > 0:
            return f"+{f'${diff:,.2f}' if is_curr else f'{round(diff, 2)}{unit}'}"
        else:
            return f"-{f'${abs(diff):,.2f}' if is_curr else f'{round(abs(diff), 2)}{unit}'}"

    metrics = [
        ("Demand", "demand", None, " units", False, False),
        ("Capacity", "capacity", None, " units", False, False),
        ("Inventory", "inventory", None, " units", False, False),
        ("Lead Time", "lead_time", None, " days", False, False),
        ("Utilization", "result", "utilization", "%", False, True),
        ("Projected Inventory", "result", "projected_inventory", " units", False, False),
        ("Queue Delay", "result", "delay_days", " days", False, False),
        ("Est. Cost", "result", "cost", "", True, False),
        ("Risk Level", "result", "risk", "", False, False),
        ("Bottleneck", "result", "bottleneck", "", False, False),
    ]

    for name, key, subkey, unit, is_curr, is_mult in metrics:
        v_a_raw = get_val(sc_a, key, subkey)
        v_b_raw = get_val(sc_b, key, subkey)
        v_c_raw = get_val(sc_c, key, subkey)

        if is_mult:
            v_a_num = float(v_a_raw * 100) if v_a_raw is not None else None
            v_b_num = float(v_b_raw * 100) if v_b_raw is not None else None
            v_c_num = float(v_c_raw * 100) if v_c_raw is not None else None
        else:
            v_a_num = v_a_raw
            v_b_num = v_b_raw
            v_c_num = v_c_raw

        if isinstance(v_a_num, (int, float)):
            v_a = format_num(v_a_num, unit, is_curr)
            v_b = format_num(v_b_num, unit, is_curr) if v_b_num is not None else "-"
            v_c = format_num(v_c_num, unit, is_curr) if v_c_num is not None else "-"
            diff_b = calc_diff(v_b_num, v_a_num, unit, is_curr) if v_b_num is not None else "-"
            diff_c = calc_diff(v_c_num, v_a_num, unit, is_curr) if v_c_num is not None else "-"
        else:
            v_a = str(v_a_num) if v_a_num is not None else "-"
            v_b = str(v_b_num) if v_b_num is not None else "-"
            v_c = str(v_c_num) if v_c_num is not None else "-"
            diff_b = f"{v_a} → {v_b}" if (v_b != "-" and v_b != v_a) else "="
            diff_c = f"{v_a} → {v_c}" if (v_c != "-" and v_c != v_a) else "="

        rows.append(
            MetricComparisonRow(
                name=name,
                unit=unit,
                val_a=v_a,
                val_b=v_b,
                val_c=v_c,
                diff_b_vs_a=diff_b,
                diff_c_vs_a=diff_c,
            )
        )

    summary_parts = [f"Comparing {len(slots)} saved future scenarios ({', '.join(slots)})."]

    if sc_a and sc_b:
        risk_a = get_val(sc_a, "result", "risk")
        risk_b = get_val(sc_b, "result", "risk")
        cost_a = get_val(sc_a, "result", "cost")
        cost_b = get_val(sc_b, "result", "cost")
        delay_a = get_val(sc_a, "result", "delay_days")
        delay_b = get_val(sc_b, "result", "delay_days")
        if cost_a is not None and cost_b is not None:
            summary_parts.append(
                f"Scenario B vs A: Cost change is {calc_diff(cost_b, cost_a, is_curr=True)}, "
                f"Delay change is {calc_diff(delay_b, delay_a, unit=' days')}, Risk: {risk_a} → {risk_b}."
            )

    if sc_a and sc_c:
        risk_a = get_val(sc_a, "result", "risk")
        risk_c = get_val(sc_c, "result", "risk")
        cost_a = get_val(sc_a, "result", "cost")
        cost_c = get_val(sc_c, "result", "cost")
        delay_a = get_val(sc_a, "result", "delay_days")
        delay_c = get_val(sc_c, "result", "delay_days")
        if cost_a is not None and cost_c is not None:
            summary_parts.append(
                f"Scenario C vs A: Cost change is {calc_diff(cost_c, cost_a, is_curr=True)}, "
                f"Delay change is {calc_diff(delay_c, delay_a, unit=' days')}, Risk: {risk_a} → {risk_c}."
            )

    return FuturesComparisonResult(
        active_slots=slots,
        summary=" | ".join(summary_parts),
        rows=rows,
    )




