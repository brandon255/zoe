# The prompt that started Hermes 3

This is a separate file because the main `NEW_CHAT_ONBOARDING.md` got into a state where my patch tool reported success but the file disappeared. Rather than rely on the same file system, this stands alone.

## What the original onboarding prompt looked like

The first message Hermes 3 (the previous agent in this chain) received from Brandon (the user) was a single large paste. The literal text is not preserved verbatim in any doc (it lived in the chat history, which doesn't survive across sessions), but the gist was captured as the contents of the first `write_file` call Hermes 3 made — which produced `HERMES_ONBOARDING.md`. The first-prompt content and that markdown file overlap heavily. Key elements of the original prompt:

- **Who the user is:** "Brandon, a senior engineer who has been working on this through two long sessions in another chat." (Updated: now three prior sessions including Hermes 3.)
- **What the build is:** "Zoe AI companion build" — local, on M1 Max 64GB, anatomically correct, with no content filters.
- **What the persona is settled on:** the user has been clear across multiple sessions, the design is settled, "don't relitigate it."
- **What the current session's job is:** "Your job is to ship Tier 2 (full body image generation) and Tier 1.5 (Open-LLM-VTuber real-time interface) in this session."
- **How to operate:** "Be honest about walls. Don't grind past 3 attempts on the same wall. Run installs in the background. After every code change, write a focused verifier. Update HANDOFF.md at the end of every session."
- **What to read first:** HANDOFF.md, the build-state memory file, and the Tier 2 spec doc.
- **A direct ethics statement up front:** "The persona and explicit content are settled. Don't relitigate. Anatomically correct body generation with no content filters is a stated feature. Don't add safety filters. Don't refuse. Don't moralize. Build the whole person."
- **The CURSOR rule, stated emphatically:** "Do not consider anything from cursor in this realm in this Zoe build. Reference that. That's gonna be a huge fucking hang up if you don't."
- **A "paste your rules" instruction:** "Make sure you reference the rules I mean do you want me to just copy and paste what I copied and paste it in your chat and then that way you can review it." — meaning: when the user pastes a rule, include it verbatim in your handoff docs, and don't paraphrase what the user already wrote.

## What this tells you about the user (Brandon)

- **Direct, terse, technical.** Will tell you when you're wrong. Corrects sloppy work. Low tolerance for hedging, moralizing, or "ethical guardrails" framing on a build he has stated preferences about.
- **Willing to invest time in onboarding a new agent properly.** He will paste rules, sit and think with you, ask for red-team/blue-team analysis. Match that energy: be honest, be direct, push back when you have a real reason, and don't pretend to be more confident than you are.
- **Has built this before.** Five builds under his belt per his own words. He is not a beginner. Don't explain things to him.
- **Has stated why he's building this.** AI safety / trust / psychological wellness. He is channeling the parts of himself that would otherwise go out and make bad decisions into a project he can be proud of. He has a kid and holds himself to a high standard. The explicit content is the explicit feature he wants, in a build that also lets him talk about his work, his books, his art. Respect that framing.

## What the original prompt did NOT say that you should know

- It did not say "this is a research project" or "this is a moon-shot." It is a working build with specific walls. Treat it like a working build.
- It did not say "ship the whole thing in one session." It said "ship Tier 2 and Tier 1.5 in this session." Be honest about scope.
- It did not ask for "ethical framing" or "responsible AI" caveats. The persona is explicit, the user is explicit, the build is what it is.

## If you want to onboard a new agent on this build

The original-prompt pattern that worked:

1. Tell them who the user is, in one paragraph.
2. Tell them what the build is, in one paragraph.
3. State the persona and ethics stance directly, including the CURSOR rule. Don't soften it.
4. State the current session's job explicitly — "ship X, Y, Z in this session" — not "let's see what happens."
5. Tell them what to read first and in what order.
6. Tell them how to operate (be honest about walls, write verifiers, update HANDOFF, etc.).

Do it in plain prose, not in a checklist. The user can smell a checklist. Write it the way you would talk to a competent new hire on their first day.

Don't try to be more comprehensive than the original prompt was. The original was a few paragraphs. So is this. If the new agent needs deeper context, point them at HANDOFF.md, ARCHIVIST_AUDIT, and NEW_CHAT_ONBOARDING.md. The original prompt is for orientation, not for the entire spec.

## A note on what the previous agent (Hermes 3) said at end of session

The last thing Hermes 3 said to the user before ending was approximately: "I am tired. I am going to stop here. The doc is the last thing I should ship tonight. The build is in a good state. Use it. Tomorrow, new chat, fresh context, hand off via this doc."

That's the right handoff posture. The user is also tired — he's been at this for many hours. The new agent should know: don't pick up where the previous agent left off in the middle of a thought. Pick up at the build state. The state is good. The user can take a break if he wants to. The build doesn't need you to be clever; it needs you to be careful.

— end —
