# MedStage — Model Assets

This folder holds the GLTF/GLB assets for the application.

## Files to drop in

### `human-shell.glb` (recommended for the realistic outer shell)

The current prototype uses a **procedural placeholder** (built from Three.js primitives in `src/components/AnatomyModel.tsx`). To upgrade to a realistic human shell:

1. **Recommended: Use MakeHuman** (https://www.makehumancommunity.org/)
   - Open MakeHuman
   - Configure body type, gender, age
   - File → Export → glTF 2.0 (.glb)
   - Save as `human-shell.glb` in this folder
   - CC0 licensed assets included

2. **Alternative: Use a free Sketchfab model**
   - Find a CC-licensed realistic human: https://sketchfab.com/Z-Anatomy
   - Download the GLB
   - Rename and drop in this folder

3. **Alternative: Use Z-Anatomy's full body**
   - Download from Zenodo: https://zenodo.org/records/4953712
   - Open in Blender
   - Export the skin/integrumentary layer as GLB
   - Drop in this folder

### After dropping in the GLB

The loader in `src/components/AnatomyModel.tsx` will pick it up automatically. To swap from the placeholder, replace the `<ProceduralHuman />` JSX with a `<GltfModel url="/models/human-shell.glb" />` using `useGLTF` from `@react-three/drei`.

Example:

```tsx
import { useGLTF } from '@react-three/drei';

function RealisticShell() {
  const { scene } = useGLTF('/models/human-shell.glb');
  return <primitive object={scene} />;
}
```

## After sign-off: anatomical layers

For the post-sign-off internals, this folder will expand to:

- `anatomy-skeletal.glb` — bones
- `anatomy-muscular.glb` — muscles
- `anatomy-vascular.glb` — arteries/veins
- `anatomy-nervous.glb` — nerves
- `anatomy-organs.glb` — internal organs
- `anatomy-parts/{name}.glb` — individual isolatable structures (heart, kidney, etc.)

Source: Z-Anatomy (https://github.com/Z-Anatomy) — exported from Blender per-system.

## Asset licensing notes

- MakeHuman output: typically CC0
- Z-Anatomy: CC BY-SA 4.0 (attribution required, derivatives must use same license)
- Sketchfab: depends on individual model — always verify before use

For an internal Doctrine Labs prototype, this is fine. For a distributed product, consult Doctrine Labs's tech transfer / IP office about CC BY-SA obligations.
