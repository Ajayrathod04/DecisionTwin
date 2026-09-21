import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import DecisionInput
from app.engine.simulation import simulate, analyze_sensitivity


class TestSimulationEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_baseline_simulation(self):
        dec = DecisionInput(demand=100, capacity=100, inventory=60, lead_time=7)
        res = simulate(dec)
        self.assertEqual(res.utilization, 1.0)
        self.assertEqual(res.delay_days, 7.0)
        self.assertEqual(res.risk, "MEDIUM")
        self.assertGreaterEqual(len(res.assumptions), 5)

    def test_boundary_inputs(self):
        dec_zero = DecisionInput(demand=0, capacity=50, inventory=10, lead_time=1)
        res_zero = simulate(dec_zero)
        self.assertEqual(res_zero.utilization, 0.0)
        self.assertEqual(res_zero.risk, "LOW")

        dec_high = DecisionInput(demand=200, capacity=50, inventory=0, lead_time=10, disruption_risk=80)
        res_high = simulate(dec_high)
        self.assertGreater(res_high.utilization, 2.0)
        self.assertEqual(res_high.risk, "HIGH")
        self.assertEqual(res_high.bottleneck, "capacity")

    def test_sensitivity_analysis_engine(self):
        dec = DecisionInput(demand=120, capacity=100, inventory=50, lead_time=7)
        sens_res = analyze_sensitivity(dec)
        self.assertGreaterEqual(len(sens_res.sensitivities), 5)
        self.assertIn("title", sens_res.multi_variable_stress)
        self.assertIn("risk_shift", sens_res.multi_variable_stress)

    def test_all_api_endpoints(self):
        # 1. Health
        h_res = self.client.get("/health")
        self.assertEqual(h_res.status_code, 200)
        self.assertEqual(h_res.json()["status"], "ok")

        # 2. Simulate
        s_res = self.client.post("/simulate", json={"demand": 110, "capacity": 100, "inventory": 50, "lead_time": 7})
        self.assertEqual(s_res.status_code, 200)
        s_data = s_res.json()
        self.assertIn("utilization", s_data)
        self.assertIn("assumptions", s_data)

        # 3. Explain
        e_res = self.client.post("/explain", json={"decision": {"demand": 110, "capacity": 100, "inventory": 50, "lead_time": 7}, "result": s_data})
        self.assertEqual(e_res.status_code, 200)
        self.assertIn("primary_driver", e_res.json())

        # 4. Sensitivity
        sens_api = self.client.post("/sensitivity", json={"demand": 110, "capacity": 100, "inventory": 50, "lead_time": 7})
        self.assertEqual(sens_api.status_code, 200)
        self.assertIn("sensitivities", sens_api.json())


if __name__ == "__main__":
    unittest.main()
