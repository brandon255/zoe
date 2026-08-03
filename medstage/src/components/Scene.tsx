// MedStage — 3D Scene
// Anatomy lab with the active patient figure, hospital gown, props, anatomy layers, and camera.

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { PatientFigure } from './PatientFigure';
import { HospitalGown } from './HospitalGown';
import {
  PatientGlasses,
  PatientStethoscope,
  PatientSandwich,
  PatientClipboard,
} from './PatientProps';
import { BrainAnatomy } from './BrainAnatomy';
import { FootBones } from './FootBones';
import { PelvicAnatomy } from './PelvicAnatomy';
import { PelvicCavities } from './PelvicCavities';
import { Injury } from './PatientInjuries';
import { ALL_INJURY_TYPES } from './PatientInjuries';
import type { PatientFigure as FigureType } from '../data/patientFigures';
import type { PatientAnimation } from '../data/patientActions';
import type { LayerId } from '../types';

interface SceneProps {
  figure: FigureType;
  cameraDistance: number;
  cameraTarget: [number, number, number];
  modelRotationY: number;
  modelRotationX: number;
  idleRotate: boolean;
  attachedObjects: Record<string, boolean>;
  currentAnimation: PatientAnimation;
  mode: 'command' | 'conversation';
  layers: Record<LayerId, boolean>;
  headShaved: boolean;
  endoscopeActive: boolean;
  endoscopeView: 'vaginal' | 'rectal' | null;
  foreignBody: 'cucumber' | 'forceps' | 'thermometer' | null;
}

export function Scene({
  figure,
  cameraDistance,
  cameraTarget,
  modelRotationY,
  modelRotationX,
  idleRotate,
  attachedObjects,
  currentAnimation,
  mode,
  layers,
  headShaved,
  endoscopeActive,
  endoscopeView,
  foreignBody,
}: SceneProps) {
  const controlsRef = useRef<any>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const targetVec = useRef(new THREE.Vector3(...cameraTarget));

  useEffect(() => {
    const dir = new THREE.Vector3().subVectors(camera.position, targetVec.current).normalize();
    camera.position.copy(targetVec.current).addScaledVector(dir, cameraDistance);
    camera.updateProjectionMatrix();
  }, [cameraDistance, camera]);

  useEffect(() => {
    targetVec.current.set(...cameraTarget);
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget);
    }
  }, [cameraTarget]);

  useFrame((_, delta) => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec.current, 0.08);
      controlsRef.current.update();
    }

    if (headGroupRef.current) {
      let targetTiltX = 0;
      let targetTurnY = 0;
      if (currentAnimation === 'nod') {
        targetTiltX = Math.sin(Date.now() * 0.005) * 0.15;
      } else if (currentAnimation === 'shake_head') {
        targetTurnY = Math.sin(Date.now() * 0.005) * 0.3;
      } else if (currentAnimation === 'look_around') {
        targetTurnY = Math.sin(Date.now() * 0.001) * 0.2;
      } else if (currentAnimation === 'wave') {
        targetTiltX = Math.sin(Date.now() * 0.003) * 0.05;
      } else if (currentAnimation === 'breathe_deep') {
        const breathe = 1 + Math.sin(Date.now() * 0.002) * 0.01;
        headGroupRef.current.scale.setScalar(breathe);
      }
      headGroupRef.current.rotation.x += (targetTiltX - headGroupRef.current.rotation.x) * Math.min(1, delta * 5);
      headGroupRef.current.rotation.y += (targetTurnY - headGroupRef.current.rotation.y) * Math.min(1, delta * 5);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#a8c8e8" />
      <directionalLight position={[0, 3, -5]} intensity={0.3} color="#ffffff" />
      <Environment preset="apartment" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -figure.proportions.footHeight - 0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#d8dde4" roughness={0.85} metalness={0.0} />
      </mesh>

      <ContactShadows
        position={[0, -figure.proportions.footHeight, 0]}
        opacity={0.4}
        scale={6}
        blur={2.5}
        far={3}
        resolution={1024}
        color="#000000"
      />

      <group position={[0, 0, 0]}>
        <PatientFigure
          figure={figure}
          idleRotate={idleRotate}
          rotationY={modelRotationY}
          rotationX={modelRotationX}
          headShaved={headShaved}
        />
        <HospitalGown figure={figure} />

        {/* Head group — animated for character reactions */}
        <group ref={headGroupRef} position={[0, 0, 0]}>
          <PatientGlasses attached={attachedObjects.glasses ?? false} figure={figure} />
        </group>

        {/* Other props */}
        <PatientStethoscope attached={attachedObjects.stethoscope ?? false} figure={figure} />
        <PatientSandwich attached={attachedObjects.sandwich ?? false} figure={figure} />
        <PatientClipboard attached={attachedObjects.clipboard ?? false} figure={figure} />

        {/* === INJURIES (from case library) === */}
        {ALL_INJURY_TYPES.map((injuryType) => (
          <Injury
            key={injuryType}
            type={injuryType}
            figure={figure}
            attached={attachedObjects[injuryType] ?? false}
          />
        ))}

        {/* === ANATOMICAL LAYERS === */}

        {/* Brain (neurosurgery) */}
        <BrainAnatomy figure={figure} visible={layers.brain ?? false} />

        {/* Foot bones (podiatry/orthopedics) */}
        <FootBones figure={figure} visible={layers.foot_bones ?? false} side="left" />
        <FootBones figure={figure} visible={layers.foot_bones ?? false} side="right" />

        {/* Pelvic anatomy (proctology/gynecology) */}
        <PelvicAnatomy
          figure={figure}
          visible={true}
          showBones={layers.pelvis ?? false}
        />

        {/* Pelvic cavities (vaginal canal + rectum) — for endoscope view */}
        <PelvicCavities
          figure={figure}
          visible={true}
          endoscopeActive={endoscopeActive}
          foreignObject={foreignBody}
        />

        {/* Conversation mode indicator — subtle aura */}
        {mode === 'conversation' && (
          <pointLight position={[0, figure.proportions.chestY, 0.6]} intensity={0.4} color="#5a9eff" distance={3} />
        )}
      </group>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        target={cameraTarget}
      />
    </>
  );
}
