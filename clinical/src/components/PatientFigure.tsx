// MedStage — Detailed procedural patient figure
// Builds a realistic-looking 3D human from primitives with anatomical landmarks.
// Designed to be replaceable with a real GLB model (MakeHuman/Z-Anatomy).
//
// All proportions are read from the figure's `proportions` field, so swapping
// between figures (male/female, different body types) just changes the data.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';
import { AnatomicalFoot } from './AnatomicalFoot';
import { AnatomicalHead } from './AnatomicalHead';

interface PatientFigureProps {
  figure: PatientFigure;
  /** When true, model slowly rotates for the demo */
  idleRotate?: boolean;
  /** Voice-driven rotation targets */
  rotationY?: number;
  rotationX?: number;
  /** When true, hair is hidden (head is shaved) */
  headShaved?: boolean;
}

export function PatientFigure({
  figure,
  idleRotate = true,
  rotationY = 0,
  rotationX = 0,
  headShaved = false,
}: PatientFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotY = useRef(rotationY);
  const targetRotX = useRef(rotationX);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (idleRotate) {
      groupRef.current.rotation.y += delta * 0.15;
    } else {
      groupRef.current.rotation.y += (targetRotY.current - groupRef.current.rotation.y) * 0.08;
    }
    groupRef.current.rotation.x += (targetRotX.current - groupRef.current.rotation.x) * 0.08;
  });

  targetRotY.current = rotationY;
  targetRotX.current = rotationX;

  return (
    <group ref={groupRef} position={[0, -figure.proportions.footHeight, 0]}>
      <FigureBody figure={figure} headShaved={headShaved} />
    </group>
  );
}

function FigureBody({ figure, headShaved }: { figure: PatientFigure; headShaved: boolean }) {
  const skinMat = useSkinMaterial(figure);
  const p = figure.proportions;
  const isMale = figure.sex === 'male';

  return (
    <group>
      {/* FEET — detailed anatomical foot */}
      <AnatomicalFoot
        position={[-0.075, p.footHeight / 2, 0.04]}
        scale={[0.5, 1, 0.85]}
        figure={figure}
        side="left"
      />
      <AnatomicalFoot
        position={[0.075, p.footHeight / 2, 0.04]}
        scale={[0.5, 1, 0.85]}
        figure={figure}
        side="right"
      />

      {/* LOWER LEGS — calves */}
      <Calf
        position={[-0.075, p.footHeight + p.calfLength / 2, 0]}
        height={p.calfLength}
        radius={p.calfRadius}
        figure={figure}
      />
      <Calf
        position={[0.075, p.footHeight + p.calfLength / 2, 0]}
        height={p.calfLength}
        radius={p.calfRadius}
        figure={figure}
      />

      {/* UPPER LEGS — thighs */}
      <Thigh
        position={[-0.085, p.footHeight + p.calfLength + p.thighLength / 2 - 0.02, 0]}
        height={p.thighLength}
        radiusTop={p.thighRadius * 1.05}
        radiusBottom={p.thighRadius * 0.85}
        figure={figure}
      />
      <Thigh
        position={[0.085, p.footHeight + p.calfLength + p.thighLength / 2 - 0.02, 0]}
        height={p.thighLength}
        radiusTop={p.thighRadius * 1.05}
        radiusBottom={p.thighRadius * 0.85}
        figure={figure}
      />

      {/* KNEES */}
      <mesh
        position={[-0.085, p.footHeight + p.calfLength - 0.02, 0.02]}
        castShadow
      >
        <sphereGeometry args={[p.thighRadius * 0.75, 16, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh
        position={[0.085, p.footHeight + p.calfLength - 0.02, 0.02]}
        castShadow
      >
        <sphereGeometry args={[p.thighRadius * 0.75, 16, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* HIPS / PELVIS — wider for female */}
      <mesh position={[0, p.hipY + 0.05, 0]} castShadow>
        <sphereGeometry args={[p.hipWidth * 0.85, 24, 16]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* LOWER TORSO (waist to hips) */}
      <mesh position={[0, p.hipY + 0.15, 0]} castShadow>
        <cylinderGeometry args={[p.waistWidth * 0.85, p.hipWidth * 0.85, 0.18, 24]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* WAIST (narrowest point) */}
      <mesh position={[0, p.waistY, 0]} castShadow>
        <sphereGeometry args={[p.waistWidth * 0.7, 20, 16]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* ABDOMINAL AREA — between waist and chest */}
      <mesh position={[0, p.waistY + 0.1, 0]} castShadow>
        <cylinderGeometry args={[p.waistWidth * 0.8, p.chestWidth * 0.85, 0.18, 24]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* CHEST — broader for male */}
      <Chest
        position={[0, p.chestY, 0]}
        chestWidth={p.chestWidth}
        chestDepth={p.chestDepth}
        isMale={isMale}
        figure={figure}
      />

      {/* SHOULDERS — broader for male */}
      <Shoulder
        position={[-p.shoulderWidth, p.shoulderY, 0]}
        radius={p.shoulderThickness * 1.1}
        figure={figure}
      />
      <Shoulder
        position={[p.shoulderWidth, p.shoulderY, 0]}
        radius={p.shoulderThickness * 1.1}
        figure={figure}
      />

      {/* UPPER ARMS — deltoids, biceps */}
      <UpperArm
        position={[-p.shoulderWidth - 0.005, p.shoulderY - p.upperArmLength / 2 - 0.02, 0]}
        rotation={[0, 0, 0.12]}
        length={p.upperArmLength}
        radius={p.upperArmRadius}
        figure={figure}
      />
      <UpperArm
        position={[p.shoulderWidth + 0.005, p.shoulderY - p.upperArmLength / 2 - 0.02, 0]}
        rotation={[0, 0, -0.12]}
        length={p.upperArmLength}
        radius={p.upperArmRadius}
        figure={figure}
      />

      {/* ELBOWS */}
      <mesh
        position={[-p.shoulderWidth - 0.025, p.shoulderY - p.upperArmLength - 0.04, 0.01]}
        castShadow
      >
        <sphereGeometry args={[p.upperArmRadius * 0.85, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh
        position={[p.shoulderWidth + 0.025, p.shoulderY - p.upperArmLength - 0.04, 0.01]}
        castShadow
      >
        <sphereGeometry args={[p.upperArmRadius * 0.85, 14, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* FOREARMS */}
      <Forearm
        position={[-p.shoulderWidth - 0.04, p.shoulderY - p.upperArmLength - p.forearmLength / 2 - 0.04, 0]}
        rotation={[0, 0, 0.08]}
        length={p.forearmLength}
        radius={p.forearmRadius}
        figure={figure}
      />
      <Forearm
        position={[p.shoulderWidth + 0.04, p.shoulderY - p.upperArmLength - p.forearmLength / 2 - 0.04, 0]}
        rotation={[0, 0, -0.08]}
        length={p.forearmLength}
        radius={p.forearmRadius}
        figure={figure}
      />

      {/* HANDS */}
      <Hand
        position={[-p.shoulderWidth - 0.05, p.shoulderY - p.upperArmLength - p.forearmLength - 0.05, 0]}
        rotation={[0, 0, 0.05]}
        size={p.handSize}
        figure={figure}
      />
      <Hand
        position={[p.shoulderWidth + 0.05, p.shoulderY - p.upperArmLength - p.forearmLength - 0.05, 0]}
        rotation={[0, 0, -0.05]}
        size={p.handSize}
        figure={figure}
      />

      {/* NECK */}
      <mesh position={[0, p.shoulderY + p.neckHeight / 2 + 0.04, 0]} castShadow>
        <cylinderGeometry args={[p.neckRadius * 0.85, p.neckRadius, p.neckHeight, 16]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* HEAD — detailed anatomical head */}
      <AnatomicalHead figure={figure} />

      {/* HAIR — based on style (hidden when head is shaved) */}
      {!headShaved && <Hair figure={figure} />}

      {/* When shaved, show a hint of stubble */}
      {headShaved && figure.hasFacialHair && (
        <mesh position={[0, p.headY - p.footHeight + 0.04, 0]}>
          <sphereGeometry args={[p.headRadius * 1.005, 16, 8, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
          <meshStandardMaterial color={figure.hairColor} roughness={0.95} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

/* ===== Sub-components ===== */

function Foot({
  position,
  scale,
  figure,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <mesh position={position} scale={scale} castShadow>
      <boxGeometry args={[0.22, 0.1, 0.32]} />
      <primitive object={skinMat} attach="material" />
    </mesh>
  );
}

function Calf({
  position,
  height,
  radius,
  figure,
}: {
  position: [number, number, number];
  height: number;
  radius: number;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  // Calf has a "bulge" — biggest in the middle
  return (
    <group position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[radius, height * 0.7, 8, 16]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
    </group>
  );
}

function Thigh({
  position,
  height,
  radiusTop,
  radiusBottom,
  figure,
}: {
  position: [number, number, number];
  height: number;
  radiusTop: number;
  radiusBottom: number;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 20]} />
      <primitive object={skinMat} attach="material" />
    </mesh>
  );
}

function Chest({
  position,
  chestWidth,
  chestDepth,
  isMale,
  figure,
}: {
  position: [number, number, number];
  chestWidth: number;
  chestDepth: number;
  isMale: boolean;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <group position={position}>
      {/* Pectoral area — flatter, broader for male */}
      <mesh castShadow>
        <sphereGeometry args={[chestWidth * 0.95, 24, 16]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* For male: defined pectoral muscles */}
      {isMale && figure.build !== 'slim' && (
        <>
          <mesh
            position={[-chestWidth * 0.35, -0.02, chestDepth * 0.3]}
            scale={[0.7, 0.6, 0.5]}
            castShadow
          >
            <sphereGeometry args={[chestWidth * 0.55, 16, 12]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh
            position={[chestWidth * 0.35, -0.02, chestDepth * 0.3]}
            scale={[0.7, 0.6, 0.5]}
            castShadow
          >
            <sphereGeometry args={[chestWidth * 0.55, 16, 12]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </>
      )}
      {/* For female: breasts */}
      {!isMale && (
        <>
          <mesh
            position={[-chestWidth * 0.32, -0.08, chestDepth * 0.32]}
            scale={[0.85, 0.75, 0.6]}
            castShadow
          >
            <sphereGeometry args={[chestWidth * 0.55, 20, 16]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh
            position={[chestWidth * 0.32, -0.08, chestDepth * 0.32]}
            scale={[0.85, 0.75, 0.6]}
            castShadow
          >
            <sphereGeometry args={[chestWidth * 0.55, 20, 16]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Areola */}
          <mesh
            position={[-chestWidth * 0.32, -0.12, chestDepth * 0.55]}
          >
            <circleGeometry args={[chestWidth * 0.12, 16]} />
            <meshStandardMaterial color={darkenSkin(figure.skinTone, 0.2)} roughness={0.7} />
          </mesh>
          <mesh
            position={[chestWidth * 0.32, -0.12, chestDepth * 0.55]}
          >
            <circleGeometry args={[chestWidth * 0.12, 16]} />
            <meshStandardMaterial color={darkenSkin(figure.skinTone, 0.2)} roughness={0.7} />
          </mesh>
        </>
      )}
      {/* Sternum / center line subtle hint */}
      <mesh position={[0, 0, chestDepth * 0.45]} scale={[0.06, 0.5, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
    </group>
  );
}

function Shoulder({
  position,
  radius,
  figure,
}: {
  position: [number, number, number];
  radius: number;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 18, 14]} />
      <primitive object={skinMat} attach="material" />
    </mesh>
  );
}

function UpperArm({
  position,
  rotation,
  length,
  radius,
  figure,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  radius: number;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[radius, length * 0.6, 8, 16]} />
      <primitive object={skinMat} attach="material" />
    </mesh>
  );
}

function Forearm({
  position,
  rotation,
  length,
  radius,
  figure,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  radius: number;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[radius, length * 0.6, 8, 16]} />
      <primitive object={skinMat} attach="material" />
    </mesh>
  );
}

function Hand({
  position,
  rotation,
  size,
  figure,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <sphereGeometry args={[size, 12, 10]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      {/* Fingers hint */}
      {[-0.02, 0, 0.02].map((xOff, i) => (
        <mesh key={i} position={[xOff, -size * 0.7, 0]} castShadow>
          <boxGeometry args={[size * 0.18, size * 0.4, size * 0.18]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Head({ figure }: { figure: PatientFigure }) {
  const skinMat = useSkinMaterial(figure);
  const p = figure.proportions;
  const isMale = figure.sex === 'male';

  return (
    <group position={[0, p.headY, 0]}>
      {/* Cranium */}
      <mesh castShadow>
        <sphereGeometry args={[p.headRadius, 24, 20]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* Jaw — slightly stronger for male */}
      <mesh
        position={[0, -p.headRadius * 0.45, p.headRadius * 0.1]}
        scale={[isMale ? 0.85 : 0.75, isMale ? 0.45 : 0.4, 0.7]}
        castShadow
      >
        <sphereGeometry args={[p.headRadius * 0.85, 16, 12]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* Cheekbones — subtle for both */}
      <mesh position={[-p.headRadius * 0.55, -p.headRadius * 0.05, p.headRadius * 0.55]} scale={[0.4, 0.3, 0.2]}>
        <sphereGeometry args={[p.headRadius * 0.5, 12, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>
      <mesh position={[p.headRadius * 0.55, -p.headRadius * 0.05, p.headRadius * 0.55]} scale={[0.4, 0.3, 0.2]}>
        <sphereGeometry args={[p.headRadius * 0.5, 12, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* Brow ridge — stronger for male */}
      <mesh
        position={[0, p.headRadius * 0.25, p.headRadius * 0.85]}
        scale={[isMale ? 0.95 : 0.85, isMale ? 0.18 : 0.12, 0.3]}
        castShadow
      >
        <sphereGeometry args={[p.headRadius * 0.85, 16, 8]} />
        <primitive object={skinMat} attach="material" />
      </mesh>

      {/* EYES — slightly recessed spheres */}
      <Eye position={[-p.headRadius * 0.32, p.eyeY - p.headY, p.headRadius * 0.85]} />
      <Eye position={[p.headRadius * 0.32, p.eyeY - p.headY, p.headRadius * 0.85]} />

      {/* NOSE — bridge + tip + nostrils */}
      <group position={[0, -p.headRadius * 0.18, p.headRadius * 0.95]}>
        <mesh scale={[0.25, 0.6, 0.4]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.5, 12, 8]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        <mesh position={[0, -p.headRadius * 0.35, p.headRadius * 0.1]} scale={[0.4, 0.3, 0.35]}>
          <sphereGeometry args={[p.headRadius * 0.45, 12, 8]} />
          <primitive object={skinMat} attach="material" />
        </mesh>
        {/* Nostrils hint */}
        <mesh position={[-p.headRadius * 0.12, -p.headRadius * 0.45, p.headRadius * 0.18]} rotation={[1.4, 0, 0]}>
          <circleGeometry args={[p.headRadius * 0.08, 8]} />
          <meshStandardMaterial color={darkenSkin(figure.skinTone, 0.4)} roughness={0.8} />
        </mesh>
        <mesh position={[p.headRadius * 0.12, -p.headRadius * 0.45, p.headRadius * 0.18]} rotation={[1.4, 0, 0]}>
          <circleGeometry args={[p.headRadius * 0.08, 8]} />
          <meshStandardMaterial color={darkenSkin(figure.skinTone, 0.4)} roughness={0.8} />
        </mesh>
      </group>

      {/* MOUTH — lips */}
      <Mouth figure={figure} yOffset={-p.headRadius * 0.55} zOffset={p.headRadius * 0.88} />

      {/* EARS */}
      <Ear position={[-p.headRadius * 0.95, -p.headRadius * 0.05, 0]} figure={figure} />
      <Ear position={[p.headRadius * 0.95, -p.headRadius * 0.05, 0]} figure={figure} />

      {/* Facial hair for male — very subtle stubble hint */}
      {figure.hasFacialHair && (
        <mesh
          position={[0, -p.headRadius * 0.55, p.headRadius * 0.78]}
          scale={[0.85, 0.45, 0.15]}
        >
          <sphereGeometry args={[p.headRadius * 0.7, 16, 8]} />
          <meshStandardMaterial color={figure.hairColor} roughness={0.95} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Eyebrows */}
      <Eyebrow position={[-p.headRadius * 0.3, p.headRadius * 0.3, p.headRadius * 0.92]} figure={figure} />
      <Eyebrow position={[p.headRadius * 0.3, p.headRadius * 0.3, p.headRadius * 0.92]} figure={figure} />
    </group>
  );
}

function Eye({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Eye white (sclera) */}
      <mesh scale={[0.7, 0.55, 0.5]}>
        <sphereGeometry args={[0.028, 16, 12]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.3} />
      </mesh>
      {/* Iris */}
      <mesh position={[0, 0, 0.012]} scale={[0.7, 0.7, 0.5]}>
        <sphereGeometry args={[0.018, 12, 8]} />
        <meshStandardMaterial color="#3a5a7a" roughness={0.3} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, 0.018]}>
        <sphereGeometry args={[0.008, 10, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
      </mesh>
    </group>
  );
}

function Mouth({
  figure,
  yOffset,
  zOffset,
}: {
  figure: PatientFigure;
  yOffset: number;
  zOffset: number;
}) {
  const isMale = figure.sex === 'male';
  const lipColor = isMale ? darkenSkin(figure.skinTone, 0.35) : darkenSkin(figure.skinTone, 0.25);
  return (
    <group position={[0, yOffset, zOffset]}>
      {/* Upper lip */}
      <mesh position={[0, 0.005, 0]} scale={[0.35, 0.12, 0.12]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color={lipColor} roughness={0.5} />
      </mesh>
      {/* Lower lip */}
      <mesh position={[0, -0.012, 0]} scale={[0.4, 0.15, 0.18]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color={lipColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Ear({
  position,
  figure,
}: {
  position: [number, number, number];
  figure: PatientFigure;
}) {
  const skinMat = useSkinMaterial(figure);
  return (
    <mesh position={position} scale={[0.18, 0.45, 0.32]} castShadow>
      <sphereGeometry args={[figure.proportions.headRadius * 0.7, 12, 8]} />
      <primitive object={skinMat} attach="material" />
    </mesh>
  );
}

function Eyebrow({
  position,
  figure,
}: {
  position: [number, number, number];
  figure: PatientFigure;
}) {
  return (
    <mesh position={position} scale={[0.45, 0.1, 0.05]} rotation={[0, 0, position[0] > 0 ? -0.15 : 0.15]}>
      <sphereGeometry args={[0.025, 12, 6]} />
      <meshStandardMaterial color={figure.hairColor} roughness={0.9} />
    </mesh>
  );
}

function Hair({ figure }: { figure: PatientFigure }) {
  const p = figure.proportions;
  const isMale = figure.sex === 'male';
  const hairColor = figure.hairColor;

  if (figure.hairStyle === 'bald') {
    return null;
  }

  if (figure.hairStyle === 'short') {
    // Short cap on top of head
    return (
      <mesh position={[0, p.headRadius * 0.4, -p.headRadius * 0.02]} castShadow>
        <sphereGeometry args={[p.headRadius * 1.02, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshStandardMaterial color={hairColor} roughness={0.95} />
      </mesh>
    );
  }

  if (figure.hairStyle === 'medium') {
    // Medium length — extends below the ears
    return (
      <group>
        {/* Cap on top */}
        <mesh position={[0, p.headRadius * 0.35, -p.headRadius * 0.02]} castShadow>
          <sphereGeometry args={[p.headRadius * 1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        {/* Back hair (extends to neck) */}
        <mesh
          position={[0, p.headRadius * 0.1, -p.headRadius * 0.8]}
          scale={[1.05, 1.3, 0.5]}
          castShadow
        >
          <sphereGeometry args={[p.headRadius * 0.95, 16, 12]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        {/* Side hair */}
        <mesh position={[-p.headRadius * 0.9, p.headRadius * 0.05, 0]} scale={[0.3, 0.9, 0.7]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.9, 12, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        <mesh position={[p.headRadius * 0.9, p.headRadius * 0.05, 0]} scale={[0.3, 0.9, 0.7]} castShadow>
          <sphereGeometry args={[p.headRadius * 0.9, 12, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  // Long — extends to shoulders
  return (
    <group>
      <mesh position={[0, p.headRadius * 0.3, -p.headRadius * 0.02]} castShadow>
        <sphereGeometry args={[p.headRadius * 1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
      {/* Long back hair flowing down */}
      <mesh
        position={[0, -p.headRadius * 0.5, -p.headRadius * 0.7]}
        scale={[1.1, 2.0, 0.6]}
        castShadow
      >
        <sphereGeometry args={[p.headRadius * 0.9, 16, 12]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function useSkinMaterial(figure: PatientFigure): THREE.MeshPhysicalMaterial {
  return useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: figure.skinTone,
      roughness: 0.55,
      metalness: 0.0,
      sheen: 0.3,
      sheenColor: new THREE.Color(lightenSkin(figure.skinTone, 0.15)),
      sheenRoughness: 0.6,
      clearcoat: 0.05,
      clearcoatRoughness: 0.6,
    });
    return mat;
  }, [figure.skinTone]);
}

function lightenSkin(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#ffffff'), amount);
  return `#${c.getHexString()}`;
}

function darkenSkin(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#000000'), amount);
  return `#${c.getHexString()}`;
}
