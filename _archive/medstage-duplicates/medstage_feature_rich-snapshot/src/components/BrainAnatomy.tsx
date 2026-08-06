// MedStage — Brain anatomy
// Visible when the "brain" layer is toggled on. Shows:
// - Cerebrum (left and right hemispheres) with lobe color-coding
// - Cerebellum
// - Brainstem
// Designed to give neurosurgery students clear visual landmarks.

import { useMemo } from 'react';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface BrainAnatomyProps {
  figure: PatientFigure;
  visible: boolean;
}

const LOBE_COLORS = {
  frontal: '#e8a8a8',
  parietal: '#a8c8e8',
  temporal: '#d4c8a8',
  occipital: '#c8a8d4',
};

const BRAIN_MATERIAL = (color: string, roughness = 0.7) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    sheen: 0.5,
    sheenColor: new THREE.Color(lighten(color, 0.2)),
  });

function lighten(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#ffffff'), amt);
  return `#${c.getHexString()}`;
}

export function BrainAnatomy({ figure, visible }: BrainAnatomyProps) {
  const p = figure.proportions;

  const frontalMat = useMemo(() => BRAIN_MATERIAL(LOBE_COLORS.frontal), []);
  const parietalMat = useMemo(() => BRAIN_MATERIAL(LOBE_COLORS.parietal), []);
  const temporalMat = useMemo(() => BRAIN_MATERIAL(LOBE_COLORS.temporal), []);
  const occipitalMat = useMemo(() => BRAIN_MATERIAL(LOBE_COLORS.occipital), []);
  const cerebellumMat = useMemo(() => BRAIN_MATERIAL('#a89888', 0.85), []);
  const brainstemMat = useMemo(() => BRAIN_MATERIAL('#c8a890', 0.8), []);

  if (!visible) return null;

  const brainCenterY = p.headY - p.footHeight - p.headRadius * 0.05;
  const brainScale = p.headRadius / 0.115;
  const hemisphereX = brainScale * 0.04;
  const brainY = brainCenterY;
  const brainZ = -brainScale * 0.02;

  return (
    <group position={[0, brainY, brainZ]}>
      {/* === CEREBRUM === */}

      {/* Right hemisphere — frontal lobe */}
      <group position={[hemisphereX, 0.04 * brainScale, 0]}>
        <mesh scale={[1, 1.05, 1.1]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.55, 24, 18]} />
          <primitive object={frontalMat} attach="material" />
        </mesh>
        {/* Central sulcus (hint) */}
        <mesh position={[-p.headRadius * 0.05, 0.05 * brainScale, 0.04 * brainScale]} scale={[0.02, 0.3, 0.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#5a4040" roughness={0.9} />
        </mesh>
      </group>

      {/* Right hemisphere — parietal lobe (top) */}
      <group position={[hemisphereX, 0.12 * brainScale, -0.04 * brainScale]}>
        <mesh scale={[0.95, 0.6, 0.85]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 20, 14]} />
          <primitive object={parietalMat} attach="material" />
        </mesh>
      </group>

      {/* Right hemisphere — temporal lobe (side) */}
      <group position={[hemisphereX + 0.04 * brainScale, -0.04 * brainScale, 0.02 * brainScale]}>
        <mesh scale={[0.6, 0.55, 0.8]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 18, 14]} />
          <primitive object={temporalMat} attach="material" />
        </mesh>
      </group>

      {/* Right hemisphere — occipital lobe (back) */}
      <group position={[hemisphereX, 0.02 * brainScale, -0.1 * brainScale]}>
        <mesh scale={[0.65, 0.6, 0.5]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 16, 12]} />
          <primitive object={occipitalMat} attach="material" />
        </mesh>
      </group>

      {/* Left hemisphere — mirror */}
      <group position={[-hemisphereX, 0.04 * brainScale, 0]}>
        <mesh scale={[1, 1.05, 1.1]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.55, 24, 18]} />
          <primitive object={frontalMat} attach="material" />
        </mesh>
        <mesh position={[p.headRadius * 0.05, 0.05 * brainScale, 0.04 * brainScale]} scale={[0.02, 0.3, 0.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#5a4040" roughness={0.9} />
        </mesh>
      </group>

      <group position={[-hemisphereX, 0.12 * brainScale, -0.04 * brainScale]}>
        <mesh scale={[0.95, 0.6, 0.85]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 20, 14]} />
          <primitive object={parietalMat} attach="material" />
        </mesh>
      </group>

      <group position={[-hemisphereX - 0.04 * brainScale, -0.04 * brainScale, 0.02 * brainScale]}>
        <mesh scale={[0.6, 0.55, 0.8]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 18, 14]} />
          <primitive object={temporalMat} attach="material" />
        </mesh>
      </group>

      <group position={[-hemisphereX, 0.02 * brainScale, -0.1 * brainScale]}>
        <mesh scale={[0.65, 0.6, 0.5]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 16, 12]} />
          <primitive object={occipitalMat} attach="material" />
        </mesh>
      </group>

      {/* Longitudinal fissure (gap between hemispheres) */}
      <mesh position={[0, 0.05 * brainScale, 0]}>
        <boxGeometry args={[p.headRadius * 0.04, p.headRadius * 0.85, p.headRadius * 0.7]} />
        <meshStandardMaterial color="#3a2828" roughness={0.95} />
      </mesh>

      {/* === CEREBELLUM === */}
      <group position={[0, -0.08 * brainScale, -0.08 * brainScale]}>
        <mesh scale={[0.9, 0.55, 0.55]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.45, 20, 14]} />
          <primitive object={cerebellumMat} attach="material" />
        </mesh>
        {/* Cerebellar folia (texture lines) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            position={[0, 0, -0.02 - i * 0.015]}
            scale={[0.85, 0.5, 0.05]}
            rotation={[0, 0, 0]}
          >
            <sphereGeometry args={[p.headRadius * 0.42, 12, 8]} />
            <meshStandardMaterial color="#7a6858" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* === BRAINSTEM === */}
      <group position={[0, -0.14 * brainScale, -0.06 * brainScale]}>
        <mesh castShadow>
          <cylinderGeometry args={[p.headRadius * 0.12, p.headRadius * 0.1, p.headRadius * 0.35, 12]} />
          <primitive object={brainstemMat} attach="material" />
        </mesh>
        {/* Pons bulge */}
        <mesh position={[0, 0.05 * brainScale, 0]} scale={[1, 0.6, 0.7]}>
          <sphereGeometry args={[p.headRadius * 0.16, 12, 8]} />
          <primitive object={brainstemMat} attach="material" />
        </mesh>
        {/* Medulla */}
        <mesh position={[0, -0.1 * brainScale, 0]} scale={[0.85, 1, 0.7]}>
          <sphereGeometry args={[p.headRadius * 0.11, 12, 8]} />
          <primitive object={brainstemMat} attach="material" />
        </mesh>
      </group>

      {/* Corpus callosum (hint, between hemispheres) */}
      <mesh position={[0, 0.08 * brainScale, 0.02 * brainScale]}>
        <torusGeometry args={[p.headRadius * 0.18, p.headRadius * 0.04, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f5e8d8" roughness={0.7} />
      </mesh>
    </group>
  );
}
