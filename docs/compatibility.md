# Compatibility

The installation commands are maintained in the [README install
matrix](../README.md#install). Choose one route per host to avoid duplicate
skills.

## Capability matrix

| Distribution route | Explicit invocation | Implicit invocation | Isolated reviewers | Managed updates | Always-on instructions |
| --- | --- | --- | --- | --- | --- |
| Claude Code native plugin | Yes, `/vdufloth:<skill>` | Yes; disabled for `devils-advocate` | Available when Claude exposes subagents; serial fallback otherwise | Yes, through marketplace/plugin update | Optional bootstrap to `~/.claude/CLAUDE.md` |
| Codex native plugin | Yes, `$skill` or `/skills` | Yes; disabled for `devils-advocate` by `agents/openai.yaml` | Host/runtime dependent; serial fallback supported | Yes, through marketplace upgrade and plugin add | Optional bootstrap to `~/.codex/AGENTS.md` |
| `skills` CLI to Claude or Codex | Host-native skill invocation | Host dependent; OpenAI sidecars are retained when supported | Host/runtime dependent; serial fallback supported | Re-run `skills update` | Optional bootstrap for Claude or Codex |
| `skills` CLI to Cursor | Supported through Cursor's Agent Skills integration | Host dependent | Host dependent; serial fallback supported | Re-run `skills update` | Use `--target` only after confirming the desired Cursor instruction file |
| Portable Agent Plugins client | Defined by the client | Defined by the client | Client dependent; serial fallback supported | Defined by the client | Use `--target` for a documented host instruction file |

## Versions tested

Last checked on 2026-09-20:

| Component | Version |
| --- | --- |
| Agent Plugins specification | 1.0.0 |
| Agent Skills reference validator | 0.1.1 |
| Claude Code local validation | 2.1.278 |
| Codex CLI local discovery | 0.154.0 |
| `skills` CLI discovery | 1.7.0 |
| Node.js used by local checks | 26.8.1 |

CI pins its own tool versions in `.github/workflows/validate.yml` so upstream
releases do not silently change validation behavior.

## Behavior notes

- `devils-advocate` is explicit-only in Claude through
  `disable-model-invocation: true` and in Codex through
  `policy.allow_implicit_invocation: false`. A generic Agent Skills client may
  ignore both vendor controls; invoke it explicitly and consult that client's
  policy support.
- Claude-specific `argument-hint` and `disable-model-invocation` frontmatter is
  retained because Claude uses it and its strict validator accepts it. Agent
  Skills reference validator 0.1.1 reports those vendor fields as unexpected,
  so CI allowlists exactly those two findings while rejecting every other
  reference-validation error. Strict clients that reject all extensions may
  skip `devils-advocate`; Codex and the `skills` CLI accept the shipped file.
- Isolated subagent/background-agent review is not a portable Agent Skills
  capability. `devils-advocate` prefers it when present and discloses a
  separated serial-review fallback when absent.
- Plugin installation is normally sufficient. The bootstrap script duplicates
  only the `code-style` instruction body into a user-selected always-on file;
  do not use it if duplicate instructions are undesirable.
- A repository Codex marketplace makes the plugin discoverable but does not
  auto-enable it. This repository intentionally has no `.codex/config.toml`.
- The bundled `plugin-creator` scaffold validator currently requires the legacy
  `.codex-plugin/plugin.json` layout. This package intentionally uses the
  documented portable root manifest instead, so validation uses the Agent
  Plugins 1.0 schema plus an actual Codex marketplace discovery/install test.
- Native plugin update behavior is host-managed. Editable `skills` copies are
  updated with the `skills` CLI and should not be installed alongside the
  native plugin.

## Behavioral smoke checklist

Before a release, verify in clean or disposable profiles:

- A code-edit request can activate `code-style` implicitly.
- A prose-edit request can activate `humanizer` implicitly without changing
  the source's facts or meaning.
- A branch-review request can activate `review-current-work` implicitly.
- `devils-advocate` does not activate implicitly in Claude or Codex.
- Explicit `devils-advocate` accepts a plan path and `--quick`.
- `devils-advocate` completes with an isolated reviewer and with the serial
  fallback.
- All skills find repository guidance through `AGENTS.md`, `CLAUDE.md`,
  `README.md`, or `CONTRIBUTING.md` when those files exist.

Static and discovery checks are automated. Model-trigger behavior remains a
release smoke test because it depends on the selected model and host runtime.
