import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import DecisionInput, ExplanationRequest
from app.engine.simulation import simulate
from app.services.explanation.explainer import generate_explanation


class TestExplanationService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_explanation_service_unit(self):
        decision = DecisionInput(demand=120, capacity=100, inventory=60, lead_time=7)
        res = simulate(decision)
        req = ExplanationRequest(decision=decision, result=res)

        explanation = generate_explanation(req)

        self.assertFalse(explanation.is_ai_generated)
        self.assertEqual(explanation.provider_used, "Deterministic Context Engine Synthesizer")
        self.assertTrue("120 units" in explanation.what_happened)
        self.assertGreaterEqual(len(explanation.deterministic_facts), 5)
        self.assertEqual(len(explanation.evidence_trace), 6)

        sources = [item.source_component for item in explanation.evidence_trace]
        self.assertIn("engine.simulation.decision", sources)
        self.assertIn("engine.simulation.utilization", sources)
        self.assertIn("engine.simulation.cost", sources)

    def test_explain_api_endpoint(self):
        decision = DecisionInput(demand=80, capacity=100, inventory=60, lead_time=7)
        res = simulate(decision)
        payload = {
            "decision": decision.model_dump(),
            "result": res.model_dump(),
        }

        response = self.client.post("/explain", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("what_happened", data)
        self.assertIn("why_it_happened", data)
        self.assertIn("primary_driver", data)
        self.assertIn("important_consequence", data)
        self.assertIn("relevant_trade_off", data)
        self.assertIn("deterministic_facts", data)
        self.assertIn("evidence_trace", data)
        self.assertIsInstance(data["evidence_trace"], list)

    def test_existing_simulate_and_compare_futures_endpoints(self):
        sim_res = self.client.post("/simulate", json={"demand": 100, "capacity": 100, "inventory": 60, "lead_time": 7})
        self.assertEqual(sim_res.status_code, 200)
        sim_data = sim_res.json()
        self.assertEqual(sim_data["utilization"], 1.0)

        scenarios = {
            "A": {"demand": 100, "capacity": 100, "inventory": 60, "lead_time": 7, "result": sim_data},
            "B": {"demand": 120, "capacity": 100, "inventory": 60, "lead_time": 7, "result": sim_data},
        }
        comp_res = self.client.post("/compare-futures", json=scenarios)
        self.assertEqual(comp_res.status_code, 200)
        comp_data = comp_res.json()
        self.assertEqual(len(comp_data["rows"]), 10)


if __name__ == "__main__":
    unittest.main()
