import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import (
    DecisionExplanation,
    DecisionInput,
    ExplanationRequest,
    FuturesComparisonResult,
    SensitivityAnalysisResult,
    SimulationResult,
)
from app.engine.simulation import analyze_sensitivity, compare_futures, simulate
from app.services.explanation.explainer import generate_explanation

START_TIME = time.time()

app = FastAPI(title="DecisionTwin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_operational_logging(request: Request, call_next):
    start_ts = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_ts) * 1000, 2)
    # Operational metrics logged to stdout for CloudWatch log ingestion
    print(f"[AWS CloudWatch Metrics] method={request.method} path={request.url.path} status={response.status_code} duration_ms={duration_ms}")
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    return response


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "engine": "DecisionTwin Deterministic Causal Core",
        "version": "1.0.0",
        "aws_region": os.getenv("AWS_REGION", "ap-south-1"),
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.post("/simulate", response_model=SimulationResult)
def run_simulation(decision: DecisionInput) -> SimulationResult:
    return simulate(decision)


@app.post("/compare-futures", response_model=FuturesComparisonResult)
def run_compare_futures(scenarios: dict) -> FuturesComparisonResult:
    return compare_futures(scenarios)


@app.post("/explain", response_model=DecisionExplanation)
def explain_decision(req: ExplanationRequest) -> DecisionExplanation:
    return generate_explanation(req)


@app.post("/sensitivity", response_model=SensitivityAnalysisResult)
def run_sensitivity_analysis(decision: DecisionInput) -> SensitivityAnalysisResult:
    return analyze_sensitivity(decision)
