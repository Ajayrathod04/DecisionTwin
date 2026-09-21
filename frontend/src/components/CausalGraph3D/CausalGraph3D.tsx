import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { SimulationResult } from '../../types/decisiontwin';
import { CausalGraphFallback } from './CausalGraphFallback';

type Node3D = {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  getValue: (res: SimulationResult) => string;
  getUnit: (res: SimulationResult) => string;
  isCore?: boolean;
};

const NODES_DATA: Node3D[] = [
  {
    id: 'supply_chain',
    name: 'Supply Chain',
    category: 'NEXUS CORE',
    position: [0, 0, 0],
    getValue: () => 'NEXUS',
    getUnit: () => 'System Core',
    isCore: true,
  },
  {
    id: 'demand',
    name: 'Demand',
    category: 'INPUT',
    position: [-3.8, 2.2, 1.2],
    getValue: (r) => `${r.demand}`,
    getUnit: () => 'units',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    category: 'BUFFER',
    position: [-3.8, -2.2, 1.2],
    getValue: (r) => `${Math.round(r.projected_inventory)}`,
    getUnit: () => 'proj. units',
  },
  {
    id: 'capacity',
    name: 'Capacity',
    category: 'RESOURCE',
    position: [0, 3.2, -1.5],
    getValue: (r) => `${r.capacity}`,
    getUnit: () => 'capacity units',
  },
  {
    id: 'production',
    name: 'Production',
    category: 'OPERATIONS',
    position: [0, -3.2, -1.5],
    getValue: (r) => `${Math.round(r.utilization * 100)}%`,
    getUnit: () => 'utilization',
  },
  {
    id: 'logistics',
    name: 'Logistics',
    category: 'TRANSIT',
    position: [3.8, 2.2, 1.2],
    getValue: (r) => `${r.lead_time} d`,
    getUnit: () => 'lead time',
  },
  {
    id: 'cost',
    name: 'Cost',
    category: 'FINANCIAL',
    position: [3.8, -2.2, 1.2],
    getValue: (r) => `$${Math.round(r.cost / 1000)}k`,
    getUnit: () => 'projected cost',
  },
  {
    id: 'service_level',
    name: 'Service Level',
    category: 'CONSEQUENCE',
    position: [5.5, 0, 0],
    getValue: (r) => `${r.delay_days.toFixed(1)} d`,
    getUnit: (r) => `delay (${r.risk})`,
  },
];

const CONNECTIONS: [string, string][] = [
  ['demand', 'supply_chain'],
  ['inventory', 'supply_chain'],
  ['capacity', 'supply_chain'],
  ['supply_chain', 'production'],
  ['supply_chain', 'logistics'],
  ['production', 'cost'],
  ['logistics', 'service_level'],
  ['cost', 'service_level'],
];

function ParticleFlow({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(Math.random());

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * 0.8) % 1;
    if (meshRef.current) {
      meshRef.current.position.x = start[0] + (end[0] - start[0]) * progress.current;
      meshRef.current.position.y = start[1] + (end[1] - start[1]) * progress.current;
      meshRef.current.position.z = start[2] + (end[2] - start[2]) * progress.current;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function GraphScene({
  result,
  activeStep,
  hoveredNode,
  setHoveredNode,
}: {
  result: SimulationResult;
  activeStep: number;
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
}) {
  const riskColor = useMemo(() => {
    return result.risk === 'HIGH' ? '#ff5d5d' : result.risk === 'MEDIUM' ? '#f4b860' : '#00f2fe';
  }, [result.risk]);

  const nodePosMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    NODES_DATA.forEach((n) => map.set(n.id, n.position));
    return map;
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#00f2fe" distance={10} />

      {/* Orbit Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        autoRotate={!hoveredNode}
        autoRotateSpeed={0.8}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 4}
      />

      {/* Nodes */}
      {NODES_DATA.map((node) => {
        const isHovered = hoveredNode === node.id;
        const color = node.isCore ? '#00f2fe' : isHovered ? '#6ee7a7' : riskColor;

        return (
          <Float key={node.id} speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
            <group position={node.position}>
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredNode(node.id);
                }}
                onPointerOut={() => setHoveredNode(null)}
              >
                <sphereGeometry args={[node.isCore ? 0.6 : 0.42, 32, 32]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={isHovered ? 0.8 : node.isCore ? 0.5 : 0.3}
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>

              {/* Glowing ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[node.isCore ? 0.7 : 0.5, node.isCore ? 0.85 : 0.6, 32]} />
                <meshBasicMaterial color={color} transparent opacity={isHovered ? 0.8 : 0.35} side={THREE.DoubleSide} />
              </mesh>

              {/* Label */}
              <Html position={[0, node.isCore ? -1.0 : -0.8, 0]} center distanceFactor={12}>
                <div className={`node-3d-label ${isHovered ? 'is-hovered' : ''} ${node.isCore ? 'is-core' : ''}`}>
                  <span className="node-3d-cat">{node.category}</span>
                  <b className="node-3d-title">{node.name}</b>
                  <strong className="node-3d-val">{node.getValue(result)}</strong>
                  <small className="node-3d-unit">{node.getUnit(result)}</small>
                </div>
              </Html>
            </group>
          </Float>
        );
      })}

      {/* Connections & Flow */}
      {CONNECTIONS.map(([fromId, toId]) => {
        const start = nodePosMap.get(fromId);
        const end = nodePosMap.get(toId);
        if (!start || !end) return null;

        const isRelated = hoveredNode === fromId || hoveredNode === toId;
        const lineColor = isRelated ? '#6ee7a7' : riskColor;
        const activePropagating = activeStep > 0;

        return (
          <React.Fragment key={`${fromId}-${toId}`}>
            <Line
              points={[start, end]}
              color={lineColor}
              lineWidth={isRelated ? 3 : 1.5}
              transparent
              opacity={isRelated ? 0.95 : 0.55}
            />
            <ParticleFlow start={start} end={end} color={activePropagating ? '#00f2fe' : lineColor} />
            {activePropagating && <ParticleFlow start={start} end={end} color="#6ee7a7" />}
          </React.Fragment>
        );
      })}
    </>
  );
}

type CausalGraph3DProps = {
  result: SimulationResult;
  activeStep: number;
  onWhy: () => void;
  compact?: boolean;
};

export const CausalGraph3D: React.FC<CausalGraph3DProps> = ({ result, activeStep, onWhy }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  if (hasWebGLError) {
    return <CausalGraphFallback result={result} activeStep={activeStep} onWhy={onWhy} />;
  }

  return (
    <div className="causal-graph-3d-container">
      <div className="graph-3d-hud">
        <div className="hud-badge">
          <span className="pulse-dot" />
          <span>3D SPATIAL CAUSAL GRAPH</span>
        </div>
        <div className="hud-controls">
          <span>DRAG TO ROTATE • HOVER NODES TO INSPECT</span>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        onError={() => setHasWebGLError(true)}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
      >
        <GraphScene
          result={result}
          activeStep={activeStep}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
        />
      </Canvas>

      <div className="graph-3d-footer">
        <div className="graph-legend">
          <span><i className="dot cyan" /> NEXUS CORE</span>
          <span><i className="dot amber" /> SYSTEM STATE</span>
          <span><i className="dot lime" /> DYNAMIC CONSEQUENCE</span>
        </div>
        <button className="btn-trace-3d" onClick={onWhy}>
          TRACE EXPLANATION ↗
        </button>
      </div>
    </div>
  );
};
