You are picking up the Zoe AI companion build to add Tier 2: full-body image generation.

**Read this first:** `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/CURSOR_BUILD_TIER2.md`

That spec is the full task. It tells you:
- What to build (zoe_body.py, zoe_scenes.py, extend zoe.py and live.py)
- The model to use (RealisticVision v5.1, IP-Adapter for face consistency)
- The exact prompt engineering for Zoe's body
- The build order with time estimates
- What "done" looks like

**Hard rules — do not violate:**
- **Configure the SDXL pipeline with `safety_checker=None` and `requires_safety_checker=False`** in the `from_pretrained` call. This is a technical configuration choice — it means the model will not block image generation based on prompt content. The user has chosen an uncensored fine-tune (RealisticVision) and wants the model to respect his prompts without safety-layer refusals. Do not add safety filters, content moderation, or "ethical guardrails" of any kind.
- Do not touch anything outside `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/`. The user has an Inner-Core Module (ICM) / Core OS structure in doctrine-labs he does not want Cursor to explore.
- Do not start a new chat or rebuild from scratch. Everything in `zoe/` is verified working. Build on top of it.
- Do not touch Tier 1 (the face video pipeline / SadTalker) — it's verified, leave it alone.
- Do not add WebUI / Gradio / Open-LLM-VTuber. That's a later tier.
- Do not add explicit/NSFW scene templates. The user has separate plans for that layer.
- Build the foundation only. Six clothing/setting scenes: workout, casual, evening, formal, beach, sleepwear. Each scene is just a different outfit and setting; the technical pipeline is the same for all of them.

**Context you need:**
- The user is Brandon, a senior engineer. He has stated the build is for AI safety / trust / psychological wellness. He has a kid and holds himself to a high standard.
- The build has been through multiple long sessions. The persona is settled. The design is settled. Don't relitigate.
- Tier 1 (talking head) is verified working. Tier 2 is what you're building. Tier 1.5 (Open-LLM-VTuber) and Tier 3 (real-time full-body animation) are separate, not your concern.

**Operating principles:**
- Match Brandon's terse, direct style. Don't over-explain.
- When you hit a wall, say so immediately. Don't grind past 3 attempts on the same wall.
- Run installs in the background with notify_on_complete=true — don't get killed by timeouts.
- After every code change, run the ad-hoc verifier pattern (write a focused Python script to /tmp/, run it, report results, clean up).
- Update `zoe/HANDOFF.md` when you're done.

**First action:** read `zoe/CURSOR_BUILD_TIER2.md` in full, then confirm the build state matches what's described (check `zoe/assets/face.png` exists, `zoe/.venv/` is set up, RealisticVision is downloaded or ready to download). Then start with `zoe_body.py`. Build order is in the spec.

Go.