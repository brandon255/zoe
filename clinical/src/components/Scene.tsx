// MedStage — 3D Scene
// Anatomy lab with the active patient figure, hospital gown, props, anatomy layers, and camera.

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { PatientFigure } from './PatientFigure';
import { GLBFigure } from './GLBFigure';
import { ExamEquipment, type ExamTool } from './ExamEquipment';
import type { ClinicalInsertionProp, FigureSource } from '../types';
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
import { HusbandFigure } from './HusbandFigure';
import { HusbandCamController, type HusbandCamPhase } from './HusbandCamController';
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
  mode: 'command' | 'conversation' | 'encounter';
  layers: Record<LayerId, boolean>;
  headShaved: boolean;
  endoscopeActive: boolean;
  endoscopeView: 'vaginal' | 'rectal' | null;
  foreignBody: ClinicalInsertionProp | null;
  intimateAnatomyEnabled: boolean;
  /** Active exam equipment (only used in encounter mode) */
  examTools?: Set<ExamTool>;
  /** Which figure source to render: procedural or GLB */
  figureSource?: FigureSource;
  /** Custom GLB URL (when figureSource === 'glb-custom') */
  customGlbUrl?: string | null;
  /** Supportive partner visible beside patient */
  husbandPresent?: boolean;
  /** Partner operates camera into vaginal canal → cervix */
  husbandCamActive?: boolean;
  onHusbandCamPhase?: (phase: HusbandCamPhase) => void;
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
  intimateAnatomyEnabled,
  examTools,
  figureSource = 'procedural',
  customGlbUrl,
  husbandPresent = false,
  husbandCamActive = false,
  onHusbandCamPhase,
}: SceneProps) {
  const controlsRef = useRef<any>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const targetVec = useRef(new THREE.Vector3(...cameraTarget));
  const insideView = endoscopeActive || husbandCamActive;

  useEffect(() => {
    if (husbandCamActive) return;
    const dir = new THREE.Vector3().subVectors(camera.position, targetVec.current).normalize();
    camera.position.copy(targetVec.current).addScaledVector(dir, cameraDistance);
    camera.updateProjectionMatrix();
  }, [cameraDistance, camera, husbandCamActive]);

  useEffect(() => {
    targetVec.current.set(...cameraTarget);
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget);
    }
  }, [cameraTarget]);

  useEffect(() => {
    if (!controlsRef.current) return;
    if (insideView) {
      controlsRef.current.minDistance = 0.01;
      controlsRef.current.maxDistance = husbandCamActive ? 0.5 : 2;
      if (husbandCamActive) controlsRef.current.enabled = false;
    } else {
      controlsRef.current.enabled = true;
      controlsRef.current.minDistance = 1.5;
      controlsRef.current.maxDistance = 8;
    }
  }, [insideView, husbandCamActive]);

  useFrame((_, delta) => {
    if (husbandCamActive) return;
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
        {figureSource === 'procedural' ? (
          <PatientFigure
            figure={figure}
            idleRotate={idleRotate}
            rotationY={modelRotationY}
            rotationX={modelRotationX}
            headShaved={headShaved}
          />
        ) : figureSource === 'glb-cesium' ? (
          <GLBFigure
            url="/models/CesiumMan.glb"
            idleRotate={idleRotate}
            rotationY={modelRotationY}
            rotationX={modelRotationX}
            scale={1.6}
            position={[0, -1.0, 0]}
          />
        ) : figureSource === 'glb-custom' && customGlbUrl ? (
          <GLBFigure
            url={customGlbUrl}
            idleRotate={idleRotate}
            rotationY={modelRotationY}
            rotationX={modelRotationX}
            scale={1.6}
            position={[0, -1.0, 0]}
          />
        ) : null}
        {figureSource === 'procedural' && attachedObjects.gown && <HospitalGown figure={figure} />}

        {/* Head group — animated for character reactions */}
        <group ref={headGroupRef} position={[0, 0, 0]}>
          <PatientGlasses attached={attachedObjects.glasses ?? false} figure={figure} />
        </group>

        {/* Other props */}
        <PatientStethoscope attached={attachedObjects.stethoscope ?? false} figure={figure} />
        <PatientSandwich attached={attachedObjects.sandwich ?? false} figure={figure} />
        <PatientClipboard attached={attachedObjects.clipboard ?? false} figure={figure} />

        {/* === EXAM EQUIPMENT (encounter + command tray demo) === */}
        {(mode === 'encounter' || mode === 'command') && examTools && examTools.size > 0 && (
          <ExamEquipment
            figure={figure}
            activeTools={examTools}
            endoscopeView={endoscopeView}
          />
        )}

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
          visible={intimateAnatomyEnabled}
          showBones={layers.pelvis ?? false}
        />

        {/* Pelvic cavities (vaginal canal + rectum) — for endoscope / husband-cam */}
        <PelvicCavities
          figure={figure}
          visible={intimateAnatomyEnabled}
          endoscopeActive={endoscopeActive || husbandCamActive}
          foreignObject={foreignBody}
        />

        {/* Supportive partner — clinical presence; may operate husband-cam */}
        <HusbandFigure
          patient={figure}
          visible={husbandPresent && intimateAnatomyEnabled}
          holdingCamera={husbandCamActive}
        />

        <HusbandCamController
          active={husbandCamActive && intimateAnatomyEnabled}
          patient={figure}
          controlsRef={controlsRef}
          onPhaseChange={onHusbandCamPhase}
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
        minDistance={insideView ? 0.01 : 1.5}
        maxDistance={insideView ? (husbandCamActive ? 0.5 : 2) : 8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        target={cameraTarget}
        enabled={!husbandCamActive}
      />
    </>
  );
}
