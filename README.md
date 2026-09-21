# DecisionTwin — Living 3D Decision Interface

> **See what happens before you commit.**  
> DecisionTwin is a deterministic decision laboratory that renders non-linear causal chains in 3D spatial networks.

---

## 🌟 Key Highlights & Core Workflows

1. **01 Decision Room & 3D Spatial Causal Graph**:
   - Parametric controls across 14 operational variables (Demand, Capacity, Inventory, Lead Time, Cost per Unit, Service Level, Disruption Risk, etc.).
   - Interactive 3D spatial graph rendered with Three.js, React Three Fiber, and Drei featuring orbital node relations, animated bezier curve link connections, glowing node states, and WebGL 2D fallback.
   - Deterministic `WHY DID THIS HAPPEN?` causal trace panel detailing primary drivers, key consequences, and trade-offs.

2. **Sticky Scenario Storytelling**:
   - Pinned visual showcase displaying active operational shocks (`Demand Surge`, `Supply Disruption`, `Capacity Constraint`, `New Market Entry`, `Regulatory Change`, `Sustainability Push`, `Cost Shock`) with direct simulation triggers.

3. **03 Notice → Action Transformer**:
   - Parses official notices, extracts deadlines & penalty constraints into an active task queue, and features a 12-item circular radial event catalog (`EXPLORE EVENTS`).

4. **02 Career Twin**:
   - Multi-dimensional path visualizer balancing salary, remote flexibility, work hours, learning density, relocation, and time horizon (`NOW`, `2Y`, `5Y`) with burnout risk calculations.

5. **04 Opportunity Verification & Local Problem Router**:
   - Evaluates opportunity parameters against explicit evidence trail checks (`VERIFIED FROM CONFIGURED SOURCE`, `USER-SUPPLIED DATA`, `CHECK SOURCE TIMETABLE`, `INSUFFICIENT EVIDENCE`).
   - Local problem router guide matching plain text queries to target workflows.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Three.js, `@react-three/fiber`, `@react-three/drei`, GSAP, ScrollTrigger, Lenis.
- **Backend API**: Python 3.12, FastAPI, Pydantic v2, Uvicorn.
- **AWS Infrastructure**: AWS Elastic Beanstalk (`ap-south-1`), CloudWatch.

---

## ☁️ Live AWS Deployment

- **Live Backend API**: `http://decisiontwin-api.eba-pzpi4y9c.ap-south-1.elasticbeanstalk.com`
- **Health Check**: `http://decisiontwin-api.eba-pzpi4y9c.ap-south-1.elasticbeanstalk.com/health`

---

## ⚙️ Local Setup & Running Instructions

### 1. Backend (Python FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Verification & Testing Commands

### Backend Python Tests
```bash
cd backend
python -m unittest discover -s tests
```

### Frontend Typecheck & Production Build
```bash
cd frontend
npx tsc -b --pretty false
npm run build
```

---

## 📜 Architecture & Roadmap
For a detailed mathematical explanation of simulation formulas and AWS deployment architecture, read [`docs/ARCHITECTURE.md`](file:///d:/FirstCommit/DecisionTwin/docs/ARCHITECTURE.md).
