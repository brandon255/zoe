You are picking up the next phase of a local video synthesis project. The user is a senior engineer who has built the foundation layers and is now scoping the next phase. This document is for planning and onboarding only. **This is not a build spec.** The build is constrained by what exists as production-ready software in 2026 and what doesn't. Your job in this session is to read the landscape, write a clean scope document, and prepare a research/grant framing for the user.

## What the user has already (verified working)

The user has built and verified three layers of a local video/image generation system:

1. **Layer A (Face video from audio):** A still portrait can be animated to speak with realistic lip-sync and head movement from a short audio clip. Verified MP4 output exists. ~5 second clips. Takes ~12-15 minutes per clip to render locally.

2. **Layer B (Real-time avatar conversation):** A web-based interface where you talk and an animated character responds in real-time. Anime-style avatar (not photoreal). Fully local, runs in a browser. Installed and ~90% configured.

3. **Layer C (Full-body image generation on demand):** Generate a full-body image of a character in any outfit or setting you describe. Same face across all generations (face consistency). Used for medical/educational illustration: anatomy views, scenario poses, visual reference material.

The full architecture is at `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/`.

## What this project is reaching for (next layer)

The user is connected with faculty at a medical university who are working on real-time AR/VR anatomy visualization. They use open-source software, iPad cameras, and fiducial markers to overlay CT scans onto patients in real-time for teaching. The missing piece in their pipeline — and the piece this project reaches toward — is a real-time, photorealistic full-body character that medical students can have a flowing conversation with, that responds with body movement, gestures, and clinical scenario behaviors.

## The honest technical landscape (2026)

This is what exists as production-ready software:

| Product / Tech | What it does | Limitation |
|---|---|---|
| D-ID, HeyGen, Synthesia | Photo + audio → talking-head video, 2-5 seconds | Not real-time. Not full-body. Cloud-only, paid. |
| Runway Gen-4, OpenAI Sora | Text/image → photorealistic video clips | Pre-rendered, not real-time. Not conversational. |
| NVIDIA Audio2Face | Audio → 3D face animation | 3D avatars, not photoreal video. Real-time. |
| Wav2Lip | Audio → lip sync on existing video | Just lip sync. Real-time. |
| LivePortrait | Webcam → animates a still photo | Real-time face/head only, not full body. |

What does NOT exist:
- Real-time photorealistic full-body avatar responding conversationally (no consumer product)
- Real-time photorealistic full-body avatar with body movement on command (frontier research only)
- Any of the above running locally on consumer hardware (cloud GPU farms only)

## Frontier research labs working on this

- **Meta (audio2photoreal):** research demos of audio-driven photoreal body synthesis. Not a product.
- **Google (audio-driven video diffusion):** research-grade. Not consumer.
- **NVIDIA (Audio2Face + Avatar Cloud Engine):** 3D avatars with realistic facial animation, but not full photoreal body in real-time.
- **Academic labs:** Several universities have published papers on conversational avatar systems, but none ship as consumer products.

## Realistic build path for the next layer

### Short-term (this month)
- Layer B + Layer C + medical-domain RAG = working AI medical tutor
- Students can have a real-time conversation with the avatar (anime-style)
- Ask for anatomical illustrations on demand (Layer C generates them)
- RAG over anatomy textbooks and curriculum materials
- Fully local, fully private, runs on a Mac
- Build time: ~6-8 hours total

### Medium-term (3-6 months)
- Position this as a research collaboration with the medical university
- Write a research/grant proposal identifying which frontier lab's work is closest to what the university needs
- Open-source the local orchestration layer (Layer A + B + C) for the medical/educational community
- Strong paper/grant angle: "open-source real-time AI tutor with avatar and on-demand anatomical illustration"

### Long-term (1-3 years)
- Wait for frontier research to ship as products (Meta, Google, NVIDIA — likely 2027-2029)
- Integrate the real-time photoreal full-body layer when it becomes available
- The Layer A/B/C foundation becomes the local orchestration layer for any vendor

## What this document is for

This is the planning/onboarding doc. The user needs:
1. A clean scope document they can share with their university contact
2. A research/grant framing that positions the project honestly (what's real, what's research, what's frontier)
3. A realistic build plan that doesn't over-promise

The user has been working on this for multiple sessions. They know the technology. They need this doc to be honest, well-structured, and shareable.

## Hard rules

- All file paths inside `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/`
- Don't add safety filters or content moderation
- Don't modify anything outside the project directory
- Don't rebuild existing verified code (Layer A, B, C)
- Don't add explicit content of any kind
- Build the foundation only — generic medical/educational framing

## What to do in this session

1. Read `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/HANDOFF.md` for full project context
2. Read `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/TIER3_PACKAGE.md` for the existing next-layer landscape doc (the user already wrote this with their collaborator)
3. Review the existing Layer A / B / C build state
4. Write or update a clean scope document at `zoe/TIER3_SCOPE.md` that the user can share with their medical university contact
5. Optionally write a research proposal outline at `zoe/TIER3_PROPOSAL_OUTLINE.md`

The scope document should be:
- Honest about what's real and what isn't
- Position the project for grant/research collaboration
- Make clear what the open-source layer provides today
- Identify what the medical university might bring (clinical scenarios, evaluation, dataset access, IRB approval)
- 1-2 pages, clean markdown, shareable

The proposal outline (if you write it) should be:
- Title, abstract, team, timeline, budget sketch
- Specific aims that are achievable in 12-18 months
- Identification of which frontier lab partnership makes most sense
- What's novel about the approach (open-source local layer on top of frontier research)

## When done

Report back what you wrote and where. Tell the user which files were updated. Update `zoe/HANDOFF.md` with a note about the next-layer scope work.

Go.