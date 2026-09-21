# DecisionTwin — Architectural Deep Dive for Hackathon Judging

## 1. System Philosophy & Core Problem

DecisionTwin is built to eliminate **isolated decision-making**. In complex physical, operational, and career systems, changing one assumption propagates through inter-dependent variables, often causing non-linear side effects.

DecisionTwin provides a **living 3D decision laboratory** that allows users to move variables, run deterministic simulations, inspect causal chains, and compare future scenarios side-by-side.

---

## 2. Technical Architecture & Component Hierarchy

```mermaid
graph TD
    Client[React + Vite + TypeScript Frontend] -->|REST API| AWS_EB[AWS Elastic Beanstalk API Engine]
    Client -->|Local Fallback| LocalEngine[Frontend Deterministic Engine]
    
    subgraph Frontend Architecture
        Client --> Hero[Hero & DragDeck]
        Client --> Room[Decision Room & 3D Spatial Graph]
        Client --> Sticky[Sticky Scenario Showcase]
        Client --> Notice[Notice Transformer & Radial Catalog]
        Client --> Career[Career Twin Simulator]
        Client --> Verify[Opportunity Verification & Local Router]
    end
    
    subgraph AWS Cloud Infrastructure (ap-south-1)
        AWS_EB --> FastAPI[FastAPI Application Server]
        FastAPI --> SimCore[Deterministic Simulation Core]
        FastAPI --> Explainer[Causal Explanation Synthesizer]
        FastAPI --> Compare[Futures Comparison Engine]
    end
```

---

## 3. Mathematical Simulation Formulas

### Primary Equations
1. **Effective Capacity**:
   $$\text{Capacity}_{\text{effective}} = \max\left(\text{Capacity} \times \frac{\text{Workforce}}{100}, 1.0\right)$$

2. **Capacity Utilization**:
   $$U = \frac{\text{Demand}}{\text{Capacity}_{\text{effective}}}$$

3. **System Overload Deficit**:
   $$\text{Overload} = \max(\text{Demand} - \text{Capacity}_{\text{effective}}, 0)$$

4. **Projected Inventory Stock**:
   $$\text{Inventory}_{\text{proj}} = \max(\text{Inventory} - \text{Overload}, 0)$$

5. **Queue Delay Days**:
   $$\text{Delay} = \text{LeadTime} + \left(\frac{\text{Overload}}{\text{Capacity}_{\text{effective}}}\right) \times \text{LeadTime} + \text{LogisticsDelay}$$

6. **Total Projected Cost**:
   $$\text{Cost} = (\text{Demand} \times \text{CostPerUnit}) + \max(\text{Demand} - \text{Inventory}, 0) \times 300 + (\text{Overload} \times 700)$$

7. **Risk Classification**:
   - `HIGH`: If $U \ge 1.25$ or Disruption Risk $\ge 75\%$
   - `MEDIUM`: If $U \ge 1.00$ or Disruption Risk $\ge 45\%$
   - `LOW`: Otherwise

---

## 4. API Endpoints Reference

- **`GET /health`**: Health status check. Returns `{"status": "ok"}`.
- **`POST /simulate`**: Executes deterministic simulation for input decisions.
- **`POST /explain`**: Generates a 6-part causal trace explanation and evidence trail items.
- **`POST /compare-futures`**: Generates side-by-side trade-off metrics comparing saved scenario slots (`A`, `B`, `C`).

---

## 5. Live AWS Cloud Deployment

- **Hosting**: AWS Elastic Beanstalk
- **Region**: `ap-south-1` (Mumbai)
- **Live Backend Endpoint**: `http://decisiontwin-api.eba-pzpi4y9c.ap-south-1.elasticbeanstalk.com`
- **Observability**: CloudWatch log streams for HTTP request logs and error monitoring.
