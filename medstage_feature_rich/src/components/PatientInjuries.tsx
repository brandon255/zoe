// MedStage — Patient injuries & medical props
// Bandages, casts, bruises, scars — for case-based scenarios.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';

export type InjuryType =
  | 'head_bandage'
  | 'cervical_collar'
  | 'arm_cast_left'
  | 'arm_cast_right'
  | 'leg_cast_left'
  | 'leg_cast_right'
  | 'bruise_face'
  | 'bruise_arm'
  | 'bruise_leg'
  | 'scar_chest'
  | 'scar_abdomen'
  | 'rash_torso'
  | 'ice_pack'
  | 'crutches';

interface InjuryProps {
  type: InjuryType;
  figure: PatientFigure;
  attached: boolean;
}

export function Injury({ type, figure, attached }: InjuryProps) {
  if (!attached) return null;
  const p = figure.proportions;

  switch (type) {
    case 'head_bandage':
      return (
        <group position={[0, p.headY - p.footHeight + 0.04, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[p.headRadius * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
            <meshStandardMaterial color="#f0e8d8" roughness={0.9} />
          </mesh>
          {/* Gauze strips */}
          {[-0.04, 0, 0.04].map((x, i) => (
            <mesh key={i} position={[x, p.headRadius * 0.3, p.headRadius * 0.85]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.03, 0.005, 0.12]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.95} />
            </mesh>
          ))}
          {/* Red stain (blood hint) */}
          <mesh position={[-p.headRadius * 0.2, p.headRadius * 0.45, p.headRadius * 0.78]} rotation={[0.3, 0.2, 0.3]}>
            <circleGeometry args={[0.025, 12]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.6} transparent opacity={0.7} />
          </mesh>
        </group>
      );

    case 'cervical_collar':
      return (
        <group position={[0, p.shoulderY - p.footHeight + p.neckHeight / 2, 0]}>
          {/* Collar body */}
          <mesh castShadow>
            <cylinderGeometry args={[p.neckRadius * 1.5, p.neckRadius * 1.4, p.neckHeight * 2.2, 18, 1, true]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          {/* Front opening */}
          <mesh position={[0, 0, p.neckRadius * 1.4]}>
            <boxGeometry args={[0.03, p.neckHeight * 1.8, 0.01]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
          </mesh>
        </group>
      );

    case 'arm_cast_left':
      return (
        <group position={[-p.shoulderWidth - 0.04, p.shoulderY - p.upperArmLength / 2 - 0.05, 0]} rotation={[0, 0, 0.12]}>
          {/* Cast covering upper + lower arm */}
          <mesh castShadow>
            <capsuleGeometry args={[p.upperArmRadius * 1.18, (p.upperArmLength + p.forearmLength) * 0.55, 8, 16]} />
            <meshStandardMaterial color="#e8d8b8" roughness={0.9} />
          </mesh>
          {/* Fiberglass weave hint */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={i}
              position={[0, -0.1 + i * 0.05, p.upperArmRadius * 1.15]}
              rotation={[0.4, 0, 0.12]}
            >
              <boxGeometry args={[0.005, 0.005, (p.upperArmLength + p.forearmLength) * 0.7]} />
              <meshStandardMaterial color="#d4c4a4" roughness={0.95} />
            </mesh>
          ))}
        </group>
      );

    case 'arm_cast_right':
      return (
        <group position={[p.shoulderWidth + 0.04, p.shoulderY - p.upperArmLength / 2 - 0.05, 0]} rotation={[0, 0, -0.12]}>
          <mesh castShadow>
            <capsuleGeometry args={[p.upperArmRadius * 1.18, (p.upperArmLength + p.forearmLength) * 0.55, 8, 16]} />
            <meshStandardMaterial color="#e8d8b8" roughness={0.9} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={i}
              position={[0, -0.1 + i * 0.05, p.upperArmRadius * 1.15]}
              rotation={[0.4, 0, -0.12]}
            >
              <boxGeometry args={[0.005, 0.005, (p.upperArmLength + p.forearmLength) * 0.7]} />
              <meshStandardMaterial color="#d4c4a4" roughness={0.95} />
            </mesh>
          ))}
        </group>
      );

    case 'leg_cast_left':
    case 'leg_cast_right': {
      const xSign = type === 'leg_cast_left' ? -1 : 1;
      return (
        <group position={[xSign * 0.085, p.footHeight + p.calfLength / 2 + 0.15, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[p.calfRadius * 1.18, (p.calfLength + p.thighLength) * 0.5, 8, 16]} />
            <meshStandardMaterial color="#e8d8b8" roughness={0.9} />
          </mesh>
        </group>
      );
    }

    case 'bruise_face': {
      return (
        <group position={[0, p.faceY - p.footHeight, 0]}>
          <mesh position={[-p.headRadius * 0.55, 0.01, p.headRadius * 0.7]} rotation={[0.3, 0.4, 0.2]}>
            <circleGeometry args={[0.04, 16]} />
            <meshStandardMaterial color="#5a2a8a" roughness={0.6} transparent opacity={0.7} />
          </mesh>
          <mesh position={[-p.headRadius * 0.45, 0.04, p.headRadius * 0.78]} rotation={[0.3, 0.4, 0.2]}>
            <circleGeometry args={[0.025, 12]} />
            <meshStandardMaterial color="#3a1a6a" roughness={0.6} transparent opacity={0.5} />
          </mesh>
        </group>
      );
    }

    case 'bruise_arm': {
      return (
        <mesh
          position={[-p.shoulderWidth - 0.02, p.shoulderY - p.upperArmLength * 0.7, 0.06]}
          rotation={[0.3, 0.4, 0.3]}
        >
          <circleGeometry args={[0.04, 12]} />
          <meshStandardMaterial color="#3a1a6a" roughness={0.6} transparent opacity={0.65} />
        </mesh>
      );
    }

    case 'bruise_leg': {
      return (
        <mesh
          position={[0.085, p.footHeight + p.calfLength * 0.5, 0.09]}
          rotation={[0, 0, 0]}
        >
          <circleGeometry args={[0.05, 12]} />
          <meshStandardMaterial color="#3a1a6a" roughness={0.6} transparent opacity={0.65} />
        </mesh>
      );
    }

    case 'scar_chest':
      return (
        <mesh
          position={[0, p.chestY - p.footHeight + 0.05, p.chestDepth * 0.45]}
          rotation={[1.3, 0, 0]}
        >
          <boxGeometry args={[0.005, 0.18, 0.003]} />
          <meshStandardMaterial color="#a05a3a" roughness={0.6} />
        </mesh>
      );

    case 'scar_abdomen':
      return (
        <mesh
          position={[0, p.waistY - p.footHeight + 0.08, p.waistDepth * 0.55]}
          rotation={[1.3, 0, 0]}
        >
          <boxGeometry args={[0.005, 0.12, 0.003]} />
          <meshStandardMaterial color="#a05a3a" roughness={0.6} />
        </mesh>
      );

    case 'rash_torso':
      return (
        <group>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const r = 0.1;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * r, p.chestY - p.footHeight, Math.sin(angle) * r * 0.5 + 0.1]}
              >
                <sphereGeometry args={[0.012, 8, 6]} />
                <meshStandardMaterial color="#8a2a2a" roughness={0.7} />
              </mesh>
            );
          })}
        </group>
      );

    case 'ice_pack':
      return (
        <group position={[-p.shoulderWidth - 0.06, p.shoulderY - p.upperArmLength * 0.5, 0.1]}>
          <mesh>
            <boxGeometry args={[0.1, 0.06, 0.05]} />
            <meshStandardMaterial color="#a8d4e8" roughness={0.4} transparent opacity={0.7} />
          </mesh>
          {/* Bandage wrap */}
          <mesh>
            <boxGeometry args={[0.11, 0.07, 0.06]} />
            <meshStandardMaterial color="#f5f0e8" roughness={0.95} wireframe />
          </mesh>
        </group>
      );

    case 'crutches':
      // Just two angled lines next to the patient
      return (
        <group position={[p.shoulderWidth + 0.3, p.shoulderY - 0.4, 0.1]}>
          <mesh rotation={[0.1, 0, 0.05]}>
            <cylinderGeometry args={[0.012, 0.012, 1.4, 8]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.08, -0.3, 0]} rotation={[0.1, 0, -0.05]}>
            <cylinderGeometry args={[0.012, 0.012, 1.4, 8]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}

export const ALL_INJURY_TYPES: InjuryType[] = [
  'head_bandage',
  'cervical_collar',
  'arm_cast_left',
  'arm_cast_right',
  'leg_cast_left',
  'leg_cast_right',
  'bruise_face',
  'bruise_arm',
  'bruise_leg',
  'scar_chest',
  'scar_abdomen',
  'rash_torso',
  'ice_pack',
  'crutches',
];
