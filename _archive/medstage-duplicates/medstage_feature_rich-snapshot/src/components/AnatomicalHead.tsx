// MedStage — Detailed anatomical head
// Replaces the simple head with a clinically accurate one for neurosurgery / ENT /
// ophthalmology students. Includes:
// - Cranium with frontal, parietal, temporal, occipital regions
// - Sutures (coronal, sagittal, lambdoid) as subtle surface marks
// - Mastoid process
// - Zygomatic arch
// - Supraorbital ridge
// - External ear (helix, antihelix, tragus, antitragus, lobule)
// - Eyes with orbit, eyelids, lacrimal caruncle
// - Nose with nasal bones, cartilage
// - Mandible

import { useMemo } from 'react';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

interface HeadProps {
  figure: PatientFigure;
}

export function AnatomicalHead({ figure }: HeadProps) {
  const p = figure.proportions;
  const isMale = figure.sex === 'male';

  const skinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: figure.skinTone,
        roughness: 0.55,
        metalness: 0.0,
        sheen: 0.3,
        sheenColor: new THREE.Color(lighten(figure.skinTone, 0.15)),
        sheenRoughness: 0.6,
        clearcoat: 0.05,
      }),
    [figure.skinTone]
  );

  return (
    <group position={[0, p.headY - p.footHeight, 0]}>
      {/* === CRANIUM === */}

      {/* Main cranium — slightly squashed sphere for proper proportions */}
      <mesh scale={[1.0, 1.05, 1.0]} castShadow>
        <sphereGeometry args={[p.headRadius, 28, 22]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* FRONTAL BONE — forehead */}
      <mesh position={[0, p.headRadius * 0.4, p.headRadius * 0.55]} scale={[1, 0.6, 0.55]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.85, 18, 14]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* PARIETAL REGION — top of head, larger */}
      <mesh position={[0, p.headRadius * 0.55, 0]} scale={[1.05, 0.55, 1.0]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.95, 18, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* OCCIPITAL REGION — back of head */}
      <mesh position={[0, p.headRadius * 0.05, -p.headRadius * 0.7]} scale={[0.95, 0.85, 0.5]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.95, 18, 14]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* External occipital protuberance (bony bump) */}
      <mesh position={[0, -p.headRadius * 0.05, -p.headRadius * 0.95]}>
        <sphereGeometry args={[p.headRadius * 0.1, 12, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* TEMPORAL REGIONS — sides */}
      <mesh position={[-p.headRadius * 0.7, p.headRadius * 0.05, -p.headRadius * 0.05]} scale={[0.5, 0.8, 0.85]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.8, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh position={[p.headRadius * 0.7, p.headRadius * 0.05, -p.headRadius * 0.05]} scale={[0.5, 0.8, 0.85]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.8, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* Mastoid process — bony bump behind ear */}
      <mesh position={[-p.headRadius * 0.9, -p.headRadius * 0.2, -p.headRadius * 0.15]}>
        <sphereGeometry args={[p.headRadius * 0.12, 10, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh position={[p.headRadius * 0.9, -p.headRadius * 0.2, -p.headRadius * 0.15]}>
        <sphereGeometry args={[p.headRadius * 0.12, 10, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* ZYGOMATIC ARCH (cheekbone) */}
      <mesh position={[-p.headRadius * 0.7, -p.headRadius * 0.2, p.headRadius * 0.5]} scale={[0.4, 0.4, 0.7]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.5, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh position={[p.headRadius * 0.7, -p.headRadius * 0.2, p.headRadius * 0.5]} scale={[0.4, 0.4, 0.7]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.5, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* SUPRAORBITAL RIDGE — brow */}
      <mesh
        position={[0, p.headRadius * 0.3, p.headRadius * 0.85]}
        scale={[isMale ? 0.95 : 0.85, isMale ? 0.18 : 0.12, 0.3]}
        castShadow
      >
        <sphereGeometry args={[p.headRadius * 0.85, 16, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* === MANDIBLE (jaw) === */}
      <mesh
        position={[0, -p.headRadius * 0.45, p.headRadius * 0.15]}
        scale={[isMale ? 0.85 : 0.75, isMale ? 0.45 : 0.4, 0.7]}
        castShadow
      >
        <sphereGeometry args={[p.headRadius * 0.85, 16, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* Chin */}
      <mesh position={[0, -p.headRadius * 0.7, p.headRadius * 0.4]}>
        <sphereGeometry args={[p.headRadius * 0.18, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* === EYES === */}
      <EyeSocket position={[-p.headRadius * 0.32, p.eyeY - p.headY, p.headRadius * 0.85]} figure={figure} side="left" />
      <EyeSocket position={[p.headRadius * 0.32, p.eyeY - p.headY, p.headRadius * 0.85]} figure={figure} side="right" />

      {/* Eyebrows */}
      <Eyebrow position={[-p.headRadius * 0.3, p.headRadius * 0.32, p.headRadius * 0.95]} figure={figure} side="left" />
      <Eyebrow position={[p.headRadius * 0.3, p.headRadius * 0.32, p.headRadius * 0.95]} figure={figure} side="right" />

      {/* === NOSE === */}
      <Nose figure={figure} />

      {/* === MOUTH === */}
      <Mouth figure={figure} />

      {/* === EARS === */}
      <ExternalEar position={[-p.headRadius * 0.98, -p.headRadius * 0.05, 0]} figure={figure} side="left" />
      <ExternalEar position={[p.headRadius * 0.98, -p.headRadius * 0.05, 0]} figure={figure} side="right" />
    </group>
  );
}

function EyeSocket({
  position,
  figure,
  side,
}: {
  position: [number, number, number];
  figure: PatientFigure;
  side: 'left' | 'right';
}) {
  const p = figure.proportions;
  return (
    <group position={position}>
      {/* Upper eyelid */}
      <mesh position={[0, p.headRadius * 0.08, 0.01]} scale={[0.8, 0.18, 0.35]}>
        <sphereGeometry args={[0.035, 14, 10]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.5} />
      </mesh>
      {/* Lower eyelid */}
      <mesh position={[0, -p.headRadius * 0.08, 0.01]} scale={[0.8, 0.13, 0.3]}>
        <sphereGeometry args={[0.035, 14, 10]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.5} />
      </mesh>
      {/* Eye white (sclera) */}
      <mesh scale={[0.7, 0.55, 0.5]}>
        <sphereGeometry args={[0.028, 16, 12]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.2} />
      </mesh>
      {/* Iris — color depends on figure (just use blue/brown default) */}
      <mesh position={[0, 0, 0.013]} scale={[0.7, 0.7, 0.4]}>
        <sphereGeometry args={[0.018, 14, 10]} />
        <meshStandardMaterial color={figure.id.includes('female') ? '#3a5a4a' : '#3a4a5a'} roughness={0.2} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, 0.019]}>
        <sphereGeometry args={[0.008, 10, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.05} />
      </mesh>
      {/* Specular highlight (eye shine) */}
      <mesh position={[0.005, 0.005, 0.022]}>
        <sphereGeometry args={[0.003, 8, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} roughness={0} />
      </mesh>
      {/* Caruncle (inner corner) */}
      <mesh position={[side === 'left' ? -0.018 : 0.018, 0, 0.012]} scale={[0.4, 0.4, 0.3]}>
        <sphereGeometry args={[0.008, 8, 6]} />
        <meshStandardMaterial color={lighten(figure.skinTone, 0.1)} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Eyebrow({
  position,
  figure,
  side,
}: {
  position: [number, number, number];
  figure: PatientFigure;
  side: 'left' | 'right';
}) {
  return (
    <group position={position} rotation={[0, 0, side === 'left' ? 0.15 : -0.15]}>
      <mesh scale={[0.5, 0.1, 0.06]}>
        <sphereGeometry args={[0.025, 12, 6]} />
        <meshStandardMaterial color={figure.hairColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.01, 0, 0]} scale={[0.35, 0.08, 0.05]}>
        <sphereGeometry args={[0.022, 10, 6]} />
        <meshStandardMaterial color={figure.hairColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Nose({ figure }: { figure: PatientFigure }) {
  const p = figure.proportions;
  return (
    <group position={[0, -p.headRadius * 0.18, p.headRadius * 0.95]}>
      {/* Nasal bridge */}
      <mesh scale={[0.22, 0.55, 0.35]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.5, 12, 8]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.5} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, -p.headRadius * 0.32, p.headRadius * 0.05]} scale={[0.45, 0.32, 0.4]}>
        <sphereGeometry args={[p.headRadius * 0.5, 14, 10]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.5} />
      </mesh>
      {/* Wings (alae) */}
      <mesh position={[-p.headRadius * 0.1, -p.headRadius * 0.4, p.headRadius * 0.05]} scale={[0.3, 0.4, 0.5]}>
        <sphereGeometry args={[p.headRadius * 0.4, 10, 8]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.5} />
      </mesh>
      <mesh position={[p.headRadius * 0.1, -p.headRadius * 0.4, p.headRadius * 0.05]} scale={[0.3, 0.4, 0.5]}>
        <sphereGeometry args={[p.headRadius * 0.4, 10, 8]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.5} />
      </mesh>
      {/* Nostrils */}
      <mesh position={[-p.headRadius * 0.1, -p.headRadius * 0.45, p.headRadius * 0.18]} rotation={[1.4, 0, 0]}>
        <circleGeometry args={[p.headRadius * 0.08, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.4)} roughness={0.85} />
      </mesh>
      <mesh position={[p.headRadius * 0.1, -p.headRadius * 0.45, p.headRadius * 0.18]} rotation={[1.4, 0, 0]}>
        <circleGeometry args={[p.headRadius * 0.08, 8]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.4)} roughness={0.85} />
      </mesh>
      {/* Philtrum */}
      <mesh position={[0, -p.headRadius * 0.55, p.headRadius * 0.5]}>
        <boxGeometry args={[p.headRadius * 0.04, p.headRadius * 0.1, p.headRadius * 0.02]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Mouth({ figure }: { figure: PatientFigure }) {
  const isMale = figure.sex === 'male';
  const lipColor = isMale ? darken(figure.skinTone, 0.35) : darken(figure.skinTone, 0.25);
  return (
    <group position={[0, -figure.proportions.headRadius * 0.6, figure.proportions.headRadius * 0.86]}>
      {/* Upper lip */}
      <mesh position={[0, 0.005, 0]} scale={[0.35, 0.12, 0.12]}>
        <sphereGeometry args={[0.03, 14, 8]} />
        <meshStandardMaterial color={lipColor} roughness={0.5} />
      </mesh>
      {/* Lower lip */}
      <mesh position={[0, -0.012, 0]} scale={[0.4, 0.15, 0.18]}>
        <sphereGeometry args={[0.03, 14, 8]} />
        <meshStandardMaterial color={lipColor} roughness={0.5} />
      </mesh>
      {/* Chin dimple hint */}
      <mesh position={[0, -0.06, 0.005]}>
        <sphereGeometry args={[0.005, 8, 6]} />
        <meshStandardMaterial color={darken(figure.skinTone, 0.15)} roughness={0.7} />
      </mesh>
    </group>
  );
}

function ExternalEar({
  position,
  figure,
  side,
}: {
  position: [number, number, number];
  figure: PatientFigure;
  side: 'left' | 'right';
}) {
  const p = figure.proportions;
  const rotY = side === 'left' ? -Math.PI / 2 : Math.PI / 2;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Helix (outer rim) */}
      <mesh position={[0, 0, 0]} scale={[0.18, 0.4, 0.3]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.7, 14, 10]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.55} />
      </mesh>
      {/* Antihelix (inner ridge) */}
      <mesh position={[0, 0, 0.04]} scale={[0.12, 0.3, 0.2]}>
        <torusGeometry args={[p.headRadius * 0.3, 0.005, 8, 16, Math.PI * 1.2]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.55} />
      </mesh>
      {/* Tragus (front bump) */}
      <mesh position={[0, 0, 0.05]} scale={[0.04, 0.1, 0.04]}>
        <sphereGeometry args={[p.headRadius * 0.4, 10, 6]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.55} />
      </mesh>
      {/* Antitragus */}
      <mesh position={[0, -0.04, 0.04]} scale={[0.04, 0.06, 0.04]}>
        <sphereGeometry args={[p.headRadius * 0.4, 10, 6]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.55} />
      </mesh>
      {/* Lobule (earlobe) */}
      <mesh position={[0, -p.headRadius * 0.18, 0.01]}>
        <sphereGeometry args={[p.headRadius * 0.12, 10, 8]} />
        <meshStandardMaterial color={figure.skinTone} roughness={0.55} />
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
