// MedStage — Hospital Gown (parametric, adapts to body type)
// Drapes over the torso. Sizing is driven by the figure's proportions.

import { useMemo } from 'react';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface HospitalGownProps {
  figure: PatientFigure;
}

export function HospitalGown({ figure }: HospitalGownProps) {
  const p = figure.proportions;

  // Gown dimensions scale with body
  const gownTopRadius = Math.max(p.shoulderWidth * 0.95, p.chestWidth * 0.95);
  const gownBottomRadius = Math.max(p.hipWidth * 1.05, p.waistWidth * 1.2);
  const gownHeight = p.torsoHeight + 0.18; // extends from shoulders to mid-thigh
  const gownTopY = p.shoulderY - 0.05;
  const gownBottomY = gownTopY - gownHeight;

  // Sleeve dimensions
  const sleeveRadius = p.upperArmRadius * 1.25;
  const sleeveHeight = p.upperArmLength * 0.55;

  const gownMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6db4d4', // medical blue
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const trimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3a7da0',
        roughness: 0.7,
        metalness: 0.0,
      }),
    []
  );

  return (
    <group>
      {/* Main gown body — opens at the front V */}
      <mesh
        position={[0, gownTopY - gownHeight / 2, 0]}
        material={gownMaterial}
        castShadow
      >
        <cylinderGeometry args={[gownTopRadius, gownBottomRadius, gownHeight, 32, 1, true]} />
      </mesh>

      {/* Front opening V — left panel */}
      <mesh
        position={[-gownTopRadius * 0.2, gownTopY - 0.12, gownTopRadius * 0.5]}
        rotation={[0, -0.3, 0]}
        material={gownMaterial}
        castShadow
      >
        <boxGeometry args={[gownTopRadius * 0.5, 0.32, 0.02]} />
      </mesh>
      {/* Front opening V — right panel */}
      <mesh
        position={[gownTopRadius * 0.2, gownTopY - 0.12, gownTopRadius * 0.5]}
        rotation={[0, 0.3, 0]}
        material={gownMaterial}
        castShadow
      >
        <boxGeometry args={[gownTopRadius * 0.5, 0.32, 0.02]} />
      </mesh>

      {/* Shoulder covering — separate flaps */}
      <mesh
        position={[-p.shoulderWidth * 0.5, gownTopY + 0.04, 0]}
        material={gownMaterial}
        castShadow
      >
        <sphereGeometry args={[p.shoulderWidth * 0.6, 16, 12]} />
      </mesh>
      <mesh
        position={[p.shoulderWidth * 0.5, gownTopY + 0.04, 0]}
        material={gownMaterial}
        castShadow
      >
        <sphereGeometry args={[p.shoulderWidth * 0.6, 16, 12]} />
      </mesh>

      {/* Neckline trim */}
      <mesh
        position={[0, gownTopY + 0.04, p.shoulderThickness * 0.7]}
        material={trimMaterial}
      >
        <torusGeometry args={[p.neckRadius * 1.6, 0.012, 8, 24]} />
      </mesh>

      {/* Short sleeves — upper arm coverage */}
      <mesh
        position={[-p.shoulderWidth, p.shoulderY - sleeveHeight / 2 - 0.05, 0]}
        rotation={[0, 0, 0.18]}
        material={gownMaterial}
        castShadow
      >
        <cylinderGeometry args={[sleeveRadius, sleeveRadius * 1.1, sleeveHeight, 18, 1, true]} />
      </mesh>
      <mesh
        position={[p.shoulderWidth, p.shoulderY - sleeveHeight / 2 - 0.05, 0]}
        rotation={[0, 0, -0.18]}
        material={gownMaterial}
        castShadow
      >
        <cylinderGeometry args={[sleeveRadius, sleeveRadius * 1.1, sleeveHeight, 18, 1, true]} />
      </mesh>

      {/* Bottom hem trim */}
      <mesh
        position={[0, gownBottomY, 0]}
        material={trimMaterial}
      >
        <torusGeometry args={[gownBottomRadius, 0.012, 8, 32]} />
      </mesh>

      {/* Tie strap (back) */}
      <mesh
        position={[0, gownTopY - 0.05, -gownTopRadius * 0.8]}
        material={trimMaterial}
      >
        <torusGeometry args={[p.neckRadius * 0.8, 0.008, 6, 16]} />
      </mesh>
    </group>
  );
}
