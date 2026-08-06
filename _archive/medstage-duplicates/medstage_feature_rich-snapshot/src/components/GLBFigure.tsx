// MedStage — GLB Figure Loader
// Drop-in replacement for the procedural PatientFigure.
// If a .glb file (MakeHuman, Z-Anatomy, or any rigged character) is loaded,
// this component renders it. Otherwise, the parent should fall back to
// PatientFigure (procedural).
//
// Workflow:
//   1. User obtains a .glb file (MakeHuman export, Z-Anatomy export, etc.)
//   2. The file is loaded from URL or local file picker
//   3. The component renders it with the same props as PatientFigure
//   4. Existing layer system, voice, props all keep working

import { useEffect, useState, useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GLBFigureProps {
  url: string;
  idleRotate?: boolean;
  rotationY?: number;
  rotationX?: number;
  scale?: number;
  position?: [number, number, number];
}

function GLBModelInner({
  url,
  idleRotate = true,
  rotationY = 0,
  rotationX = 0,
  scale = 1,
  position = [0, 0, 0],
}: GLBFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotY = useRef(rotationY);
  const targetRotX = useRef(rotationX);

  const gltf = useGLTF(url);
  const clonedScene = useRef<THREE.Group | null>(null);

  // Clone the scene so we can transform it independently
  useEffect(() => {
    if (gltf?.scene) {
      clonedScene.current = gltf.scene.clone();
    }
  }, [gltf]);

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

  if (!clonedScene.current) return null;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={clonedScene.current} />
    </group>
  );
}

export function GLBFigure(props: GLBFigureProps) {
  return (
    <Suspense fallback={null}>
      <GLBModelInner {...props} />
    </Suspense>
  );
}

// Preload a GLB file (for performance)
export function preloadGLB(url: string) {
  useGLTF.preload(url);
}

// Hook to load a user-selected GLB file from File API
export function useGLBFromFile() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setError('Please select a .glb or .gltf file');
      return;
    }
    // Revoke previous URL
    if (url) URL.revokeObjectURL(url);
    const newUrl = URL.createObjectURL(file);
    setUrl(newUrl);
    setError(null);
  };

  const clearFile = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setError(null);
  };

  return { url, error, loadFile, clearFile };
}
