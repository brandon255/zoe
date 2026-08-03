"""
MedStage — Self-Hosted 3D Generation Service
Wraps TripoSR (https://github.com/VAST-AI-Research/TripoSR) in a simple Flask API
so the MedStage web app can generate 3D meshes from images locally — no API keys,
no external services, MIT licensed.

Usage:
    pip install -r requirements.txt
    python serve.py

The service runs on http://localhost:7860 by default.
The MedStage frontend talks to it at /api/generate.
"""
import os
import io
import tempfile
import logging
from pathlib import Path
from typing import Optional

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import numpy as np
import torch

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("medstage-meshgen")

app = Flask(__name__)
CORS(app)

# ----- Model loading -----

MODEL_REGISTRY = {
    "triposr": {
        "module": "tsr.system",
        "class_name": "TSR",
        "from_pretrained_args": {
            "config_name": "config.yaml",
            "weight_name": "model.ckpt",
        },
        "hf_id": "stabilityai/TripoSR",
        "license": "MIT",
    },
    # Add more models here as needed:
    # "shap-e": {...},
    # "hunyuan3d": {...},
}

# Loaded model singleton
_model = None
_model_name = None
_device = None


def load_model(model_name: str = "triposr", device: Optional[str] = None) -> None:
    """Load a 3D generation model."""
    global _model, _model_name, _device

    if model_name not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model: {model_name}. Options: {list(MODEL_REGISTRY.keys())}")

    if _model is not None and _model_name == model_name:
        log.info(f"Model {model_name} already loaded.")
        return

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    _device = device

    cfg = MODEL_REGISTRY[model_name]
    log.info(f"Loading {model_name} from {cfg['hf_id']} on {device}...")

    if model_name == "triposr":
        try:
            from tsr.system import TSR
        except ImportError:
            raise ImportError(
                "TripoSR not installed. Run: pip install triposr  (or see requirements.txt)"
            )
        _model = TSR.from_pretrained(
            cfg["hf_id"],
            config_name=cfg["from_pretrained_args"]["config_name"],
            weight_name=cfg["from_pretrained_args"]["weight_name"],
        )
        _model.to(device)
    # elif model_name == "shap-e":
    #     ...

    _model_name = model_name
    log.info(f"Model {model_name} loaded successfully on {device}.")


# ----- Inference helpers -----

def preprocess_image(image: Image.Image) -> torch.Tensor:
    """Preprocess a PIL image for the model."""
    # Resize to standard size, normalize
    img = image.convert("RGB").resize((256, 256), Image.LANCZOS)
    arr = np.array(img).astype(np.float32) / 255.0
    # To tensor in [0, 1] with shape (1, 3, H, W)
    tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
    return tensor


def run_triposr(image: Image.Image, output_dir: Path, foreground_ratio: float = 0.85) -> Path:
    """Run TripoSR on an image and save GLB."""
    import rembg  # for background removal

    log.info("Removing background...")
    img_no_bg = rembg.remove(image)

    # Save preprocessed image
    img_path = output_dir / "input.png"
    img_no_bg.save(img_path)

    # Run TripoSR
    log.info("Running TripoSR inference...")
    with torch.no_grad():
        _model.set_device(_device)
        # The TripoSR API expects a list of image paths
        scene_codes = _model([str(img_path)], device=_device)
        meshes = _model.extract_mesh(scene_codes, simplification=0.95)
        assert len(meshes) > 0
        mesh = meshes[0]

    # Export as GLB
    glb_path = output_dir / "output.glb"
    mesh.export(str(glb_path))
    log.info(f"Exported GLB to {glb_path}")
    return glb_path


# ----- API endpoints -----

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": _model is not None,
        "model_name": _model_name,
        "device": _device,
        "cuda_available": torch.cuda.is_available(),
    })


@app.route("/api/models", methods=["GET"])
def list_models():
    return jsonify({
        "models": [
            {
                "id": k,
                "hf_id": v["hf_id"],
                "license": v["license"],
            }
            for k, v in MODEL_REGISTRY.items()
        ]
    })


@app.route("/api/generate", methods=["POST"])
def generate():
    """Generate a 3D mesh from an uploaded image.

    Form fields:
        image: image file (required)
        model: model name (default: triposr)
        foreground_ratio: float (default: 0.85)
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    model_name = request.form.get("model", "triposr")
    foreground_ratio = float(request.form.get("foreground_ratio", 0.85))

    # Load model if not loaded
    try:
        load_model(model_name)
    except Exception as e:
        log.error(f"Failed to load model: {e}")
        return jsonify({"error": f"Failed to load model: {str(e)}"}), 500

    # Read image
    image_file = request.files["image"]
    try:
        image = Image.open(image_file.stream)
    except Exception as e:
        return jsonify({"error": f"Invalid image: {str(e)}"}), 400

    # Generate
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        try:
            if model_name == "triposr":
                glb_path = run_triposr(image, temp_path, foreground_ratio)
            else:
                return jsonify({"error": f"Model {model_name} not implemented"}), 501

            return send_file(
                str(glb_path),
                mimetype="model/gltf-binary",
                as_attachment=True,
                download_name="mesh.glb",
            )
        except Exception as e:
            log.error(f"Generation failed: {e}", exc_info=True)
            return jsonify({"error": f"Generation failed: {str(e)}"}), 500


@app.route("/api/info", methods=["GET"])
def info():
    return jsonify({
        "service": "MedStage 3D Generation",
        "version": "0.1.0",
        "models": list(MODEL_REGISTRY.keys()),
        "loaded_model": _model_name,
        "device": _device,
        "endpoints": {
            "GET /health": "Health check",
            "GET /api/models": "List available models",
            "GET /api/info": "Service info",
            "POST /api/generate": "Generate 3D mesh (multipart: image, model, foreground_ratio)",
        },
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    host = os.environ.get("HOST", "0.0.0.0")

    log.info(f"Starting MedStage 3D Generation Service on http://{host}:{port}")
    log.info("API docs: GET /api/info")

    # Optionally preload the default model
    preload = os.environ.get("PRELOAD_MODEL", "0") == "1"
    if preload:
        try:
            load_model("triposr")
        except Exception as e:
            log.warning(f"Preload failed (model will load on first request): {e}")

    app.run(host=host, port=port, debug=False, threaded=True)
