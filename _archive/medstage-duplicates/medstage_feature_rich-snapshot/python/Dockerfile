# MedStage 3D Generation Service
# One-command deploy:
#   docker build -t medstage-meshgen .
#   docker run -p 7860:7860 --gpus all medstage-meshgen
#
# Without GPU (CPU only, slower):
#   docker run -p 7860:7860 medstage-meshgen

FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

# System dependencies for OpenCV, rembg, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install TripoSR from source (not on PyPI)
RUN pip install --no-cache-dir "git+https://github.com/VAST-AI-Research/TripoSR.git"

# Copy the service code
COPY serve.py .

# Environment
ENV PORT=7860
ENV HOST=0.0.0.0
ENV PRELOAD_MODEL=0

EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:7860/health || exit 1

CMD ["python", "serve.py"]
