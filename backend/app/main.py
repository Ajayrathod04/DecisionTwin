from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import DecisionInput, FuturesComparisonResult, SimulationResult
from app.engine.simulation import compare_futures, simulate

app = FastAPI(title="DecisionTwin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/simulate", response_model=SimulationResult)
def run_simulation(decision: DecisionInput) -> SimulationResult:
    return simulate(decision)


@app.post("/compare-futures", response_model=FuturesComparisonResult)
def run_compare_futures(scenarios: dict) -> FuturesComparisonResult:
    return compare_futures(scenarios)

