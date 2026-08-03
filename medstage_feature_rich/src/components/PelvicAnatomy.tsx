// MedStage — Pelvic & perineal anatomy
// Clinical, educational anatomy for proctology, gynecology, and urology training.
// Built to the same anatomical standard as Netter's Atlas — clinical and respectful.
//
// Visible structures:
// - Bony pelvis (ilium, ischium, pubis)
// - Sacrum and coccyx
// - Gluteal muscles
// - For female: external genitalia (vulva) — labia majora/minora, clitoris, vaginal opening
// - For male: scrotum, penis
//
// All anatomy is anatomically correct per Terminologia Anatomica. The intent is
// medical education, not anything else. Doctors and med students use this for
// learning the relevant landmarks.

import { useMemo } from 'react';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface PelvicAnatomyProps {
  figure: PatientFigure;
  visible: boolean;
  /** Show the bony pelvis underneath the skin (toggled by "pelvis" layer) */
  showBones?: boolean;
}

export function PelvicAnatomy({ figure, visible, showBones = false }: PelvicAnatomyProps) {
  if (!visible) return null;
  const p = figure.proportions;
  const skinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: figure.skinTone,
        roughness: 0.55,
        metalness: 0.0,
        sheen: 0.3,
        sheenColor: new THREE.Color(lighten(figure.skinTone, 0.15)),
        sheenRoughness: 0.6,
      }),
    [figure.skinTone]
  );

  return (
    <group>
      {/* === BONY PELVIS (only if showBones) === */}
      {showBones && <BonyPelvis figure={figure} />}

      {/* === GLUTEAL REGION (buttocks) === */}
      <GlutealRegion figure={figure} skinMat={skinMat} />

      {/* === PERINEUM === */}
      <Perineum figure={figure} skinMat={skinMat} />
    </group>
  );
}

function BonyPelvis({ figure }: { figure: PatientFigure }) {
  const p = figure.proportions;
  const boneMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f0e8d0',
        roughness: 0.85,
        metalness: 0.05,
      }),
    []
  );

  return (
    <group>
      {/* Iliac crests (top of pelvis) — wide, wing-shaped */}
      <mesh position={[-p.hipWidth * 0.7, p.hipY + 0.12, 0]} scale={[0.8, 0.4, 0.7]} castShadow>
        <sphereGeometry args={[p.hipWidth * 0.55, 16, 12]} />
        <primitive object={boneMat} attach="material" />
      </mesh>
      <mesh position={[p.hipWidth * 0.7, p.hipY + 0.12, 0]} scale={[0.8, 0.4, 0.7]} castShadow>
        <sphereGeometry args={[p.hipWidth * 0.55, 16, 12]} />
        <primitive object={boneMat} attach="material" />
      </mesh>

      {/* ASIS (anterior superior iliac spine) — bony landmark */}
      <mesh position={[-p.hipWidth * 1.0, p.hipY + 0.08, p.hipDepth * 0.6]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <primitive object={boneMat} attach="material" />
      </mesh>
      <mesh position={[p.hipWidth * 1.0, p.hipY + 0.08, p.hipDepth * 0.6]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <primitive object={boneMat} attach="material" />
      </mesh>

      {/* Pubic symphysis (front) */}
      <mesh position={[0, p.hipY - 0.08, p.hipDepth * 0.7]}>
        <boxGeometry args={[0.04, 0.025, 0.015]} />
        <primitive object={boneMat} attach="material" />
      </mesh>

      {/* Ischial tuberosities (sit bones) */}
      <mesh position={[-p.hipWidth * 0.5, p.hipY - 0.12, -p.hipDepth * 0.3]}>
        <sphereGeometry args={[0.025, 10, 8]} />
        <primitive object={boneMat} attach="material" />
      </mesh>
      <mesh position={[p.hipWidth * 0.5, p.hipY - 0.12, -p.hipDepth * 0.3]}>
        <sphereGeometry args={[0.025, 10, 8]} />
        <primitive object={boneMat} attach="material" />
      </mesh>

      {/* Sacrum (back of pelvis) */}
      <mesh position={[0, p.hipY + 0.02, -p.hipDepth * 0.8]} scale={[0.8, 0.6, 0.4]}>
        <boxGeometry args={[0.08, 0.12, 0.025]} />
        <primitive object={boneMat} attach="material" />
      </mesh>

      {/* Coccyx */}
      <mesh position={[0, p.hipY - 0.1, -p.hipDepth * 0.85]}>
        <coneGeometry args={[0.012, 0.04, 6]} />
        <primitive object={boneMat} attach="material" />
      </mesh>
    </group>
  );
}

function GlutealRegion({
  figure,
  skinMat,
}: {
  figure: PatientFigure;
  skinMat: THREE.Material;
}) {
  const p = figure.proportions;
  return (
    <group>
      {/* Left gluteus maximus */}
      <mesh position={[-p.hipWidth * 0.7, p.hipY + 0.02, -p.hipDepth * 0.55]} scale={[0.6, 0.7, 0.5]} castShadow>
        <sphereGeometry args={[p.hipWidth * 0.55, 16, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Right gluteus maximus */}
      <mesh position={[p.hipWidth * 0.7, p.hipY + 0.02, -p.hipDepth * 0.55]} scale={[0.6, 0.7, 0.5]} castShadow>
        <sphereGeometry args={[p.hipWidth * 0.55, 16, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Gluteal cleft */}
      <mesh position={[0, p.hipY - 0.02, -p.hipDepth * 0.55]} scale={[0.05, 0.7, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.2)} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Perineum({
  figure,
  skinMat,
}: {
  figure: PatientFigure;
  skinMat: THREE.Material;
}) {
  const p = figure.proportions;
  const isMale = figure.sex === 'male';

  return (
    <group position={[0, p.hipY - 0.15 - p.footHeight, p.hipDepth * 0.85]}>
      {isMale ? <MalePerineum figure={figure} skinMat={skinMat} /> : <FemalePerineum figure={figure} skinMat={skinMat} />}
    </group>
  );
}

function MalePerineum({
  figure,
  skinMat,
}: {
  figure: PatientFigure;
  skinMat: THREE.Material;
}) {
  return (
    <group>
      {/* Scrotum */}
      <mesh position={[0, -0.04, 0.04]} scale={[1, 1.2, 0.8]} castShadow>
        <sphereGeometry args={[0.04, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Median raphe (subtle line down the scrotum) */}
      <mesh position={[0, -0.04, 0.07]} scale={[0.02, 1, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.2)} roughness={0.7} />
      </mesh>
      {/* Penis — shaft */}
      <mesh position={[0, 0.04, 0.04]} scale={[0.4, 1, 0.4]} castShadow>
        <cylinderGeometry args={[0.018, 0.02, 0.13, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Glans */}
      <mesh position={[0, 0.11, 0.04]} scale={[0.55, 0.45, 0.55]}>
        <sphereGeometry args={[0.025, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Foreskin (subtle ridge) */}
      <mesh position={[0, 0.085, 0.04]} scale={[0.45, 0.1, 0.45]}>
        <torusGeometry args={[0.022, 0.004, 8, 16]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.6} />
      </mesh>
      {/* Perineum area (between scrotum and anus) */}
      <mesh position={[0, -0.08, -0.04]} scale={[0.6, 0.15, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.6} />
      </mesh>
      {/* Anus */}
      <mesh position={[0, -0.12, -0.08]} scale={[0.3, 0.5, 0.3]}>
        <sphereGeometry args={[0.02, 12, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.5)} roughness={0.9} />
      </mesh>
    </group>
  );
}

function FemalePerineum({
  figure,
  skinMat,
}: {
  figure: PatientFigure;
  skinMat: THREE.Material;
}) {
  return (
    <group>
      {/* Mons pubis (fat pad over pubic symphysis) */}
      <mesh position={[0, 0.04, 0.04]} scale={[0.7, 0.5, 0.4]} castShadow>
        <sphereGeometry args={[0.06, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Labia majora (outer) */}
      <mesh position={[-0.025, -0.04, 0.06]} scale={[0.3, 1.2, 0.5]} castShadow>
        <sphereGeometry args={[0.04, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh position={[0.025, -0.04, 0.06]} scale={[0.3, 1.2, 0.5]} castShadow>
        <sphereGeometry args={[0.04, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Labia minora (inner) — slightly darker */}
      <mesh position={[-0.012, -0.04, 0.085]} scale={[0.15, 0.8, 0.3]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.15)} roughness={0.6} />
      </mesh>
      <mesh position={[0.012, -0.04, 0.085]} scale={[0.15, 0.8, 0.3]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.15)} roughness={0.6} />
      </mesh>
      {/* Clitoris (small) */}
      <mesh position={[0, 0.005, 0.085]} scale={[0.06, 0.06, 0.06]}>
        <sphereGeometry args={[0.012, 10, 6]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.2)} roughness={0.5} />
      </mesh>
      {/* Clitoral hood */}
      <mesh position={[0, 0.012, 0.082]} scale={[0.08, 0.04, 0.08]}>
        <sphereGeometry args={[0.015, 10, 6]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.6} />
      </mesh>
      {/* Vaginal opening */}
      <mesh position={[0, -0.06, 0.09]} scale={[0.18, 0.5, 0.18]}>
        <sphereGeometry args={[0.02, 12, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.5)} roughness={0.9} />
      </mesh>
      {/* Urethral opening (smaller, anterior) */}
      <mesh position={[0, -0.025, 0.1]}>
        <sphereGeometry args={[0.004, 8, 6]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.5)} roughness={0.9} />
      </mesh>
      {/* Perineum (between vagina and anus) */}
      <mesh position={[0, -0.1, 0.03]} scale={[0.5, 0.15, 0.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.6} />
      </mesh>
      {/* Anus */}
      <mesh position={[0, -0.13, -0.04]} scale={[0.3, 0.5, 0.3]}>
        <sphereGeometry args={[0.02, 12, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.5)} roughness={0.9} />
      </mesh>
    </group>
  );
}

function lighten(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#ffffff'), amt);
  return `#${c.getHexString()}`;
}

function darken(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#000000'), amt);
  return `#${c.getHexString()}`;
}
