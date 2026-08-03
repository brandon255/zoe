// MedStage — Foot bones anatomy
// Visible when the "foot_bones" layer is toggled on.
// Shows the 26 bones of each foot: 7 tarsals, 5 metatarsals, 14 phalanges.
// Plus ankle bones (medial/lateral malleolus — tibia/fibula ends).

import { useMemo } from 'react';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface FootBonesProps {
  figure: PatientFigure;
  visible: boolean;
  side: 'left' | 'right';
}

const BONE_MATERIAL = (color = '#f0e8d0') =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.05,
  });

export function FootBones({ figure, visible, side }: FootBonesProps) {
  const p = figure.proportions;
  if (!visible) return null;

  const sign = side === 'left' ? -1 : 1;
  const x = sign * 0.085;
  const mat = useMemo(() => BONE_MATERIAL(), []);

  return (
    <group position={[x, 0, 0]}>
      {/* === TARSALS (ankle + heel) === */}

      {/* Calcaneus (heel bone) — biggest, back-bottom */}
      <mesh position={[0, p.footHeight * 0.3, -0.07]} scale={[1, 0.7, 1.5]} castShadow>
        <boxGeometry args={[0.06, 0.05, 0.1]} />
        <primitive object={mat} attach="material" />
      </mesh>

      {/* Talus (ankle bone) — sits on top of calcaneus, articulates with tibia */}
      <mesh position={[0, p.footHeight * 0.85, -0.02]} scale={[0.9, 0.6, 0.8]} castShadow>
        <sphereGeometry args={[0.045, 16, 12]} />
        <primitive object={mat} attach="material" />
      </mesh>

      {/* Navicular — front of talus, medial side */}
      <mesh position={[0, p.footHeight * 0.7, 0.05]} scale={[0.6, 0.45, 0.4]} castShadow>
        <sphereGeometry args={[0.04, 12, 10]} />
        <primitive object={mat} attach="material" />
      </mesh>

      {/* Cuboid — lateral side of midfoot */}
      <mesh position={[sign * 0.025, p.footHeight * 0.55, 0.05]} scale={[0.5, 0.5, 0.5]} castShadow>
        <boxGeometry args={[0.05, 0.04, 0.05]} />
        <primitive object={mat} attach="material" />
      </mesh>

      {/* Cuneiforms (3) — medial, intermediate, lateral */}
      <mesh position={[-sign * 0.01, p.footHeight * 0.65, 0.085]} scale={[0.35, 0.3, 0.5]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.05]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[-sign * 0.005, p.footHeight * 0.65, 0.11]} scale={[0.3, 0.3, 0.45]} castShadow>
        <boxGeometry args={[0.035, 0.03, 0.045]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[sign * 0.005, p.footHeight * 0.65, 0.105]} scale={[0.3, 0.3, 0.45]} castShadow>
        <boxGeometry args={[0.035, 0.03, 0.045]} />
        <primitive object={mat} attach="material" />
      </mesh>

      {/* === METATARSALS (5) — long bones forming the body of the foot === */}
      {[0.04, 0.02, 0, -0.02, -0.04].map((xOff, i) => {
        const toeIndex = i + 1;
        // First metatarsal is bigger and shorter
        const isFirst = i === 0;
        const length = isFirst ? 0.075 : 0.085;
        const radius = isFirst ? 0.011 : 0.0095;
        return (
          <mesh
            key={`meta-${i}`}
            position={[xOff, p.footHeight * 0.45, 0.12 + length / 2 - 0.04]}
            rotation={[0.25, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[radius, radius * 0.9, length, 8]} />
            <primitive object={mat} attach="material" />
          </mesh>
        );
      })}

      {/* === PHALANGES (toes) — 14 total (2 for big toe, 3 for each other) === */}
      {[0.04, 0.02, 0, -0.02, -0.04].map((xOff, i) => {
        const isBigToe = i === 0;
        const segments = isBigToe ? 2 : 3;
        const segLength = 0.025;
        const phalanges = [];
        for (let s = 0; s < segments; s++) {
          const zPos = 0.18 + s * segLength;
          const radius = isBigToe && s === 0 ? 0.014 : 0.0095;
          phalanges.push(
            <mesh
              key={`phalanx-${i}-${s}`}
              position={[xOff, p.footHeight * 0.32, zPos]}
              castShadow
            >
              <cylinderGeometry args={[radius, radius * 0.95, segLength * 0.9, 8]} />
              <primitive object={mat} attach="material" />
            </mesh>
          );
        }
        return <group key={`toe-${i}`}>{phalanges}</group>;
      })}

      {/* === ANKLE BONES (malleoli) === */}
      {/* Lateral malleolus (fibula) */}
      <mesh position={[-sign * 0.045, p.footHeight * 0.95, 0]} castShadow>
        <sphereGeometry args={[0.02, 12, 8]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* Medial malleolus (tibia) */}
      <mesh position={[sign * 0.045, p.footHeight * 0.95, 0.01]} castShadow>
        <sphereGeometry args={[0.022, 12, 8]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  );
}
