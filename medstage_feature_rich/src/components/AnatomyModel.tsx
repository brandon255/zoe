// MedStage — Anatomy Model (placeholder shell)
// This is a stylized, procedural human figure built from primitives.
// It's a placeholder for the realistic human shell (MakeHuman / Z-Anatomy)
// that you'll drop in as a GLTF file at /public/models/human-shell.glb.
//
// To replace: drop a GLB with a single root mesh into /public/models/human-shell.glb
// and the loader in useAnatomyLoader will pick it up automatically.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnatomyModelProps {
  /** When true, applies a slow idle rotation so the model is visibly "alive" */
  idleRotate?: boolean;
  /** External rotation trigger (from voice commands) */
  rotationTrigger?: number;
  /** Y-axis target rotation in radians */
  rotationY?: number;
  /** X-axis target rotation in radians */
  rotationX?: number;
}

export function AnatomyModel({
  idleRotate = true,
  rotationY = 0,
  rotationX = 0,
}: AnatomyModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotY = useRef(rotationY);
  const targetRotX = useRef(rotationX);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smoothly interpolate to target rotation
    if (idleRotate) {
      groupRef.current.rotation.y += delta * 0.15;
    } else {
      groupRef.current.rotation.y += (targetRotY.current - groupRef.current.rotation.y) * 0.08;
    }
    groupRef.current.rotation.x += (targetRotX.current - groupRef.current.rotation.x) * 0.08;
  });

  // Update target refs when props change
  targetRotY.current = rotationY;
  targetRotX.current = rotationX;

  return (
    <group ref={groupRef} position={[0, -1.2, 0]} scale={1.0}>
      <ProceduralHuman />
    </group>
  );
}

/**
 * Procedural human figure built from primitives.
 * Designed to be clearly a placeholder — easily replaced with a real GLB.
 */
function ProceduralHuman() {
  // PBR skin material with subtle subsurface tint — Three.js MeshPhysicalMaterial
  const skinMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#e8c4a0',
        roughness: 0.55,
        metalness: 0.0,
        sheen: 0.3,
        sheenColor: '#ffd9b8',
        sheenRoughness: 0.6,
        clearcoat: 0.05,
        clearcoatRoughness: 0.6,
      }),
    []
  );

  const hairMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3a2a20',
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  // Build the figure from primitive shapes — proportions roughly follow
  // a 1.75m adult. Y-up: 0 = feet, ~1.75 = top of head.
  return (
    <group>
      {/* Feet */}
      <mesh position={[-0.18, 0.08, 0.05]} material={skinMaterial} castShadow>
        <boxGeometry args={[0.22, 0.1, 0.32]} />
      </mesh>
      <mesh position={[0.18, 0.08, 0.05]} material={skinMaterial} castShadow>
        <boxGeometry args={[0.22, 0.1, 0.32]} />
      </mesh>

      {/* Lower legs */}
      <mesh position={[-0.18, 0.45, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.7, 16]} />
      </mesh>
      <mesh position={[0.18, 0.45, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.7, 16]} />
      </mesh>

      {/* Upper legs */}
      <mesh position={[-0.18, 0.95, 0]} material={skinMaterial} castShadow>
        <capsuleGeometry args={[0.12, 0.4, 8, 16]} />
      </mesh>
      <mesh position={[0.18, 0.95, 0]} material={skinMaterial} castShadow>
        <capsuleGeometry args={[0.12, 0.4, 8, 16]} />
      </mesh>

      {/* Hips / pelvis */}
      <mesh position={[0, 1.2, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.22, 24, 16]} />
      </mesh>

      {/* Torso — main body mass, cylinder slightly tapered */}
      <mesh position={[0, 1.5, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[0.24, 0.22, 0.55, 24]} />
      </mesh>

      {/* Chest / upper torso */}
      <mesh position={[0, 1.85, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.27, 24, 16]} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-0.32, 1.9, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0.32, 1.9, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>

      {/* Upper arms */}
      <mesh position={[-0.38, 1.6, 0]} rotation={[0, 0, 0.15]} material={skinMaterial} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
      </mesh>
      <mesh position={[0.38, 1.6, 0]} rotation={[0, 0, -0.15]} material={skinMaterial} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
      </mesh>

      {/* Lower arms */}
      <mesh position={[-0.46, 1.2, 0]} rotation={[0, 0, 0.1]} material={skinMaterial} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 8, 16]} />
      </mesh>
      <mesh position={[0.46, 1.2, 0]} rotation={[0, 0, -0.1]} material={skinMaterial} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 8, 16]} />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.5, 0.95, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
      </mesh>
      <mesh position={[0.5, 0.95, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 2.1, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.13, 16]} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.3, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[0.18, 24, 20]} />
      </mesh>

      {/* Hair (top of head) */}
      <mesh position={[0, 2.4, -0.02]} material={hairMaterial} castShadow>
        <sphereGeometry args={[0.185, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
      </mesh>

      {/* Face features — minimal, abstract. Placeholder for real facial geometry. */}
      <mesh position={[-0.06, 2.32, 0.16]} material={skinMaterial}>
        <sphereGeometry args={[0.018, 12, 8]} />
      </mesh>
      <mesh position={[0.06, 2.32, 0.16]} material={skinMaterial}>
        <sphereGeometry args={[0.018, 12, 8]} />
      </mesh>
    </group>
  );
}
