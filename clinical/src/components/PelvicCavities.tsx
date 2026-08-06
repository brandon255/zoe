// MedStage — Pelvic cavities (vaginal canal + rectum)
// Hollow 3D tubes that the endoscope can fly into. Anatomically approximate
// for the purpose of teaching spatial relationships in OB/GYN and proctology.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';
import type { ClinicalInsertionProp } from '../types';

interface PelvicCavitiesProps {
  figure: PatientFigure;
  /** Whether the cavities are rendered at all */
  visible: boolean;
  /** Whether the endoscope is inside (shows inside walls) */
  endoscopeActive: boolean;
  /** Optional configurable adult clinical-training prop. */
  foreignObject?: ClinicalInsertionProp | null;
  foreignObjectPosition?: number; // 0 = at opening, 1 = fully inserted
}

export function PelvicCavities({
  figure,
  visible,
  endoscopeActive,
  foreignObject,
  foreignObjectPosition = 0.3,
}: PelvicCavitiesProps) {
  const p = figure.proportions;
  const isMale = figure.sex === 'male';

  if (!visible) return null;

  // Approximate canal lengths and angles
  // Vaginal canal: ~8-10cm long, angled ~60° from vertical (toward sacrum)
  // Rectum: ~12-15cm, follows sacral curve
  const vaginalLength = 0.09;
  const rectalLength = 0.14;

  return (
    <group>
      {!isMale && <VaginalCanal figure={figure} length={vaginalLength} endoscopeActive={endoscopeActive} foreignObject={foreignObject} foreignPosition={foreignObjectPosition} />}
      <Rectum figure={figure} length={rectalLength} endoscopeActive={endoscopeActive} foreignObject={foreignObject} foreignPosition={foreignObjectPosition} />
    </group>
  );
}

function VaginalCanal({
  figure,
  length,
  endoscopeActive,
  foreignObject,
  foreignPosition,
}: {
  figure: PatientFigure;
  length: number;
  endoscopeActive: boolean;
  foreignObject?: string | null;
  foreignPosition: number;
}) {
  const p = figure.proportions;

  // Vaginal canal angle: ~60° from vertical, toward sacrum
  const angle = Math.PI / 3; // 60° from vertical
  const tilt = -Math.PI / 12; // slight posterior tilt

  // Inner mucosa material (visible when endoscope is inside)
  const mucosaMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d44a6a', // mucosal pink-red
        roughness: 0.7,
        metalness: 0.0,
        side: THREE.BackSide, // visible from inside
      }),
    []
  );

  // Outer wall (not visible usually)
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: figure.skinTone,
        roughness: 0.6,
        metalness: 0.0,
        side: THREE.FrontSide,
      }),
    [figure.skinTone]
  );

  // Position: at the vaginal opening, going up and back
  const startX = 0;
  const startY = p.hipY - 0.18 - p.footHeight;
  const startZ = p.hipDepth * 0.95;

  return (
    <group position={[startX, startY, startZ]} rotation={[Math.PI - angle, 0, 0]}>
      {/* Outer wall — closed cylinder, mucosa is on the inside */}
      <mesh castShadow>
        <cylinderGeometry args={[0.022, 0.028, length, 20, 1, true]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {/* Inner wall — back side, so visible from inside */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.026, length, 20, 1, true]} />
        <primitive object={mucosaMat} attach="material" />
      </mesh>
      {/* Cervical os + cervix body (training landmark at deep end) */}
      <mesh position={[0, length / 2 - 0.005, 0]}>
        <torusGeometry args={[0.012, 0.003, 8, 16]} />
        <meshStandardMaterial color="#8a3a4a" roughness={0.5} />
      </mesh>
      <mesh position={[0, length / 2 + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.014, 0.016, 16]} />
        <meshStandardMaterial color="#b05060" roughness={0.55} />
      </mesh>
      {/* External os aperture */}
      <mesh position={[0, length / 2 + 0.001, 0.001]}>
        <circleGeometry args={[0.004, 16]} />
        <meshStandardMaterial color="#4a1820" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {endoscopeActive && (
        <pointLight position={[0, length / 2 - 0.02, 0]} intensity={0.85} distance={0.12} color="#ffd0c0" />
      )}
      {/* Rugae (vaginal folds — visible when endoscope is in) */}
      {endoscopeActive &&
        Array.from({ length: 8 }).map((_, i) => {
          const t = i / 8;
          const z = -length / 2 + t * length;
          return (
            <group key={i} position={[0, 0, z]}>
              {Array.from({ length: 12 }).map((_, j) => {
                const a = (j / 12) * Math.PI * 2;
                return (
                  <mesh
                    key={j}
                    position={[Math.cos(a) * 0.018, Math.sin(a) * 0.018, 0]}
                    rotation={[0, 0, a]}
                  >
                    <boxGeometry args={[0.003, 0.015, 0.004]} />
                    <meshStandardMaterial color="#c44a5a" roughness={0.7} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      {/* Foreign object (e.g., forceps) */}
      {foreignObject === 'forceps' && <Forceps position={foreignPosition * length - length / 2} />}
    </group>
  );
}

function Rectum({
  figure,
  length,
  endoscopeActive,
  foreignObject,
  foreignPosition,
}: {
  figure: PatientFigure;
  length: number;
  endoscopeActive: boolean;
  foreignObject?: string | null;
  foreignPosition: number;
}) {
  const p = figure.proportions;

  // Rectum follows sacral curve — slightly S-shaped
  const mucosaMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#a83858',
        roughness: 0.6,
        metalness: 0.0,
        side: THREE.BackSide,
      }),
    []
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: figure.skinTone,
        roughness: 0.6,
        side: THREE.FrontSide,
      }),
    [figure.skinTone]
  );

  // Position: at the anus, going up and forward (toward sacrum)
  const startX = 0;
  const startY = p.hipY - 0.27 - p.footHeight;
  const startZ = -p.hipDepth * 0.55;

  // Curve points for the rectum (follows sacrum)
  const curvePoints = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length * 0.4, 0.02),
      new THREE.Vector3(0, length * 0.8, 0.04),
      new THREE.Vector3(0, length, 0.06),
    ],
    [length]
  );

  return (
    <group position={[startX, startY, startZ]}>
      {/* Use a curve to make a slightly curved canal */}
      <CurvedCanal
        points={curvePoints}
        radius={0.022}
        wallMat={wallMat}
        mucosaMat={mucosaMat}
        endoscopeActive={endoscopeActive}
      />
      {/* Configurable simulation insert for an adult clinical scenario. */}
      {foreignObject === 'training_insert' && (
        <TrainingInsert
          position={curvePoints[0]
            .clone()
            .lerp(curvePoints[curvePoints.length - 1], foreignPosition)}
        />
      )}
      {foreignObject === 'thermometer' && <Thermometer position={foreignPosition} length={length} />}
    </group>
  );
}

function CurvedCanal({
  points,
  radius,
  wallMat,
  mucosaMat,
  endoscopeActive,
}: {
  points: THREE.Vector3[];
  radius: number;
  wallMat: THREE.Material;
  mucosaMat: THREE.Material;
  endoscopeActive: boolean;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const tubeGeom = useMemo(() => new THREE.TubeGeometry(curve, 32, radius, 12, false), [curve, radius]);
  const innerTubeGeom = useMemo(() => new THREE.TubeGeometry(curve, 32, radius * 0.92, 12, false), [curve, radius]);

  return (
    <group>
      {/* Outer wall (closed tube) */}
      <mesh geometry={tubeGeom} material={wallMat} castShadow />
      {/* Inner wall (visible from inside) */}
      <mesh geometry={innerTubeGeom} material={mucosaMat} />
      {/* Houston's valves (transverse rectal folds — visible when endoscope in) */}
      {endoscopeActive &&
        [0.3, 0.55, 0.8].map((t, i) => (
          <group key={i} position={curve.getPoint(t)}>
            {Array.from({ length: 16 }).map((_, j) => {
              const a = (j / 16) * Math.PI * 2;
              return (
                <mesh
                  key={j}
                  position={[Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0]}
                  rotation={[0, 0, a]}
                >
                  <boxGeometry args={[0.004, 0.012, 0.004]} />
                  <meshStandardMaterial color="#8a2a4a" roughness={0.7} />
                </mesh>
              );
            })}
          </group>
        ))}
    </group>
  );
}

function Forceps({ position }: { position: number }) {
  // Simple obstetric/gynecologic forceps — two blades that come together
  return (
    <group position={[0, position, 0]} rotation={[0, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Two blade arms */}
      <mesh position={[-0.006, -0.04, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.005, 0.008, 0.06, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.006, -0.04, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.005, 0.008, 0.06, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
        <meshStandardMaterial color="#a0a0a0" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function TrainingInsert({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {/* Neutral training insert body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.018, 0.12, 8, 16]} />
        <meshStandardMaterial color="#56708a" roughness={0.6} />
      </mesh>
      {/* Bumpy texture (subtle) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[(Math.random() - 0.5) * 0.005, (Math.random() - 0.5) * 0.1, 0.018]}
        >
          <sphereGeometry args={[0.003, 6, 4]} />
          <meshStandardMaterial color="#415a70" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Thermometer({ position, length }: { position: number; length: number }) {
  return (
    <group position={[0, position * length, 0]}>
      <mesh>
        <cylinderGeometry args={[0.004, 0.004, 0.1, 8]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.008, 12, 8]} />
        <meshStandardMaterial color="#a02020" roughness={0.3} />
      </mesh>
    </group>
  );
}
