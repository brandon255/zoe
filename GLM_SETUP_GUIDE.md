# GLM Agent Setup Guide for Zoe Project

This guide is for GLM agents working on the Zoe project. Follow these steps to get the complete development environment set up.

## What's on GitHub vs What You Need Locally

### ✅ Available on GitHub (Clone These)
- **All source code**: Python, TypeScript, configs, Live2D models
- **Documentation**: README files, setup guides, prompts
- **Configuration templates**: Default configs for all components
- **Character definitions**: Live2D character configs
- **Web tooling**: HTML/JS utilities, web tools
- **Upgrade scripts**: Version management and config sync

### ❌ NOT on GitHub (Download These Locally)
The following are excluded from GitHub due to size limits and need to be set up locally:

1. **Large Model Files** (~4.5GB total):
   - SadTalker checkpoints: `SadTalker/checkpoints/` (1.5GB)
   - GFPGAN weights: `SadTalker/gfpgan/weights/` (600MB)
   - Whisper models: `Open-LLM-VTuber/models/whisper/` (1.5GB)

2. **Virtual Environments** (~800MB each):
   - `Open-LLM-VTuber/.venv/` 
   - `SadTalker/venv/`
   - `webui/venv/`

3. **Generated Assets** (~200MB):
   - `assets/outputs/`
   - `assets/generated/`
   - `images/` (generated images)
   - `assets/poses/*/seed_*.png`

## Quick Start for GLM Agents

### 1. Clone the Repository
```bash
git clone https://github.com/brandon255/zoe.git
cd zoe
```

### 2. Set Up Python Environment
```bash
# For Open-LLM-VTuber
cd Open-LLM-VTuber
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Download Required Models (Automated)
```bash
# SadTalker models (needed for Zoe's avatar)
cd SadTalker
python download_models.py  # Or download manually from repo
```

### 4. Configure the Application
```bash
# Copy default config and customize
cp Open-LLM-VTuber/config_templates/conf.default.yaml Open-LLM-VTuber/conf.yaml
# Edit conf.yaml with your settings
```

### 5. Start the Application
```bash
cd Open-LLM-VTuber
python run_server.py
```

## Manual Model Download (If Scripts Fail)

### SadTalker Models
```bash
cd SadTalker/checkpoints
# Download these files:
wget https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2/SadTalker_V0.0.2_256.safetensors
wget https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2/SadTalker_V0.0.2_512.safetensors
wget https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2/mapping_00229-model.pth.tar
```

### Whisper Models
```bash
cd Open-LLM-VTuber/models/whisper
# Download faster-whisper models via huggingface-cli
huggingface-cli download mobiuslabsgmbh/faster-whisper-large-v3-turbo
```

### GFPGAN Models
```bash
cd SadTalker/gfpgan/weights
# Download GFPGANv1.4 and related weights
wget https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth
```

## Project Structure

```
zoe/
├── Open-LLM-VTuber/          # Main voice-interactive companion
│   ├── src/                  # All Python source code ✅ GitHub
│   ├── live2d-models/        # Live2D character assets ✅ GitHub
│   ├── config_templates/     # Default configurations ✅ GitHub
│   ├── characters/           # Character definitions ✅ GitHub
│   ├── models/whisper/       # Whisper models ❌ Download locally
│   ├── .venv/               # Python environment ❌ Create locally
│   └── conf.yaml            # Your custom config (gitignored)
├── SadTalker/                # Avatar generation
│   ├── checkpoints/          # Model weights ❌ Download locally
│   ├── gfpgan/weights/       # Face enhancement ❌ Download locally
│   ├── venv/                # Python environment ❌ Create locally
│   └── inference.py          # Generation scripts ✅ GitHub
├── webui/                    # Web interface
│   ├── venv/                # Node environment ❌ Create locally
│   └── src/                 # Web source ✅ GitHub
├── persona/                  # Zoe's persona definitions ✅ GitHub
├── memory/                   # Session memory ✅ GitHub
├── reference-vault/          # Clinical references ✅ GitHub
└── GLM_SETUP_GUIDE.md        # This file ✅ GitHub
```

## File Size Summary

- **GitHub Repository**: ~40MB (all source code and configs)
- **Local Setup Required**: ~7.6GB (models + venvs + generated files)
- **Total Working Directory**: ~7.7GB

## Troubleshooting

### "Model not found" errors
- Ensure you've downloaded the model files to the correct directories
- Check `conf.yaml` paths match your download locations

### Virtual environment issues
- Delete `.venv/` folders and recreate them
- Use `pip install -r requirements.txt` with `--upgrade` flag

### Git ignore conflicts
- Never commit files listed in `.gitignore`
- Use `git status` to check what will be committed
- Large files should stay local only

## For Brandon: What to Give GLM

When giving this repo to GLM agents, provide:
1. **GitHub URL**: `https://github.com/brandon255/zoe.git`
2. **This setup guide**: Point them to `GLM_SETUP_GUIDE.md`
3. **No model files needed initially**: They can download on-demand
4. **Focus on source code**: All Python/configs are on GitHub

## Key Files for GLM to Focus On

**Priority 1 - Core System:**
- `Open-LLM-VTuber/src/open_llm_vtuber/server.py` - Main server
- `Open-LLM-VTuber/src/open_llm_vtuber/service_context.py` - Dependency injection
- `Open-LLM-VTuber/config_templates/conf.default.yaml` - Default config

**Priority 2 - Avatar Generation:**
- `SadTalker/inference.py` - Avatar generation logic
- `persona/zoe.md` - Zoe's character definition

**Priority 3 - Integration:**
- `reference-vault/derived/modeling-guidance.md` - Medical reference guidance
- `CLAUDE.md` - General development guidance

## Git Workflow Notes

- **Never force push**: Use regular pushes unless absolutely necessary
- **Clean commits**: Each commit should be a logical unit of work
- **Respect .gitignore**: Never commit models, venvs, or generated files
- **Branch strategy**: Use feature branches for major work

---

**Last Updated**: 2026-08-02  
**For**: GLM agents working on Zoe project  
**Maintainer**: Brandon Flores
