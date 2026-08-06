// MedStage — Husband-cam controller
// Animates the R3F camera from outside → vaginal entrance → cervix view.
// Used when the supportive partner "takes the camera" for training visualization.

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PatientFigure } from '../data/patientFigures';
import { getVaginalCamPath } from './HusbandFigure';

export type HusbandCamPhase = 'idle' | 'entering' | 'canal' | 'cervix' | 'exiting';

interface HusbandCamControllerProps {
  active: boolean;
  patient: PatientFigure;
  onPhaseChange?: (phase: HusbandCamPhase) => void;
  controlsRef?: MutableRefObject<{
    enabled: boolean;
    minDistance: number;
    update: () => void;
    target: THREE.Vector3;
  } | null>;
}

export function HusbandCamController({
  active,
  patient,
  onPhaseChange,
  controlsRef,
}: HusbandCamControllerProps) {
  const { camera } = useThree();
  const progress = useRef(0);
  const wasActive = useRef(false);
  const path = useRef(getVaginalCamPath(patient));
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    path.current = getVaginalCamPath(patient);
  }, [patient]);

  useEffect(() => {
    if (active && !wasActive.current) {
      progress.current = 0;
      onPhaseChange?.('entering');
      if (controlsRef?.current) {
        controlsRef.current.enabled = false;
        controlsRef.current.minDistance = 0.01;
      }
    }
    if (!active && wasActive.current) {
      onPhaseChange?.('idle');
      if (controlsRef?.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.minDistance = 1.5;
      }
    }
    wasActive.current = active;
  }, [active, onPhaseChange, controlsRef]);

  useFrame((_, delta) => {
    if (!active) return;

    progress.current = Math.min(1, progress.current + delta * 0.22);
    const t = progress.current;
    const { entrance, mid, cervix } = path.current;

    let pos: THREE.Vector3;
    if (t < 0.25) {
      onPhaseChange?.('entering');
      const u = t / 0.25;
      const outside = entrance.clone().add(new THREE.Vector3(0.15, 0.12, 0.35));
      pos = outside.lerp(entrance, easeInOut(u));
      look.current.copy(entrance);
    } else if (t < 0.7) {
      onPhaseChange?.('canal');
      const u = (t - 0.25) / 0.45;
      pos = entrance.clone().lerp(mid, easeInOut(u));
      look.current.copy(cervix);
    } else {
      onPhaseChange?.('cervix');
      const u = (t - 0.7) / 0.3;
      pos = mid.clone().lerp(cervix, easeInOut(Math.min(1, u)));
      look.current.copy(cervix).add(new THREE.Vector3(0, 0.01, -0.02));
    }

    camera.position.lerp(pos, 0.15);
    camera.near = 0.005;
    camera.far = 20;
    if ('fov' in camera) {
      (camera as THREE.PerspectiveCamera).fov = t > 0.25 ? 55 : 38;
    }
    camera.updateProjectionMatrix();
    camera.lookAt(look.current);
  });

  return null;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
