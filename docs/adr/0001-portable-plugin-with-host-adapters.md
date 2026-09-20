# ADR 0001: Portable plugin with host adapters

- Status: Accepted
- Date: 2026-09-20

## Context

This repository began as a Claude Code marketplace. It now targets Claude
Code, Codex, and clients that consume Agent Skills or Agent Plugins packages.
Each host has small metadata differences, but the skills themselves describe
the same workflows.

## Decision

The portable Agent Plugins manifest and the canonical `skills/` tree live in
`plugins/vdufloth`. The root `plugin.json` is the source of identity and
version metadata. Claude and Codex marketplace files are distribution
adapters; Claude also retains its compatibility manifest. OpenAI-only skill
presentation and invocation policy live in `agents/openai.yaml` sidecars.

## Consequences

- Every skill has one source, so fixes cannot diverge between hosts.
- Several small metadata surfaces remain and require automated version,
  identity, path, documentation, and discovery checks.
- Host-specific behavior must live in a supported sidecar or be clearly
  documented in compatible frontmatter.
- A host that lacks isolated subagents can still run `devils-advocate` through
  its documented serial-review fallback.

## Rejected alternatives

- Duplicated skill trees would drift and obscure the canonical source.
- Symlink projections are not portable across archives, operating systems, or
  all clients.
- Flattening the repository would discard the existing multi-plugin catalog
  shape and make sibling plugins harder to add.
- Relying only on `npx skills` would remove the managed Claude and Codex
  install/update experience.
