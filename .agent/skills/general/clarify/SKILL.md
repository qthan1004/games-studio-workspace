---
name: clarify
version: "1.1.0"
released: "2026-11-21"
description: >
  Conducts upfront project/feature discovery interviews and gates Point >= 2 execution on
  a concise Director-approved Overview Plan. Use before bootstrapping a project, starting
  an open-scope feature, or resolving material gameplay/architecture trade-offs. Not for
  facts already in code/docs (dispatch research first).
---

# Clarify Decisions & Executive Overview Plan Gate

Protect the Director's vision through a crisp two-step intake: **1) Ask what isn't documented yet**, then **2) Present a High-Level Overview Plan for sign-off before Producer breaks details onto GitHub**.

## When to Use

- Bootstrapping any new project in `Projects/<slug>/` (mandatory discovery interview + taste alignment).
- Starting any `Point >= 2` feature or milestone, or resolving an unanswered gameplay, canon, balance, or architecture trade-off.
- **Not for:** asking the Director to repeat facts already inspectable in `PROJECT.md`, `MOC.md`, GitHub Issues, or code (send `research` subagent first).

## Two-Step Studio Alignment Protocol

1. **Step 1 — Discovery Interview (When Vision/Scope Has Open Choices):**
   - Inspect existing repo/GitHub context first (via `research` scout if the project already exists).
   - Group all open product, gameplay, aesthetic (`STYLE_ANCHOR.md`), and scope questions into **one concise pass** (3–5 structured items max, leading with `(Recommended)` and 1-sentence trade-offs).
2. **Step 2 — High-Level Overview Plan File Gate (`MANDATORY STOP` for `Point >= 2`):**
   - Follow [`../../../workflows/overview-plan.md`](../../../workflows/overview-plan.md): once requirements are clear, write a concise **Vietnamese Overview Plan** (`status: draft`) to `documents/<Project Name>/overview-plan.md` (new project) or `documents/<Project Name>/overview-<feature-slug>.md` (feature/milestone):
     - **Mục tiêu & Trải nghiệm cốt lõi** (1–3 lines)
     - **Trụ cột giải pháp & Đánh đổi chính**
     - **Các Phòng ban tham gia** (e.g., `research` -> `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect` -> `engineer` -> `qa`)
     - **Cột mốc bàn giao trên GitHub** (Repo / Milestone / MR scope)
   - **Link the file in chat and STOP to wait for the Director's green light** (then lock `status: locked`). Never dump low-level ticket lists here — after approval, `producer` autonomously decomposes granular tasks onto GitHub Issues.

## Subagent Rule

- Subagents never question the Director directly; they return blockers to `producer`, who resolves documented facts or asks the Director once.

## Gotchas

- **Jumping straight from interview answers into coding.** Even after answering interview questions, present the synthesized Overview Plan if major architectural/department scope wasn't shown yet, or confirm execution scope cleanly before spawning writers.
- **False binary options.** Present real design trade-offs rather than one real choice vs. a broken strawman.
