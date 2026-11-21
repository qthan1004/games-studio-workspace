---
name: clarify
version: "1.0.0"
released: "2026-11-21"
description: >
  Resolves consequential gameplay, canon, scope, or architecture decisions with concise
  evidence-backed options before dependent edits. Use when an unanswered choice changes
  player experience, win/lose rules, save format, or MVP scope, or when asked to interview.
  Not for facts already answerable by inspecting code, docs, or GitHub Issues.
---

# Clarify Material Decisions

Protect the Director's vision without stalling momentum: investigate everything inspectable first, then ask only the smallest resolving question with clear trade-offs.

## When to Use

- An unresolved choice changes core gameplay feel, win/lose rules, balance philosophy, canon lore, save/network compatibility, or milestone scope.
- The Director explicitly requests a discovery interview or design trade-off breakdown.
- **Not for:** locating files/values already in the repo, or routine reversible implementation details (state a `[ASSUMPTION]` and proceed).

## Protocol

1. **Exhaust local & GitHub evidence first:** Check `PROJECT.md`, `STYLE_ANCHOR.md`, `departments/MOC.md`, `registry.yaml`, active GitHub Issues, and code. Never ask the user to repeat documented facts.
2. **Frame what is at stake:** State the confirmed facts in 1–2 lines, name the exact unresolved decision, and explain what downstream work depends on it.
3. **Present 2–3 concrete options:**
   - Lead with `(Recommended)` when project pillars or genre precedent support one choice; otherwise label it an open creative call.
   - For each option, state the player-facing or technical trade-off in one sentence.
   - Use the host's structured question tool when available for multi-choice decisions, or ask concisely in plain text.
4. **Hold only the dependent slice:** Continue any authorized independent work while waiting. Silence, a skipped prompt, or *"make it fast"* is never consent to invent a core rule.
5. **Subagent rule:** Subagents never question the Director directly; they return structured questions to `producer` (main-chat Captain), who resolves known facts or asks the Director once.

## Gotchas

- **Multi-round interrogation.** Group related questions into one tight pass (at most 3–4 items) rather than dripping one question per turn.
- **False binary.** Offering one viable option alongside an obviously broken strawman wastes the Director's time; present real design alternatives.
- **Re-asking settled decisions.** Once answered, record the decision in the relevant spec/Issue and proceed without asking for a second confirmation.
