# ADR 0003: Rename the repository to agent-plugins

- Status: Accepted
- Date: 2026-09-20

## Context

The repository distributes one canonical plugin and its skills to Claude Code,
Codex, and other Agent Skills-compatible clients. The former GitHub slug,
`vdufloth/claude-plugins`, described only one supported host.

ADR 0002 deferred the rename until GitHub redirects and existing installation
updates could be tested independently from the original packaging migration.
Those checks passed after the 0.5.0 release.

## Decision

Rename the GitHub repository to `vdufloth/agent-plugins` for version 0.6.0.
Keep these installed identities unchanged:

- plugin name: `vdufloth`
- Claude marketplace: `vdufloth-claude-plugins`
- Codex marketplace: `vdufloth-agent-plugins`

Use the new slug in manifests, documentation, bootstrap URLs, and fresh
installation commands. Do not reuse the former repository name because doing
so would disable GitHub's redirects.

## Consequences

Fresh installations use `vdufloth/agent-plugins`. Existing GitHub web, clone,
fetch, push, raw-file, and archive routes continue through GitHub's redirect.
Existing Claude installations retain their marketplace and plugin IDs and can
update without reinstalling under a new identity.
