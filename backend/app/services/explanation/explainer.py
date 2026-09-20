import json
import os
import urllib.request
import urllib.error
from app.models.schemas import (
    DecisionExplanation,
    EvidenceTraceItem,
    ExplanationRequest,
)


def build_deterministic_explanation(request: ExplanationRequest) -> DecisionExplanation:
    """Builds a deterministic, contextual explanation directly from simulation results."""
    dec = request.decision
    res = request.result

    demand_val = int(dec.demand) if dec.demand.is_integer() else round(dec.demand, 1)
    cap_val = int(dec.capacity) if dec.capacity.is_integer() else round(dec.capacity, 1)
    inv_val = int(dec.inventory) if dec.inventory.is_integer() else round(dec.inventory, 1)
    lead_val = int(dec.lead_time) if dec.lead_time.is_integer() else round(dec.lead_time, 1)

    util_pct = round(res.utilization * 100, 1)
    overload = max(dec.demand - dec.capacity, 0)
    overload_val = int(overload) if overload.is_integer() else round(overload, 1)

    # 1. What Happened
    if res.risk == "HIGH":
        what_happened = (
            f"The system is operating under severe overload. Requested demand of {demand_val} units "
            f"exceeds processing capacity ({cap_val} units) by {overload_val} units, causing system "
            f"utilization to spike to {util_pct}% and creating a queue delay of {res.delay_days} days "
            f"(up from baseline {lead_val} days). Total estimated cost reached ${res.cost:,.2f}."
        )
    elif res.risk == "MEDIUM":
        what_happened = (
            f"The system is operating at full capacity ({cap_val} units) with 100% utilization. "
            f"Demand of {demand_val} units leaves zero operational buffer margin. Queue delay is maintained "
            f"at baseline {res.delay_days} days with total cost of ${res.cost:,.2f}."
        )
    else:
        what_happened = (
            f"The system is operating within healthy parameters. Incoming demand of {demand_val} units "
            f"is fully served by {cap_val} units capacity, achieving {util_pct}% utilization. "
            f"Inventory buffer remains at {res.projected_inventory} units with ${res.cost:,.2f} total cost."
        )

    # 2. Why It Happened
    if overload > 0:
        why_it_happened = (
            f"Unfulfilled demand ({overload_val} units) could not be processed within standard capacity limits. "
            f"This created a bottleneck in capacity, which depleted inventory down to {res.projected_inventory} units "
            f"and added {round(res.delay_days - dec.lead_time, 1)} extra delay days due to queue accumulation."
        )
    elif dec.demand == dec.capacity:
        why_it_happened = (
            f"Demand exactly matches maximum throughput capacity ({cap_val} units). While no queue overload "
            f"is accumulated, any minor spike in demand will immediately push the system into HIGH risk overload."
        )
    else:
        why_it_happened = (
            f"Demand ({demand_val} units) is below capacity ({cap_val} units), leaving a safety margin of "
            f"{int(dec.capacity - dec.demand)} units ({round((1 - res.utilization) * 100, 1)}% headroom). "
            f"This prevents queue delays and preserves inventory safety stock."
        )

    # 3. Primary Driver
    if overload > 0:
        primary_driver = f"Capacity Bottleneck: Workload demand ({demand_val} units) exceeds capacity ({cap_val} units)."
    elif dec.demand > dec.inventory:
        primary_driver = f"Inventory Deficit: Demand ({demand_val} units) exceeds starting inventory ({inv_val} units)."
    else:
        primary_driver = f"Balanced Input Parameters: Demand ({demand_val} units) is well-matched to capacity ({cap_val} units)."

    # 4. Important Consequence
    if res.risk == "HIGH":
        important_consequence = (
            f"Fulfillment lead time expands by {round(res.delay_days - dec.lead_time, 1)} days ({res.delay_days} total days), "
            f"and total financial penalty cost rises to ${res.cost:,.2f}."
        )
    elif res.risk == "MEDIUM":
        important_consequence = (
            f"System operates with zero safety buffer. Any sudden demand fluctuation will trigger capacity bottlenecks."
        )
    else:
        important_consequence = (
            f"Fulfillment SLA is preserved at standard {res.delay_days} day lead time with minimal financial penalty."
        )

    # 5. Relevant Trade-off
    if res.counterfactuals:
        best_cf = res.counterfactuals[0]
        relevant_trade_off = (
            f"Trade-off: {best_cf.title} ({best_cf.action}) would shift risk to {best_cf.projected_risk}, "
            f"lowering utilization to {round(best_cf.projected_utilization * 100, 1)}% and reducing delay to "
            f"{best_cf.projected_delay_days} days at a projected cost of ${best_cf.projected_cost:,.2f}."
        )
    else:
        relevant_trade_off = (
            f"Trade-off: Maintaining lower inventory risks stockouts if demand rises, whereas expanding capacity "
            f"increases fixed operating cost."
        )

    # Deterministic Facts (Explicitly separated from narrative)
    deterministic_facts = [
        f"Demand: {demand_val} units | Capacity: {cap_val} units | Starting Inventory: {inv_val} units",
        f"Capacity Utilization: {util_pct}% (Overload Threshold: 100.0%)",
        f"Queue Delay: {res.delay_days} days (Base Lead Time: {lead_val} days)",
        f"Projected Ending Inventory: {res.projected_inventory} units",
        f"Calculated Total Cost: ${res.cost:,.2f}",
        f"Engine Risk Assessment: {res.risk} (Bottleneck: {res.bottleneck or 'None'})",
    ]

    # Evidence Source Trace
    evidence_trace = [
        EvidenceTraceItem(
            metric_name="Demand & Capacity",
            exact_value=f"{demand_val} / {cap_val} units",
            source_component="engine.simulation.decision",
            description="Raw user decision inputs evaluated by simulation core.",
        ),
        EvidenceTraceItem(
            metric_name="Capacity Utilization",
            exact_value=f"{util_pct}%",
            source_component="engine.simulation.utilization",
            description="Ratio of demand to capacity limit (demand / capacity).",
        ),
        EvidenceTraceItem(
            metric_name="Queue Delay",
            exact_value=f"{res.delay_days} days",
            source_component="engine.simulation.delay_days",
            description="Calculated fulfillment timeline including bottleneck delay penalties.",
        ),
        EvidenceTraceItem(
            metric_name="Projected Inventory",
            exact_value=f"{res.projected_inventory} units",
            source_component="engine.simulation.projected_inventory",
            description="Ending inventory stock remaining after unfulfilled demand deficit.",
        ),
        EvidenceTraceItem(
            metric_name="Total Cost",
            exact_value=f"${res.cost:,.2f}",
            source_component="engine.simulation.cost",
            description="Financial cost formula accounting for demand, inventory deficit, and overload penalties.",
        ),
        EvidenceTraceItem(
            metric_name="Risk Classification",
            exact_value=f"{res.risk}",
            source_component="engine.simulation.risk",
            description="Deterministic risk tier assigned based on system utilization thresholds.",
        ),
    ]

    return DecisionExplanation(
        provider_used="Deterministic Context Engine Synthesizer",
        is_ai_generated=False,
        what_happened=what_happened,
        why_it_happened=why_it_happened,
        primary_driver=primary_driver,
        important_consequence=important_consequence,
        relevant_trade_off=relevant_trade_off,
        deterministic_facts=deterministic_facts,
        evidence_trace=evidence_trace,
    )


def generate_explanation(request: ExplanationRequest) -> DecisionExplanation:
    """Generates an explanation layer around existing deterministic simulation results.
    
    If an external AI provider API key is set via environment variables (e.g. OPENAI_API_KEY),
    it requests contextual formatting from the provider while maintaining strict exact metric ground truths.
    If no AI provider is configured or an error occurs, it falls back seamlessly to the deterministic synthesizer.
    """
    ai_provider = os.getenv("DECISIONTWIN_AI_PROVIDER", "").lower()
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("DECISIONTWIN_AI_API_KEY")

    if api_key and ai_provider in ["openai", "gemini", "custom"]:
        try:
            # Prepare contextual prompt for LLM provider without letting it alter metrics
            prompt_data = {
                "decision": request.decision.model_dump(),
                "result": request.result.model_dump(exclude={"causal_chain"}),
                "deterministic_summary": request.result.causal_summary,
            }

            headers = {"Content-Type": "application/json"}
            if "openai" in ai_provider or os.getenv("OPENAI_API_KEY"):
                url = os.getenv("DECISIONTWIN_AI_URL", "https://api.openai.com/v1/chat/completions")
                headers["Authorization"] = f"Bearer {api_key}"
                body = {
                    "model": os.getenv("DECISIONTWIN_AI_MODEL", "gpt-4o-mini"),
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are the DecisionTwin Intelligence Context Engine. Your job is to provide concise, "
                                "executive context around deterministic simulation results. You MUST NEVER modify, "
                                "invent, or recalculate numerical simulation results. Return JSON matching keys: "
                                "what_happened, why_it_happened, primary_driver, important_consequence, relevant_trade_off."
                            ),
                        },
                        {"role": "user", "content": json.dumps(prompt_data)},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2,
                }

                req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_json = json.loads(response.read().decode("utf-8"))
                    content = json.loads(res_json["choices"][0]["message"]["content"])
                    
                    fallback = build_deterministic_explanation(request)
                    return DecisionExplanation(
                        provider_used=f"AI Context Engine ({ai_provider.upper()})",
                        is_ai_generated=True,
                        what_happened=content.get("what_happened", fallback.what_happened),
                        why_it_happened=content.get("why_it_happened", fallback.why_it_happened),
                        primary_driver=content.get("primary_driver", fallback.primary_driver),
                        important_consequence=content.get("important_consequence", fallback.important_consequence),
                        relevant_trade_off=content.get("relevant_trade_off", fallback.relevant_trade_off),
                        deterministic_facts=fallback.deterministic_facts,
                        evidence_trace=fallback.evidence_trace,
                    )
        except Exception:
            # Fallback cleanly on network or API failure
            pass

    # Default Deterministic Fallback
    return build_deterministic_explanation(request)
