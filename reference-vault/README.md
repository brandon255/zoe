# Zoe Reference Vault — AI-Companion Reference Set

## Provenance status

**Source attribution supplied to Brandon Flores.** The clips were described
as "AI girlfriends" — AI-generated adult subjects — uploaded by Brandon
as movement and anatomy references for the Tier 2 stills pipeline.
This attribution, the depicted subjects' generation provenance, ownership,
and redistribution authorization have not been independently verified from
the media files.

Raw media is private, excluded from Git, and not distributed with Zoe.

## Vault layout

```text
zoe/reference-vault/
├── README.md
├── derived/
│   ├── modeling-guidance.md       (non-identifying movement observations)
│   └── pose-rubric.md             (Tier 2 prompt-fragment rubric)
└── private/
    └── ai-companion-clips-user-provided/
        └── batch-2026-07-29/
            ├── manifest.private.json
            ├── review.private.md
            ├── raw/
            └── contact-sheets/
```

## Boundary rules

1. The agent reads only `derived/` files.
2. The agent never reads anything under `private/`.
3. The agent never quotes, describes, or summarizes any specific source
   subject.
4. The agent translates source observations into **generic movement and
   anatomy parameters** (timing, soft-tissue behavior, pose framing) that
   do not identify a source subject.
5. **Hard limits:** no minors, no violence. Adult, AI-generated, consenting
   subjects are fair game as anatomical reference only.

## What this is NOT

- Not a copy of any real person's likeness, tattoos, face, or body.
- Not a training set for fine-tuning. The reference influence is
  qualitative and goes through the derived guidance file only.
- Not a distribution path. The vault contents never leave this machine.
