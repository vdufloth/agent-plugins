# Changelog

## 0.5.0 - 2026-09-20

- Added the Humanizer skill from `akitaonrails/my-skills`, preserving its MIT
  attribution and adapting its OpenAI metadata for implicit invocation.
- Made cross-client discovery assertions derive the expected skill set from
  the canonical package tree, so adding or removing a skill no longer requires
  three hand-maintained CI lists.
- Added CI enforcement for skill-release version bumps and changelog entries.
  New skills require a minor-or-major increment; other skill changes require
  any newer semantic version.

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
