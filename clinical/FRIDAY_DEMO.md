# Friday clinical demo — Zoe

**GOAL:** Screen-share a gyn exam training loop: doctor commands → Zoe responds → atlas + tray update.

## HOW TO OPEN (Mac)

1. Finder → `zoe/clinical/`
2. Or Terminal:

```bash
cd ~/Desktop/doctrine-labs/zoe/clinical
npm install
npm run dev
```

3. Open the Vite URL printed in the terminal.

## Demo spine (say aloud)

1. Select **Zoe** patient case  
2. Start encounter → gown → table → stirrups → lithotomy  
3. Pick **speculum** from tray → insert → open → inspect  
4. Say **husband present** → **husband take the camera** (flythrough canal → cervix)  
5. Atlas view swaps with each beat (when atlas files present)  
6. Encounter mode for LLM patient replies (paste hosted API key in Settings)

## World modes (same chassis)

| Switch | Pack | Hard rails |
|--------|------|------------|
| **Clinical** | Zoe annual gyn + medical personas | No minors · no violence (+ full clinical tone) |
| **Pizarro** | Red-team / acute freak-out | **Only** absolute bans: no minors · no violence |

Flip the header toggle. Encounter mode loads the matching persona + system prompt. No second server.


## Honest narrative

This is a **down payment** on a 2027-style iPad trainer (Zoom UI + utensil library + wardrobe + longitudinal patient). Friday ships: atlas + tray + commands + hosted chat — not live soft-tissue generative video.
