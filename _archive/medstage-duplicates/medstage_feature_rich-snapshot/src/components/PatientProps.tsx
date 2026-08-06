// MedStage — Patient props (figure-aware)
// Glasses, stethoscope, sandwich, clipboard. All positions are computed from
// the figure's proportions so they sit correctly on any body type.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface PatientGlassesProps {
  attached: boolean;
  figure: PatientFigure;
}

/** Procedural eyeglasses. Attached = on the face. Detached = floats to the side. */
export function PatientGlasses({ attached, figure }: PatientGlassesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const p = figure.proportions;
  const faceScale = p.headRadius / 0.115; // scale relative to default

  // Attached position: on the face, at eye level
  const faceY = p.faceY - p.footHeight;
  const attachedPos = useRef(new THREE.Vector3(0, faceY, p.headRadius * 0.86));
  const detachedPos = useRef(new THREE.Vector3(0.6, p.shoulderY - 0.2, 0.5));
  const currentPos = useRef(new THREE.Vector3(0, faceY, p.headRadius * 0.86));

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = attached ? attachedPos.current : detachedPos.current;
    currentPos.current.lerp(target, Math.min(1, delta * 4));
    groupRef.current.position.copy(currentPos.current);
    const targetRotZ = attached ? 0 : 0.4;
    groupRef.current.rotation.z += (targetRotZ - groupRef.current.rotation.z) * Math.min(1, delta * 4);
  });

  // Glasses frame size scales with head
  const lensRadius = 0.038 * faceScale;
  const lensOffset = 0.07 * faceScale;
  const frameThickness = 0.005 * faceScale;

  return (
    <group ref={groupRef} scale={faceScale}>
      {/* Left lens */}
      <mesh position={[-lensOffset, 0, 0]}>
        <torusGeometry args={[lensRadius, frameThickness, 8, 24]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right lens */}
      <mesh position={[lensOffset, 0, 0]}>
        <torusGeometry args={[lensRadius, frameThickness, 8, 24]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bridge */}
      <mesh>
        <boxGeometry args={[lensOffset * 0.6, frameThickness, frameThickness]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Left temple */}
      <mesh position={[-lensOffset - frameThickness, 0, -0.05 * faceScale]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[frameThickness, frameThickness, 0.1 * faceScale]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right temple */}
      <mesh position={[lensOffset + frameThickness, 0, -0.05 * faceScale]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[frameThickness, frameThickness, 0.1 * faceScale]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

interface PatientStethoscopeProps {
  attached: boolean;
  figure: PatientFigure;
}

/** Procedural stethoscope draped around the neck. */
export function PatientStethoscope({ attached, figure }: PatientStethoscopeProps) {
  if (!attached) return null;
  const p = figure.proportions;
  const drapeRadius = p.shoulderWidth * 0.55;
  const drapeY = p.shoulderY - 0.05 - p.footHeight;
  return (
    <group position={[0, drapeY, p.shoulderThickness * 0.6]}>
      {/* Tube loop */}
      <mesh>
        <torusGeometry args={[drapeRadius, 0.013, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      {/* Chest piece */}
      <mesh position={[0, -drapeRadius * 1.3, 0.05]}>
        <cylinderGeometry args={[0.04, 0.04, 0.015, 16]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Connector */}
      <mesh position={[0, -drapeRadius * 0.95, 0.05]}>
        <cylinderGeometry args={[0.01, 0.01, 0.06, 8]} />
        <meshStandardMaterial color="#666" metalness={0.7} />
      </mesh>
    </group>
  );
}

interface PatientSandwichProps {
  attached: boolean;
  figure: PatientFigure;
}

/** Procedural sandwich — for the bit. */
export function PatientSandwich({ attached, figure }: PatientSandwichProps) {
  const groupRef = useRef<THREE.Group>(null);
  const p = figure.proportions;
  const attachedPos = new THREE.Vector3(p.shoulderWidth * 1.6, p.shoulderY - p.upperArmLength - 0.1, 0.2);
  const detachedPos = new THREE.Vector3(p.shoulderWidth * 2.5, -0.1, 0.5);
  const currentPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = attached ? attachedPos : detachedPos;
    currentPos.current.lerp(target, Math.min(1, delta * 3));
    groupRef.current.position.copy(currentPos.current);
  });

  return (
    <group ref={groupRef}>
      {/* Bread bottom */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.18, 0.04, 0.12]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>
      {/* Filling */}
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[0.16, 0.025, 0.11]} />
        <meshStandardMaterial color="#7d9b3e" roughness={0.7} />
      </mesh>
      {/* Bread top */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.18, 0.04, 0.12]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>
    </group>
  );
}

interface PatientClipboardProps {
  attached: boolean;
  figure: PatientFigure;
}

/** Procedural clipboard with paper. */
export function PatientClipboard({ attached, figure }: PatientClipboardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const p = figure.proportions;
  const attachedPos = new THREE.Vector3(-p.shoulderWidth * 1.5, p.shoulderY - p.upperArmLength - 0.05, 0.2);
  const detachedPos = new THREE.Vector3(-p.shoulderWidth * 2.3, -0.1, 0.4);
  const currentPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = attached ? attachedPos : detachedPos;
    currentPos.current.lerp(target, Math.min(1, delta * 3));
    groupRef.current.position.copy(currentPos.current);
  });

  return (
    <group ref={groupRef}>
      {/* Clipboard backing */}
      <mesh>
        <boxGeometry args={[0.18, 0.24, 0.012]} />
        <meshStandardMaterial color="#8b6f47" roughness={0.85} />
      </mesh>
      {/* Paper */}
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.16, 0.22, 0.002]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
      </mesh>
      {/* Clip */}
      <mesh position={[0, 0.13, 0.012]}>
        <boxGeometry args={[0.04, 0.02, 0.005]} />
        <meshStandardMaterial color="#666" metalness={0.7} />
      </mesh>
    </group>
  );
}
