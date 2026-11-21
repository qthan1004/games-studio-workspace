---
name: cli-bridge
version: "1.0.0"
released: "2026-11-21"
description: >
  Prioritizes callable MCP tools and attaches deterministic JSON CLI bridges (CLI-Anything,
  gh, headless engine CLIs) instead of fragile GUI clicking. Use when querying knowledge
  vaults, managing GitHub boards, automating DCC apps (Blender, Krita, GIMP, Audacity,
  RenderDoc), or running headless engine checks. Not for authoring gameplay code (use engineer).
---

# MCP & Deterministic CLI Bridge

Operate software and project services through structured, machine-verifiable interfaces (`MCP` and `--json` CLIs) rather than brittle screenshot-and-click workarounds.

## When to Use

- Navigating project codebases, GitHub boards, design files, or Obsidian knowledge maps (`MOC.md`).
- Automating 2D/3D art, audio, diagramming, GPU profiling, or headless game runs via CLI.
- **Not for:** building in-game runtime features (`engineer`).

## Interface Priority Order

1. **Callable Project/Workspace MCPs first:**
   - Inspect available MCP tools for semantic code navigation, `obsidian` (`MOC.md` graph queries), `github` (Issues/PRs), Figma, or live Engine MCPs (Unity/Unreal/Godot/Roblox).
   - If a configured MCP is unavailable or lacks an operation, state the concrete gap briefly and fall back cleanly to CLI or targeted search — never guess tool results or extract raw tokens.
2. **Bundled Studio Node.js Tools (`--json`):**
   - GitHub board & issue ops: `node <workspace>/.agent/tools/gh-studio.mjs`
   - Staging & LFS checks: `node <workspace>/.agent/tools/inspect-staging.mjs`
   - Registry & MOC sync: `node <workspace>/.agent/tools/check-sync.mjs`
   - Test/build log digest: `node <workspace>/.agent/tools/log-digest.mjs`
3. **On-Demand DCC & Profiling Harnesses (`CLI-Anything` Pattern):**
   - When a specific game project needs automated batch operations in **Blender, Krita, GIMP, Inkscape, Live2D, ComfyUI, Audacity, MuseScore, Draw.io, Godot, RenderDoc, or UnrealInsights**, check local CLI availability first (`<tool> --version` or `cli-hub info <name>`).
   - Never bulk-install harnesses into the root workspace. Propose installing only the exact per-project CLI needed (with Director approval) and always invoke with `--json` + deterministic output verification.

## Gotchas

- **Trusting CLI exit 0 without inspecting artifacts.** An image/mesh CLI can exit 0 while producing fake checkerboard alpha or wrong dimensions; validate output metrics deterministically.
- **Binding mismatch.** Never query a language-server or vault MCP pointed at Project A while editing Project B (or a separate worktree).
