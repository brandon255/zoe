# MedStage 3D Generation Service

Self-hosted 3D mesh generation for the MedStage prototype. Wraps [TripoSR](https://github.com/VAST-AI-Research/TripoSR) (open source, MIT license) in a simple Flask API. No API keys, no external services — runs entirely on your machine.

## What it does

Takes one or more images and returns a 3D mesh (`.glb` file) using TripoSR:
- Single image → 3D mesh in <0.5s on GPU
- Runs on CPU too (slower, ~30-60s)
- MIT licensed, fully open source

## Quick start

### Option A: Docker (one command, GPU)

```bash
cd medstage/python
docker build -t medstage-meshgen .
docker run -p 7860:7860 --gpus all medstage-meshgen
```

The first build takes ~10-15 minutes (downloads model + deps). Subsequent runs are instant.

### Option B: Docker without GPU (CPU only)

```bash
docker build -t medstage-meshgen .
docker run -p 7860:7860 medstage-meshgen
```

Slower (~30-60s per generation) but works on any machine.

### Option C: Local Python install (no Docker)

```bash
cd medstage/python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install git+https://github.com/VAST-AI-Research/TripoSR.git
python serve.py
```

Then open http://localhost:7860 in your browser. You should see `{"status": "ok", "model_loaded": false, ...}` at the health endpoint. The model loads on first request (~30s).

## Connect to MedStage frontend

The MedStage web app is already configured to talk to `http://localhost:7860`. As long as this service is running when the user clicks "Generate 3D" in the chat, it'll work.

To change the endpoint, edit the MedStage settings (⚙) → "3D Generation" section.

## API reference

### `GET /health`
Health check. Returns model status.

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "triposr",
  "device": "cuda",
  "cuda_available": true
}
```

### `GET /api/models`
List available models.

### `POST /api/generate`
Generate a 3D mesh from an image.

**Request (multipart form):**
- `image` (file, required) — input image (JPG/PNG)
- `model` (string, default: `triposr`) — model to use
- `foreground_ratio` (float, default: 0.85) — for TripoSR, ratio of foreground in image

**Response:** GLB file (binary)

**Example with curl:**
```bash
curl -X POST http://localhost:7860/api/generate \
  -F "image=@/path/to/photo.jpg" \
  -F "model=triposr" \
  --output mesh.glb
```

The returned `mesh.glb` can be loaded into Three.js, viewed in a GLB viewer, or imported into Blender.

## Hardware requirements

| Mode | VRAM | Speed (per image) |
|------|------|-------------------|
| GPU (CUDA) | 6GB+ | <0.5s |
| CPU | 8GB+ RAM | 30-60s |

Tested on:
- NVIDIA RTX 3060+ (GPU mode)
- M1/M2 Mac (CPU mode)
- Linux + CUDA 12.1

## Open source alternatives (in case TripoSR doesn't fit)

If you want different tradeoffs, swap the `run_triposr` function in `serve.py`:

| Model | License | Best for | Repo |
|-------|---------|----------|------|
| **TripoSR** (current default) | MIT | Single image, fast, balanced quality | https://github.com/VAST-AI-Research/TripoSR |
| **SF3D / Stable Fast 3D** | Stability AI Community | Faster than TripoSR, slightly lower quality | https://huggingface.co/stabilityai/stable-fast-3d |
| **Shap-E** | MIT | Text OR image input, lower quality but text works | https://github.com/openai/shap-e |
| **Hunyuan3D-2.1** | Tencent | Higher quality, more VRAM | https://huggingface.co/tencent/Hunyuan3D-2.1 |
| **Meshroom** (AliceVision) | MPL2 | Multi-photo photogrammetry, classic | https://github.com/alicevision/meshroom |
| **COLMAP** | BSD-3 | Research-grade SfM + MVS | https://github.com/colmap/colmap |
| **Nerfstudio** | Apache 2 | NeRF + 3D Gaussian Splatting, photoreal | https://github.com/nerfstudio-project/nerfstudio |
| **Luma Genie** | Apache 2 | Video to 3D, high quality | https://github.com/lumalabs/luma-web-library |

For multi-photo (20-50 photos from different angles → 3D), use **Meshroom** or **COLMAP**. For single image → 3D, use **TripoSR** (default). For video to 3D, use **Luma Genie** (requires Luma API key, paid tier).

### Video-to-3D pipeline (separate)

TripoSR takes single images. For video references that need 3D generation, you need a different pipeline:

1. **Free / Open Source:**
   - **Luma Genie** — https://lumalabs.com/genie — Video to 3D, free tier with API key
   - **3D Gaussian Splatting** (Nerfstudio) — open source, requires local install
   - **COLMAP** for structure-from-motion on video frames

2. **Hosted (paid but easy):**
   - **Luma Genie** — best quality
   - **Polycam** — iOS app
   - **KIRI Engine** — phone scan
   - **Meshy** / **Tripo3D** cloud

For MedStage, video uploads are stored as references for the case. The user can:
- Manually run a video-to-3D tool and drop the .glb in
- Use the TripoSR image-to-3D path (extract a single frame, generate)
- Use the Luma Genie integration (not included by default, see model registry)

## Troubleshooting

**"TripoSR not installed"** — Run `pip install git+https://github.com/VAST-AI-Research/TripoSR.git`

**"CUDA out of memory"** — Use CPU mode (slower but works) or reduce image size

**"Connection refused" from MedStage** — Make sure the service is running on port 7860. Check `curl http://localhost:7860/health`

**Slow generation** — First run loads the model (~30s). Subsequent runs are faster.

## License

This service wrapper: MIT (or your choice)
TripoSR: MIT
PyTorch: BSD
