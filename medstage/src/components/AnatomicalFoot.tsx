// MedStage — Anatomical foot
// Detailed procedural foot with all the landmarks podiatrists and orthopods need:
// - Heel (calcaneus shape)
// - Medial longitudinal arch
// - Ball of foot
// - 5 toes with proper anatomy
// - Ankle bones (medial/lateral malleolus)
// - Achilles tendon (visible)
// - Tendon sheaths on dorsum

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface FootProps {
  position: [number, number, number];
  scale: [number, number, number];
  figure: PatientFigure;
  side: 'left' | 'right';
}

export function AnatomicalFoot({ position, scale, figure, side }: FootProps) {
  const p = figure.proportions;
  const isLeft = side === 'left';

  return (
    <group position={position} scale={scale}>
      <group position={[isLeft ? 0.01 : -0.01, 0, 0]}>
        {/* HEEL — calcaneus region, rounded, slightly bulged */}
        <mesh position={[0, p.footHeight * 0.25, -0.06]} scale={[1.0, 0.7, 1.0]} castShadow>
          <sphereGeometry args={[0.07, 16, 12]} />
          <primitive object={useSkinMaterial(figure)} attach="material" />
        </mesh>

        {/* ARCH — medial longitudinal arch (slight raise under midfoot) */}
        <mesh
          position={[isLeft ? -0.015 : 0.015, p.footHeight * 0.05, 0.05]}
          scale={[1.2, 0.3, 0.7]}
          castShadow
        >
          <boxGeometry args={[0.06, 0.025, 0.12]} />
          <primitive object={useSkinMaterial(figure)} attach="material" />
        </mesh>

        {/* BALL OF FOOT — metatarsal heads, wider */}
        <mesh position={[0, p.footHeight * 0.4, 0.13]} scale={[0.9, 0.5, 0.55]} castShadow>
          <sphereGeometry args={[0.075, 16, 12]} />
          <primitive object={useSkinMaterial(figure)} attach="material" />
        </mesh>

        {/* TOP OF FOOT (dorsum) — flatter, follows bone contours */}
        <mesh position={[0, p.footHeight * 0.65, 0.04]} scale={[0.85, 0.35, 1.0]} castShadow>
          <boxGeometry args={[0.075, 0.035, 0.16]} />
          <primitive object={useSkinMaterial(figure)} attach="material" />
        </mesh>

        {/* TOES — 5 of them, big toe is biggest */}
        {[
          { x: 0.035, isBig: true },
          { x: 0.018, isBig: false },
          { x: 0, isBig: false },
          { x: -0.018, isBig: false },
          { x: -0.035, isBig: false },
        ].map((toe, i) => (
          <Toe
            key={i}
            position={[toe.x, p.footHeight * 0.4, 0.19 + (toe.isBig ? 0.01 : 0)]}
            isBigToe={toe.isBig}
            toeIndex={i}
            figure={figure}
          />
        ))}

        {/* ANKLE BONES — visible bulges on either side */}
        <mesh position={[isLeft ? 0.045 : -0.045, p.footHeight * 1.4, 0]} castShadow>
          <sphereGeometry args={[0.022, 12, 10]} />
          <primitive object={useSkinMaterial(figure)} attach="material" />
        </mesh>
        <mesh position={[isLeft ? -0.045 : 0.045, p.footHeight * 1.3, 0.005]} castShadow>
          <sphereGeometry args={[0.024, 12, 10]} />
          <primitive object={useSkinMaterial(figure)} attach="material" />
        </mesh>

        {/* ACHILLES TENDON (visible at back of heel) */}
        <mesh position={[0, p.footHeight * 1.05, -0.04]} castShadow>
          <cylinderGeometry args={[0.014, 0.018, 0.18, 8]} />
          <meshStandardMaterial color={lighten(figure.skinTone, 0.05)} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Toe({
  position,
  isBigToe,
  toeIndex,
  figure,
}: {
  position: [number, number, number];
  isBigToe: boolean;
  toeIndex: number;
  figure: PatientFigure;
}) {
  const segments = isBigToe ? 2 : 3;
  const segLength = isBigToe ? 0.025 : 0.022;
  const segRadius = isBigToe ? 0.014 : 0.01;
  const totalLength = segments * segLength;

  return (
    <group position={position}>
      {/* Proximal phalanx + middle + distal — anatomical 3-segment toe */}
      {Array.from({ length: segments }).map((_, i) => {
        const isDistal = i === segments - 1;
        const zOff = i * segLength;
        const radiusFactor = isDistal ? 0.85 : 1;
        return (
          <group key={i} position={[0, 0, zOff]}>
            <mesh scale={[1, 1, 1]} castShadow>
              <sphereGeometry args={[segRadius * radiusFactor, 10, 8]} />
              <primitive object={useSkinMaterial(figure)} attach="material" />
            </mesh>
            {/* Toenail on distal segment */}
            {isDistal && (
              <mesh position={[0, segRadius * 0.85, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
                <boxGeometry args={[segRadius * 1.4, 0.002, segRadius * 1.2]} />
                <meshStandardMaterial color="#f5e8d8" roughness={0.4} metalness={0.1} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function useSkinMaterial(figure: PatientFigure): THREE.MeshPhysicalMaterial {
  // We import the helper from PatientFigure via a local reimplementation
  // to avoid circular imports. Keep the material simple but PBR.
  return new THREE.MeshPhysicalMaterial({
    color: figure.skinTone,
    roughness: 0.55,
    metalness: 0.0,
    sheen: 0.3,
    sheenColor: new THREE.Color(lighten(figure.skinTone, 0.15)),
    sheenRoughness: 0.6,
  });
}

function lighten(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#ffffff'), amt);
  return `#${c.getHexString()}`;
}
