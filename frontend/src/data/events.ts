import type { EventItem } from '../types/decisiontwin';

export const EVENTS: EventItem[] = [
  {
    id: 'evt-demand-surge',
    title: 'Demand Surge',
    category: 'Market Volatility',
    badge: 'HIGH VOLATILITY',
    image: '/assets/decisiontwin-hero.jpg',
    description: 'Sudden spike in customer order volume exceeding baseline forecast by 45%. Requires immediate buffer evaluation.',
    impact: 'Pushes utilization to 145% and depletes inventory reserve.',
    risk: 'HIGH',
    params: { demand: 145, capacity: 100, inventory: 40, lead_time: 8 }
  },
  {
    id: 'evt-supply-disruption',
    title: 'Supply Disruption',
    category: 'Supply Chain',
    badge: 'CRITICAL BOTTLENECK',
    image: '/assets/decisiontwin-supply.jpg',
    description: 'Upstream vendor failure delays incoming shipment by 9 extra days.',
    impact: 'Inventory drops to safety threshold (25u), triggering stockout risk.',
    risk: 'HIGH',
    params: { demand: 110, capacity: 90, inventory: 25, lead_time: 16 }
  },
  {
    id: 'evt-capacity-constraint',
    title: 'Capacity Constraint',
    category: 'Operations',
    badge: 'PRODUCTION LIMIT',
    image: '/assets/decisiontwin-manufacturing.jpg',
    description: 'Assembly line maintenance cuts daily factory output capacity by 30%.',
    impact: 'Backlog queue builds up, increasing lead time to 9 days.',
    risk: 'HIGH',
    params: { demand: 120, capacity: 70, inventory: 50, lead_time: 9 }
  },
  {
    id: 'evt-market-entry',
    title: 'Market Entry',
    category: 'Growth',
    badge: 'EXPANSION PHASE',
    image: '/assets/decisiontwin-market.jpg',
    description: 'New regional channel expansion adds baseline order volume.',
    impact: 'Requires 130u capacity allocation to maintain 95% service level.',
    risk: 'MEDIUM',
    params: { demand: 130, capacity: 125, inventory: 85, lead_time: 7 }
  },
  {
    id: 'evt-regulatory-change',
    title: 'Regulatory Change',
    badge: 'COMPLIANCE MANDATE',
    category: 'Governance',
    image: '/assets/decisiontwin-logistics.jpg',
    description: 'New cross-border customs inspection protocols add 4 days to freight transit.',
    impact: 'Lead time extends to 12 days; inventory holding costs increase.',
    risk: 'MEDIUM',
    params: { demand: 105, capacity: 105, inventory: 70, lead_time: 12 }
  },
  {
    id: 'evt-sustainability-push',
    title: 'Sustainability Push',
    badge: 'GREEN TRANSITION',
    category: 'ESG Strategy',
    image: '/assets/decisiontwin-energy.jpg',
    description: 'Transition to green logistics fleets and renewable factory power.',
    impact: 'Marginal unit cost increase offset by lower long-term disruption risk.',
    risk: 'LOW',
    params: { demand: 95, capacity: 100, inventory: 65, lead_time: 6 }
  },
  {
    id: 'evt-cost-shock',
    title: 'Cost Shock',
    badge: 'FINANCIAL IMPACT',
    category: 'Finance',
    image: '/assets/decisiontwin-career.jpg',
    description: 'Inflationary surge in raw material tariffs and logistics rates.',
    impact: 'Unit cost rises from $500 to $720; total cost increases by 40%.',
    risk: 'MEDIUM',
    params: { demand: 115, capacity: 110, inventory: 50, lead_time: 8 }
  },
  {
    id: 'evt-logistics-delay',
    title: 'Logistics Delay',
    badge: 'TRANSPORT HOLD',
    category: 'Logistics',
    image: '/assets/decisiontwin-logistics.jpg',
    description: 'Port congestion delays container discharge by 6 days.',
    impact: 'In-transit inventory stalls, reducing effective available stock.',
    risk: 'MEDIUM',
    params: { demand: 105, capacity: 95, inventory: 35, lead_time: 13 }
  },
  {
    id: 'evt-energy-shock',
    title: 'Energy Shock',
    badge: 'UTILITY SURGE',
    category: 'Infrastructure',
    image: '/assets/decisiontwin-energy.jpg',
    description: 'Regional grid power surge increases peak industrial electricity tariffs.',
    impact: 'Production operating cost increases by 25%.',
    risk: 'MEDIUM',
    params: { demand: 100, capacity: 95, inventory: 55, lead_time: 7 }
  },
  {
    id: 'evt-workforce-constraint',
    title: 'Workforce Constraint',
    badge: 'LABOR SHORTAGE',
    category: 'Operations',
    image: '/assets/decisiontwin-career.jpg',
    description: 'Shift staffing deficit limits multi-shift production throughput.',
    impact: 'Capacity drops to 75 units/day.',
    risk: 'HIGH',
    params: { demand: 110, capacity: 75, inventory: 45, lead_time: 10 }
  },
  {
    id: 'evt-supplier-failure',
    title: 'Supplier Failure',
    badge: 'VENDOR OUTAGE',
    category: 'Supply Chain',
    image: '/assets/decisiontwin-supply.jpg',
    description: 'Tier-1 component supplier files for emergency bankruptcy.',
    impact: 'Primary replenishment route halted; backup vendor lead time is 18 days.',
    risk: 'HIGH',
    params: { demand: 120, capacity: 80, inventory: 20, lead_time: 18 }
  },
  {
    id: 'evt-forecast-shift',
    title: 'Forecast Shift',
    badge: 'ANALYTICS REVISION',
    category: 'Planning',
    image: '/assets/decisiontwin-hero.jpg',
    description: 'Quarterly predictive analytics update revises market demand downward.',
    impact: 'Overstock risk if capacity remains unadjusted.',
    risk: 'LOW',
    params: { demand: 75, capacity: 110, inventory: 90, lead_time: 5 }
  }
];
