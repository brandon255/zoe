// MedStage — Supportive husband / partner figure (clinical, non-sensual)
// Stands beside the patient when invited. Can operate "husband cam"
// into the vaginal canal toward the cervix for training visualization.

import { useMemo } from 'react';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface HusbandFigureProps {
  /** Patient figure — used to scale/place partner beside her */
  patient: PatientFigure;
  visible: boolean;
  /** Holding / aiming a small endoscope camera toward the exam */
  holdingCamera?: boolean;
}

export function HusbandFigure({ patient, visible, holdingCamera = false }: HusbandFigureProps) {
  if (!visible) return null;

  const p = patient.proportions;
  const skin = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c4a07a',
        roughness: 0.55,
        metalness: 0.05,
      }),
    []
  );
  const shirt = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2c3e50',
        roughness: 0.7,
        metalness: 0.05,
      }),
    []
  );
  const pants = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a2332',
        roughness: 0.75,
        metalness: 0.02,
      }),
    []
  );
  const hair = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a1f14',
        roughness: 0.85,
      }),
    []
  );

  // Stand to patient's right, slightly back — supportive presence
  const baseX = 0.55;
  const baseY = -p.footHeight;
  const baseZ = 0.15;
  const scale = 1.02;

  return (
    <group position={[baseX, baseY, baseZ]} scale={scale} name="husband-figure">
      {/* Legs */}
      <mesh position={[-0.1, 0.45, 0]} castShadow material={pants}>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
      </mesh>
      <mesh position={[0.1, 0.45, 0]} castShadow material={pants}>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow material={shirt}>
        <capsuleGeometry args={[0.16, 0.45, 4, 10]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.52, 0]} castShadow material={skin}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      <mesh position={[0, 1.58, -0.02]} material={hair}>
        <sphereGeometry args={[0.125, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      </mesh>
      {/* Arms — left rests; right aims camera when holding */}
      <mesh position={[-0.28, 1.1, 0.05]} rotation={[0.2, 0, 0.4]} castShadow material={shirt}>
        <capsuleGeometry args={[0.045, 0.35, 4, 8]} />
      </mesh>
      <group
        position={[0.28, 1.05, holdingCamera ? 0.18 : 0.05]}
        rotation={holdingCamera ? [-0.9, 0.2, -0.35] : [0.15, 0, -0.35]}
      >
        <mesh castShadow material={shirt}>
          <capsuleGeometry args={[0.045, 0.35, 4, 8]} />
        </mesh>
        {holdingCamera && <EndoscopeCam position={[0, -0.28, 0.02]} />}
      </group>
      {/* Soft label plane facing camera-ish */}
      <group position={[0, 1.75, 0.05]}>
        <mesh>
          <planeGeometry args={[0.35, 0.08]} />
          <meshBasicMaterial color="#0b1220" transparent opacity={0.75} />
        </mesh>
      </group>
    </group>
  );
}

function EndoscopeCam({ position }: { position: [number, number, number] }) {
  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8899aa',
        metalness: 0.7,
        roughness: 0.25,
      }),
    []
  );
  const lens = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#111820',
        metalness: 0.9,
        roughness: 0.15,
      }),
    []
  );
  return (
    <group position={position}>
      <mesh material={body}>
        <cylinderGeometry args={[0.018, 0.02, 0.08, 10]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} material={lens}>
        <sphereGeometry args={[0.016, 12, 12]} />
      </mesh>
      <pointLight position={[0, -0.06, 0]} intensity={0.6} distance={0.4} color="#ffe8d0" />
    </group>
  );
}

/** World-space landmarks for husband-cam flythrough (matches PelvicCavities vaginal canal). */
export function getVaginalCamPath(patient: PatientFigure): {
  entrance: THREE.Vector3;
  mid: THREE.Vector3;
  cervix: THREE.Vector3;
} {
  const p = patient.proportions;
  const startY = p.hipY - 0.18 - p.footHeight;
  const startZ = p.hipDepth * 0.95;
  const length = 0.09;
  const angle = Math.PI / 3;
  // Canal group is at entrance with rotation — approximate deep target toward cervix
  const entrance = new THREE.Vector3(0, startY, startZ + 0.02);
  const cervix = new THREE.Vector3(
    0,
    startY + Math.sin(angle) * length * 0.85,
    startZ - Math.cos(angle) * length * 0.85
  );
  const mid = entrance.clone().lerp(cervix, 0.45);
  return { entrance, mid, cervix };
}
