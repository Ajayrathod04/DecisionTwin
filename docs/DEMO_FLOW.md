# DecisionTwin — 3-Minute Hackathon Demo Script & Workflow Guide

This document outlines the step-by-step demonstration walkthrough for DecisionTwin, designed for video recording and hackathon judging evaluation.

---

## FLOW 1: Baseline Simulation & Causal Explanation

### Action
1. Open the **Decision Room** (`/#room`).
2. Adjust input parameters:
   - **Demand**: `1,200 units`
   - **Inventory**: `800 units`
   - **Capacity**: `1,000 units`
   - **Lead Time**: `7 days`
3. Click **"Run Simulation"**.

### Expected Result
- Simulation executes via live AWS endpoint `POST /simulate` (or local fallback if offline).
- Output metrics update deterministically:
  - **Fulfillment Rate**: `66.7%`
  - **Stockout Risk**: `HIGH`
  - **Bullwhip Ratio**: `1.38x`
- Causal explanation appears detailing why demand exceeds stock plus capacity during lead time.

---

## FLOW 2: Stress Scenario & Changed Assumptions

### Action
1. Increase **Disruption Risk** slider to `45%`.
2. Increase **Logistics Delay** to `5 days`.
3. Lower **Supplier Reliability** to `70%`.
4. Click **"Run Simulation"**.

### Expected Result
- Metrics shift dramatically:
  - Stockout risk increases.
  - Recommended Safety Stock auto-adjusts upward from `250 units` to `480 units`.
- System triggers a **Stress Warning Banner** indicating supply chain vulnerability.

---

## FLOW 3: Scenario Identity, Persistence & Comparison

### Action
1. Enter scenario name: `"Q4 Disruption Surge"`.
2. Click **"Save Scenario"**.
3. Inspect saved scenario badge displaying deterministic scenario ID (e.g., `scen_1726920000_a1b2`).
4. Click **"Compare Scenarios"** (`/#compare`).
5. Select **Baseline Scenario** vs **"Q4 Disruption Surge"**.

### Expected Result
- Side-by-side comparison matrix opens.
- Highlights metric delta: fulfillment rate difference ($\Delta -22.5\%$), cost impact ($\Delta +\$14,200$).
- Scenario persists across page browser refreshes (`F5`).

---

## FLOW 4: Notice → Action Workflow

### Action
1. Navigate to **Notice → Action** (`/#notice`).
2. Select or paste operational notice text:
   > *"Port congestion in Rotterdam delaying container dispatch by 14 days. Penalty of $5,000/day for delayed delivery."*
3. Click **"Transform to Action Plan"**.

### Expected Result
- Parser extracts:
  - Target disruption event: **Logistics Delay / Port Congestion**.
  - Delay parameter: `+14 days`.
  - Penalty risk: `$5,000/day`.
- Auto-configures parameters and presents button: **"Transfer Parameters to Decision Room"**.

---

## FLOW 5: Opportunity Verification

### Action
1. Navigate to **Verify Section** (`/#verify`).
2. Inspect claim verification panel for supplier capacity claim:
   > *"Supplier X promises 99.5% delivery SLA with 2-day lead time."*
3. Click **"Verify Claim"**.

### Expected Result
- Engine evaluates claim against historical distribution bounds and physical capacity laws.
- Returns honest confidence rating:
  - Status: **`CHECK SOURCE TIMETABLE`** or **`USER-SUPPLIED DATA`**.
  - Explains physical constraint bottleneck (e.g., lead time of 2 days violates 5-day transit floor).

---

## FLOW 6: Sensitivity Lab & Assumption Inspection

### Action
1. Navigate to **Sensitivity Lab** within the Decision Room.
2. Select parameter sweep target: **Demand** vs **Lead Time**.
3. Click **"Run Sensitivity Analysis"**.
4. Open **Assumption Inspector** drawer.

### Expected Result
- Multi-curve graph displays outcome variations across $\pm 50\%$ parameter bounds.
- Assumption Inspector itemizes all active assumptions:
  - Source tags: `USER_INPUT`, `SYSTEM_DEFAULT`, `DERIVED`.
  - Impact rating: `CRITICAL`, `MODERATE`, `LOW`.

---

## FLOW 7: AWS Infrastructure & Health Evidence

### Action
1. Open terminal or browser tab to:
   `http://decisiontwin-api.eba-pzpi4y9c.ap-south-1.elasticbeanstalk.com/health`
2. Inspect operational JSON response.

### Expected Result
```json
{
  "status": "ok",
  "environment": "production",
  "aws_region": "ap-south-1",
  "version": "1.0.0",
  "engine": "deterministic_v1",
  "timestamp": 1726920000
}
```
- Confirms production backend is live, health-checked, and emitting structured JSON CloudWatch logs with response time headers (`X-Response-Time`).
