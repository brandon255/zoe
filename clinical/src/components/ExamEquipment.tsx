// MedStage — Exam equipment for encounter simulation
// Procedural 3D models of standard OB/GYN exam equipment that appear
// during the appropriate phase of the patient encounter.
//
// Equipment list:
//   - GlovedHand: doctor's hand wearing exam gloves
//   - Speculum: Pederson/Graves duck-bill speculum
//   - Forceps: ring forceps with sponge holder
//   - CytoBrush + AyreSpatula: for Pap smear
//   - Lubricant: small tube
//   - Drape: sterile drape over patient's thighs
//   - ExamLight: focused light source
//
// All equipment is procedural (cylinders, capsules, boxes) and stylized.
// Designed to be replaceable with real GLB models later.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

export type ExamTool =
  | 'gloves'
  | 'speculum'
  | 'speculum_open'
  | 'cytobrush'
  | 'spatula'
  | 'forceps'
  | 'lubricant'
  | 'drape'
  | 'light'
  | 'gauze';

interface ExamEquipmentProps {
  figure: PatientFigure;
  /** Set of currently active tools (from encounter state) */
  activeTools: Set<ExamTool>;
  /** Endoscope mode - affects speculum position */
  endoscopeView?: 'vaginal' | 'rectal' | null;
}

// Reference body landmark positions (matches PatientFigure proportions)
function getLandmarks(p: PatientFigure['proportions']) {
  return {
    head: [0, p.headY, 0] as [number, number, number],
    shoulders: [0, p.shoulderY, 0] as [number, number, number],
    chest: [0, p.chestY, 0] as [number, number, number],
    waist: [0, p.waistY, 0] as [number, number, number],
    hips: [0, p.hipY, 0] as [number, number, number],
    pelvis: [0, p.hipY, 0] as [number, number, number],
    perineum: [0, p.hipY - 0.1, p.hipDepth / 2 + 0.05] as [number, number, number],
    feet: [0, p.footHeight, 0] as [number, number, number],
  };
}

export function ExamEquipment({ figure, activeTools, endoscopeView }: ExamEquipmentProps) {
  const p = figure.proportions;
  const lm = getLandmarks(p);

  return (
    <group>
      {activeTools.has('gloves') && (
        <GlovedHand position={[-0.35, lm.pelvis[1] - 0.1, 0.4]} rotation={[0, 0, 0.3]} />
      )}
      {activeTools.has('gloves') && (
        <GlovedHand position={[0.35, lm.pelvis[1] - 0.1, 0.4]} rotation={[0, 0, -0.3]} />
      )}

      {activeTools.has('drape') && (
        <Drape position={lm.pelvis} proportions={p} />
      )}

      {activeTools.has('speculum') && !activeTools.has('speculum_open') && (
        <Speculum
          position={[0, lm.perineum[1] - 0.02, lm.perineum[2] + 0.04]}
          rotation={[0, 0, 0]}
          open={false}
        />
      )}

      {activeTools.has('speculum_open') && (
        <Speculum
          position={[0, lm.perineum[1] - 0.02, lm.perineum[2] + 0.04]}
          rotation={[0, 0, 0]}
          open={true}
        />
      )}

      {activeTools.has('cytobrush') && (
        <CytoBrush
          position={[-0.15, lm.perineum[1] - 0.03, lm.perineum[2] + 0.06]}
          rotation={[0.3, 0, 0.2]}
        />
      )}

      {activeTools.has('spatula') && (
        <Spatula
          position={[0.15, lm.perineum[1] - 0.03, lm.perineum[2] + 0.06]}
          rotation={[0.3, 0, -0.2]}
        />
      )}

      {activeTools.has('forceps') && (
        <RingForceps
          position={[-0.25, lm.perineum[1] - 0.05, lm.perineum[2] + 0.04]}
          rotation={[0, 0, 0.4]}
        />
      )}

      {activeTools.has('lubricant') && (
        <Lubricant position={[0.3, lm.waist[1] + 0.1, 0.3]} />
      )}

      {activeTools.has('light') && (
        <ExamLight target={lm.perineum} />
      )}

      {activeTools.has('gauze') && (
        <GauzeStack position={[0.3, lm.waist[1] + 0.05, 0.32]} />
      )}
    </group>
  );
}

// ===== Individual equipment pieces =====

function GlovedHand({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  // Procedural doctor's hand wearing exam gloves
  // Light blue nitrile glove material
  const gloveMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#a8c8e0',
        roughness: 0.4,
        metalness: 0.0,
        sheen: 0.6,
        sheenColor: new THREE.Color('#cce0f0'),
        sheenRoughness: 0.4,
        clearcoat: 0.3,
        clearcoatRoughness: 0.3,
      }),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Forearm */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.028, 0.18, 12]} />
        <primitive object={gloveMat} attach="material" />
      </mesh>
      {/* Wrist cuff (slightly larger) */}
      <mesh position={[0, 0.21, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.025, 0.02, 12]} />
        <primitive object={gloveMat} attach="material" />
      </mesh>
      {/* Palm */}
      <mesh position={[0, 0.0, 0]} scale={[1, 1.2, 0.6]} castShadow>
        <sphereGeometry args={[0.035, 12, 8]} />
        <primitive object={gloveMat} attach="material" />
      </mesh>
      {/* Thumb */}
      <mesh position={[0.025, 0.02, 0.015]} rotation={[0, 0, 0.6]} castShadow>
        <capsuleGeometry args={[0.012, 0.04, 4, 8]} />
        <primitive object={gloveMat} attach="material" />
      </mesh>
      {/* Fingers (4) */}
      {[-0.018, -0.006, 0.006, 0.018].map((x, i) => (
        <mesh
          key={i}
          position={[x, -0.05, 0.005]}
          rotation={[0.1, 0, 0]}
          castShadow
        >
          <capsuleGeometry args={[0.009, 0.05, 4, 8]} />
          <primitive object={gloveMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Speculum({
  position,
  rotation,
  open,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  open: boolean;
}) {
  // Pederson speculum - stainless steel duck-bill
  // Two blades that open when "open the speculum" is said
  const metalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d8d8e0',
        roughness: 0.2,
        metalness: 0.9,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
      }),
    []
  );

  const handleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#404048',
        roughness: 0.4,
        metalness: 0.7,
      }),
    []
  );

  const openAmount = open ? 0.04 : 0.012;

  return (
    <group position={position} rotation={rotation}>
      {/* Lower blade (posterior) */}
      <mesh position={[0, 0, -openAmount]} rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.13, 0.018]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      {/* Upper blade (anterior) */}
      <mesh position={[0, 0, openAmount]} rotation={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.13, 0.018]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      {/* Hinge area (where blades meet) */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      {/* Handle (bottom) */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.06, 12]} />
        <primitive object={handleMat} attach="material" />
      </mesh>
      {/* Thumb screw (the lever that opens the blades) */}
      <mesh position={[0, -0.08, 0.018]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.025, 8]} />
        <primitive object={handleMat} attach="material" />
      </mesh>
    </group>
  );
}

function CytoBrush({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  // Cytobrush - small brush for endocervical sampling
  const handleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.6 }),
    []
  );
  const brushMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a0a0a8', roughness: 0.5 }),
    []
  );
  return (
    <group position={position} rotation={rotation}>
      {/* Handle */}
      <mesh castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 8]} />
        <primitive object={handleMat} attach="material" />
      </mesh>
      {/* Brush tip */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <coneGeometry args={[0.008, 0.02, 8]} />
        <primitive object={brushMat} attach="material" />
      </mesh>
    </group>
  );
}

function Spatula({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  // Ayre spatula - wooden spatula for ectocervical sampling
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d4a574', roughness: 0.7 }),
    []
  );
  return (
    <group position={position} rotation={rotation}>
      {/* Handle */}
      <mesh castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.13, 8]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      {/* Spatula end (asymmetric) */}
      <mesh position={[0, 0.075, 0]} scale={[1, 1, 0.3]} castShadow>
        <sphereGeometry args={[0.012, 8, 6]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
    </group>
  );
}

function RingForceps({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  // OB/GYN ring forceps (sponge forceps)
  // Has finger rings at one end, jaws at the other
  const metalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#c0c0c8',
        roughness: 0.2,
        metalness: 0.9,
        clearcoat: 0.5,
      }),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 8]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      {/* Jaws (split ends) */}
      <mesh position={[0, 0.085, 0.005]} rotation={[0, 0, 0.05]} castShadow>
        <cylinderGeometry args={[0.005, 0.008, 0.04, 8]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.085, -0.005]} rotation={[0, 0, -0.05]} castShadow>
        <cylinderGeometry args={[0.005, 0.008, 0.04, 8]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      {/* Ring handle */}
      <mesh position={[0, -0.09, 0]} castShadow>
        <torusGeometry args={[0.018, 0.004, 8, 16]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
    </group>
  );
}

function Lubricant({ position }: { position: [number, number, number] }) {
  // Small tube of sterile lubricant
  const tubeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f0f0e8', roughness: 0.5 }),
    []
  );
  const capMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.4 }),
    []
  );
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
        <primitive object={tubeMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, 0.015, 12]} />
        <primitive object={capMat} attach="material" />
      </mesh>
    </group>
  );
}

function Drape({
  position,
  proportions,
}: {
  position: [number, number, number];
  proportions: PatientFigure['proportions'];
}) {
  // Sterile drape - paper or fabric, often blue or light teal
  const drapeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#7a9bb8',
        roughness: 0.8,
        side: THREE.DoubleSide,
      }),
    []
  );
  return (
    <group position={position}>
      {/* Drape sheet - covers thighs */}
      <mesh
        position={[0, -0.05, 0.05]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[proportions.shoulderWidth * 0.7, 1, proportions.thighLength * 0.8]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.6, 0.02, 0.5]} />
        <primitive object={drapeMat} attach="material" />
      </mesh>
    </group>
  );
}

function ExamLight({ target }: { target: [number, number, number] }) {
  // Focused exam light pointing at target
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.target = targetRef.current;
    }
  });

  return (
    <group>
      {/* Light source housing */}
      <mesh position={[0, 1.2, 0.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Light cone (visualization) */}
      <mesh position={[0, 0.7, 0.3]} rotation={[Math.PI / 2.5, 0, 0]}>
        <coneGeometry args={[0.15, 0.6, 12, 1, true]} />
        <meshBasicMaterial color="#fff8d0" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      <spotLight
        ref={lightRef}
        position={[0, 1.2, 0.5]}
        angle={0.3}
        penumbra={0.3}
        intensity={2.5}
        color="#fff5d0"
        castShadow
      />
      <primitive ref={targetRef} object={targetRef.current} position={target} />
    </group>
  );
}

function GauzeStack({ position }: { position: [number, number, number] }) {
  // Stack of gauze pads
  const gauzeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f8f4ec', roughness: 0.9 }),
    []
  );
  return (
    <group position={position}>
      {[0, 0.005, 0.01].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.04, 0.005, 0.04]} />
          <primitive object={gauzeMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
