import type { ScenarioItem } from '../types/decisiontwin';

export const SCENARIOS: ScenarioItem[] = [
  {
    id: 'demand-surge',
    title: 'Demand Surge',
    subtitle: 'UNEXPECTED ORDER SPIKE',
    category: 'Market Volatility',
    image: '/assets/decisiontwin-hero.jpg',
    description: 'Demand spikes by +45% while lead times widen. Without immediate capacity headroom, inventory depletes rapidly and delay risks escalate.',
    impactSummary: 'Utilization spikes to 145%, driving high delay risk and inventory drain.',
    riskLevel: 'HIGH',
    preset: {
      demand: 145,
      capacity: 100,
      inventory: 40,
      lead_time: 10,
      disruption_risk: 65,
      cost_per_unit: 580
    },
    causalChain: [
      { node: 'Demand', effect: '+45% Order Volume' },
      { node: 'Capacity', effect: '145% Utilization Deficit' },
      { node: 'Inventory', effect: 'Depletes to 40u Safety Limit' },
      { node: 'Service Level', effect: 'Drops from 98% to 82%' }
    ]
  },
  {
    id: 'supply-disruption',
    title: 'Supply Disruption',
    subtitle: 'RAW MATERIAL BOTTLENECK',
    category: 'Supply Chain',
    image: '/assets/decisiontwin-supply.jpg',
    description: 'Major supplier failure delays replenishment lead times by +100%, causing stockouts across downstream distribution hubs.',
    impactSummary: 'Replenishment halts for 14 days, driving inventory down and backlog cost up.',
    riskLevel: 'HIGH',
    preset: {
      demand: 110,
      capacity: 90,
      inventory: 25,
      lead_time: 16,
      supplier_reliability: 40,
      disruption_risk: 85
    },
    causalChain: [
      { node: 'Supplier Reliability', effect: 'Falls to 40%' },
      { node: 'Lead Time', effect: 'Doubles to 16 Days' },
      { node: 'Inventory', effect: 'Critical Stockout (25u)' },
      { node: 'Cost', effect: 'Expedited Freight Surcharge' }
    ]
  },
  {
    id: 'capacity-constraint',
    title: 'Capacity Constraint',
    subtitle: 'LINE BREAKDOWN & MAINTENANCE',
    category: 'Operations',
    image: '/assets/decisiontwin-manufacturing.jpg',
    description: 'Workforce shortage and machine downtime reduce effective factory output capacity by 30% during peak quarter.',
    impactSummary: 'Production bottleneck creates 8.5 days of order queue delay.',
    riskLevel: 'HIGH',
    preset: {
      demand: 120,
      capacity: 70,
      inventory: 50,
      lead_time: 9,
      workforce_capacity: 60,
      service_level: 80
    },
    causalChain: [
      { node: 'Workforce Capacity', effect: 'Reduced to 60%' },
      { node: 'Production Capacity', effect: 'Drops to 70u/day' },
      { node: 'Logistics', effect: 'Backlog Queue Builds Up' },
      { node: 'Risk', effect: 'Escalates to HIGH' }
    ]
  },
  {
    id: 'market-shift',
    title: 'New Market Entry',
    subtitle: 'REGIONAL EXPANSION VOLATILITY',
    category: 'Growth',
    image: '/assets/decisiontwin-market.jpg',
    description: 'Opening a new distribution channel increases baseline demand growth while requiring higher safety buffer allocations.',
    impactSummary: 'Market growth pushes demand to 130u, requiring proactive capacity scaling.',
    riskLevel: 'MEDIUM',
    preset: {
      demand: 130,
      capacity: 125,
      inventory: 85,
      lead_time: 7,
      market_growth: 35,
      forecast_confidence: 75
    },
    causalChain: [
      { node: 'Market Growth', effect: '+35% Expansion Rate' },
      { node: 'Demand', effect: 'Ramps to 130u' },
      { node: 'Safety Stock', effect: 'Buffers Expansion Volatility' },
      { node: 'Capacity', effect: 'Operates at 96% Headroom' }
    ]
  },
  {
    id: 'regulatory-change',
    title: 'Regulatory Change',
    subtitle: 'COMPLIANCE & INSPECTION HOLD',
    category: 'Governance',
    image: '/assets/decisiontwin-logistics.jpg',
    description: 'New cross-border customs regulations inject mandatory inspection holds into international freight routes.',
    impactSummary: 'Logistics delays increase by 4 days, elevating holding costs.',
    riskLevel: 'MEDIUM',
    preset: {
      demand: 105,
      capacity: 105,
      inventory: 70,
      lead_time: 12,
      logistics_delay: 4,
      cost_per_unit: 540
    },
    causalChain: [
      { node: 'Logistics Delay', effect: '+4 Days Hold Time' },
      { node: 'Lead Time', effect: 'Stretches to 12 Days' },
      { node: 'Inventory Cost', effect: '+18% Holding Charge' },
      { node: 'Service Level', effect: 'Maintained at 91%' }
    ]
  },
  {
    id: 'sustainability-push',
    title: 'Sustainability Push',
    subtitle: 'GREEN TRANSITION & ENERGY SHIFT',
    category: 'ESG Strategy',
    image: '/assets/decisiontwin-energy.jpg',
    description: 'Transitioning to renewable grid sources lowers carbon intensity while temporarily increasing baseline energy tariffs.',
    impactSummary: 'Energy cost increases unit production cost by 15%, offset by lower risk.',
    riskLevel: 'LOW',
    preset: {
      demand: 95,
      capacity: 100,
      inventory: 65,
      lead_time: 6,
      energy_cost: 135,
      cost_per_unit: 590
    },
    causalChain: [
      { node: 'Energy Cost', effect: '+35% Renewable Tariff' },
      { node: 'Cost per Unit', effect: 'Adjusted to $590' },
      { node: 'Logistics', effect: 'Clean Fleet Route Optimized' },
      { node: 'Risk', effect: 'Stabilizes at LOW' }
    ]
  },
  {
    id: 'cost-shock',
    title: 'Cost Shock',
    subtitle: 'INFLATIONARY INPUT SPIKE',
    category: 'Finance',
    image: '/assets/decisiontwin-career.jpg',
    description: 'Sudden price increases in raw materials and freight tariffs compress operational margins and increase working capital pressure.',
    impactSummary: 'Total projected cost increases by 40% under sustained demand.',
    riskLevel: 'MEDIUM',
    preset: {
      demand: 115,
      capacity: 110,
      inventory: 50,
      lead_time: 8,
      cost_per_unit: 720,
      disruption_risk: 50
    },
    causalChain: [
      { node: 'Cost per Unit', effect: 'Spikes to $720/u' },
      { node: 'Projected Cost', effect: 'Surges to $82,800' },
      { node: 'Capacity', effect: 'Constrained by Working Capital' },
      { node: 'Service Level', effect: 'Marginally Reduced' }
    ]
  }
];
