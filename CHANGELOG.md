# Changelog

## 0.4.0 - 2026-09-20

- Added a portable Agent Plugins 1.0 manifest as the canonical package identity
  and version source.
- Added a native Codex marketplace and OpenAI skill metadata, including an
  explicit-only policy for `devils-advocate`.
- Made contributor and skill instructions agent-neutral while retaining the
  existing Claude marketplace and compatibility manifest.
- Added package drift checks, installer tests, pinned CI validation, and
  disposable discovery smoke tests.
- Expanded the code-style bootstrap with Claude, Codex, explicit-target,
  preview, backup, idempotent replacement, and removal support.
- Documented managed versus editable installation routes, host compatibility,
  and the staged repository-rename decision.
